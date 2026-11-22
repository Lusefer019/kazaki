import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyNewOrders: boolean;
  allowStatusUpdateFromBot: boolean;
  dailyReportEnabled: boolean;
  dailyReportHour: number; // 0 - 23 (default 22:00)
}

const DEFAULT_CONFIG: TelegramBotConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  enabled: false,
  notifyNewOrders: true,
  allowStatusUpdateFromBot: true,
  dailyReportEnabled: true,
  dailyReportHour: 22,
};

const DATA_DIR = path.resolve(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'bot_config.json');

// Memory state
let currentConfig: TelegramBotConfig = { ...DEFAULT_CONFIG };
let pollingActive = false;
let pollingAbortController: AbortController | null = null;
let lastUpdateId = 0;
let lastDailyReportDate = '';
let botInfoCache: any = null;

// Callbacks registered from server
type GetOrdersFn = () => any[];
type UpdateOrderStatusFn = (id: string, status: string, note?: string) => Promise<any> | any;

let getOrdersCallback: GetOrdersFn = () => [];
let updateOrderStatusCallback: UpdateOrderStatusFn = () => null;

/**
 * Load bot configuration from disk or environment
 */
export function loadBotConfig(): TelegramBotConfig {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      currentConfig = {
        ...DEFAULT_CONFIG,
        ...data,
        botToken: data.botToken || process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: data.chatId || process.env.TELEGRAM_CHAT_ID || '',
      };
    } else {
      currentConfig = {
        ...DEFAULT_CONFIG,
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      };
      saveBotConfig(currentConfig);
    }
  } catch (err) {
    console.warn('[TelegramBot] Failed to load config, using defaults:', err);
    currentConfig = { ...DEFAULT_CONFIG };
  }
  return currentConfig;
}

/**
 * Save bot configuration to disk
 */
export function saveBotConfig(newConfig: Partial<TelegramBotConfig>): TelegramBotConfig {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    currentConfig = { ...currentConfig, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2), 'utf8');
  } catch (err) {
    console.error('[TelegramBot] Error saving config:', err);
  }
  return currentConfig;
}

/**
 * Low-level Telegram Bot API Request
 */
async function callTelegramApi(token: string, method: string, payload?: any, signal?: AbortSignal): Promise<any> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('Telegram Bot Token is missing');
  }
  const apiBase = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '');
  const url = `${apiBase}/bot${cleanToken}/${method}`;
  const effectiveSignal = signal || AbortSignal.timeout(12000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: effectiveSignal,
  });

  const data = await response.json().catch(() => ({ ok: false, description: 'Invalid JSON response from Telegram' }));
  if (!data.ok) {
    throw new Error(data.description || `Telegram API error on ${method}`);
  }
  return data.result;
}

/**
 * Fetch bot profile information
 */
export async function getBotInfo(token?: string): Promise<any> {
  const t = token || currentConfig.botToken;
  if (!t) return null;
  try {
    const info = await callTelegramApi(t, 'getMe');
    botInfoCache = info;
    return info;
  } catch (err: any) {
    botInfoCache = null;
    return null;
  }
}

/**
 * Send an HTML formatted message with optional keyboard
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: {
    replyMarkup?: any;
    token?: string;
  }
): Promise<any> {
  const token = options?.token || currentConfig.botToken;
  if (!token || !chatId) {
    throw new Error('Telegram token or Chat ID is missing');
  }

  const payload: any = {
    chat_id: chatId.trim(),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  if (options?.replyMarkup) {
    payload.reply_markup = options.replyMarkup;
  }

  return callTelegramApi(token, 'sendMessage', payload);
}

/**
 * Edit an existing message text & keyboard
 */
export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: any,
  token?: string
): Promise<any> {
  const t = token || currentConfig.botToken;
  if (!t || !chatId) return null;

  const payload: any = {
    chat_id: chatId.trim(),
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  if (replyMarkup !== undefined) {
    payload.reply_markup = replyMarkup;
  }

  try {
    return await callTelegramApi(t, 'editMessageText', payload);
  } catch (err) {
    console.warn('[TelegramBot] Edit message warning:', err);
    return null;
  }
}

/**
 * Answer inline button callback queries
 */
export async function answerTelegramCallback(
  callbackId: string,
  text?: string,
  showAlert = false,
  token?: string
): Promise<any> {
  const t = token || currentConfig.botToken;
  if (!t) return null;
  try {
    return await callTelegramApi(t, 'answerCallbackQuery', {
      callback_query_id: callbackId,
      text: text || '',
      show_alert: showAlert,
    });
  } catch (err) {
    return null;
  }
}

/**
 * Send a generated file (CSV/Excel) to Telegram chat
 */
export async function sendTelegramDocument(
  chatId: string,
  fileName: string,
  fileContent: string | Uint8Array,
  caption?: string,
  token?: string
): Promise<any> {
  const t = token || currentConfig.botToken;
  if (!t || !chatId) {
    throw new Error('Missing Telegram token or chat ID');
  }

  const apiBase = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '');
  const url = `${apiBase}/bot${t.trim()}/sendDocument`;
  const formData = new FormData();
  formData.append('chat_id', chatId.trim());

  if (caption) {
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
  }

  const blobPart: BlobPart = typeof fileContent === 'string' ? fileContent : new Uint8Array(fileContent);
  const blob = new Blob([blobPart], { type: 'text/csv;charset=utf-8;' });
  formData.append('document', blob, fileName);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(20000),
  });

  const resJson = await response.json();
  if (!resJson.ok) {
    throw new Error(resJson.description || 'Failed to send document to Telegram');
  }
  return resJson.result;
}

/**
 * Standard Reply Keyboard for persistent navigation
 */
function getMainReplyKeyboard() {
  return {
    keyboard: [
      [{ text: '📊 تقرير اليوم' }, { text: '📈 تقرير الأسبوع' }],
      [{ text: '📑 تقرير شامل' }, { text: '⏳ الطلبات المعلقة' }],
      [{ text: '📁 تصدير ملف إكسل' }, { text: 'ℹ️ مساعدة وأوامر' }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

/**
 * Format status Arabic badge
 */
export function getStatusBadgeArabic(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳ قيد الانتظار';
    case 'processing':
      return '📦 قيد التجهيز';
    case 'shipped':
      return '🚚 تم الشحن والتوصيل';
    case 'delivered':
      return '✅ تم التسليم';
    case 'cancelled':
      return '❌ ملغي';
    default:
      return status;
  }
}

/**
 * Format Order Alert Message for Telegram
 */
export function formatOrderAlert(order: any, storeName = 'KAZAKI.IQ'): { text: string; inlineKeyboard: any } {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items
    .map((it: any, idx: number) => {
      const title = it.product?.title || it.title || 'منتج غير مسمى';
      const qty = it.quantity || 1;
      const price = (it.product?.price || it.price || 0) * qty;
      return `  ▫️ <b>${title}</b> × ${qty} (${price.toLocaleString('ar-IQ')} د.ع)`;
    })
    .join('\n');

  const paymentText =
    order.paymentMethod === 'cod'
      ? 'الدفع عند الاستلام (COD)'
      : order.paymentMethod === 'card'
      ? 'بطاقة دفع إلكتروني'
      : order.paymentMethod || 'الدفع عند الاستلام';

  const text = `
💐 <b>طلب جديد وارد في ${storeName}!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>رقم الطلب:</b> <code>#${order.id}</code>
📦 <b>رمز التتبع:</b> <code>${order.trackingNumber || order.id}</code>
👤 <b>الزبون:</b> ${order.customerName}
📞 <b>الهاتف:</b> <code>${order.customerPhone}</code>
📍 <b>المحافظة / المدينة:</b> ${order.city}
🏠 <b>العنوان:</b> ${order.address}
${order.notes ? `📝 <b>ملاحظات الزبون:</b> ${order.notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━
🛒 <b>المنتجات المطلوبة (${items.length}):</b>
${itemsText || '  (لا توجد منتجات محددة)'}

💰 <b>مجموع المنتجات:</b> ${(order.totalAmount || 0).toLocaleString('ar-IQ')} د.ع
${order.discountAmount ? `🏷️ <b>الخصم المطبق:</b> -${order.discountAmount.toLocaleString('ar-IQ')} د.ع\n` : ''}🚚 <b>أجور التوصيل:</b> ${(order.shippingFee || 0).toLocaleString('ar-IQ')} د.ع
💵 <b>المبلغ النهائي المستحق:</b> <b>${(order.finalAmount || 0).toLocaleString('ar-IQ')} د.ع</b>
💳 <b>طريقة الدفع:</b> ${paymentText}
⏰ <b>الوقت:</b> ${new Date(order.createdAt || Date.now()).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' })}
━━━━━━━━━━━━━━━━━━━━
<i>اضغط على أحد الأزرار أدناه للتحكم بحالة الطلب فوراً:</i>
`.trim();

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '📦 بدء التجهيز', callback_data: `st:processing:${order.id}` },
        { text: '🚚 تم الشحن', callback_data: `st:shipped:${order.id}` },
      ],
      [
        { text: '✅ تم التسليم', callback_data: `st:delivered:${order.id}` },
        { text: '❌ إلغاء الطلب', callback_data: `st:cancelled:${order.id}` },
      ],
    ],
  };

  return { text, inlineKeyboard };
}

/**
 * Report: Today's Orders & Revenue
 */
export function generateTodayReport(orders: any[], storeName = 'KAZAKI.IQ'): string {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todayOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    return o.createdAt.slice(0, 10) === todayStr;
  });

  const count = todayOrders.length;
  const totalRevenue = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  const pendingCount = todayOrders.filter((o) => o.status === 'pending').length;
  const processingCount = todayOrders.filter((o) => o.status === 'processing').length;
  const shippedCount = todayOrders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = todayOrders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = todayOrders.filter((o) => o.status === 'cancelled').length;

  // Top governorate today
  const citiesMap: Record<string, number> = {};
  todayOrders.forEach((o) => {
    const c = o.city || 'أخرى';
    citiesMap[c] = (citiesMap[c] || 0) + 1;
  });
  const topCities = Object.entries(citiesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, n]) => `${c} (${n})`)
    .join('، ') || 'لا توجد طلبات بعد';

  return `
📊 <b>تقرير مبيعات اليوم - ${storeName}</b>
📅 <b>التاريخ:</b> ${now.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Baghdad' })}
━━━━━━━━━━━━━━━━━━━━
📦 <b>إجمالي طلبات اليوم:</b> <b>${count}</b> طلب
💰 <b>إجمالي الإيرادات اليوم:</b> <b>${totalRevenue.toLocaleString('ar-IQ')} د.ع</b>

📈 <b>توزيع الحالات لطلبات اليوم:</b>
▫️ ⏳ قيد الانتظار: <b>${pendingCount}</b>
▫️ 📦 قيد التجهيز: <b>${processingCount}</b>
▫️ 🚚 تم الشحن: <b>${shippedCount}</b>
▫️ ✅ تم التسليم: <b>${deliveredCount}</b>
▫️ ❌ ملغية: <b>${cancelledCount}</b>

📍 <b>أكثر المحافظات طلباً اليوم:</b>
${topCities}
━━━━━━━━━━━━━━━━━━━━
<i>تحديث تلقائي وفوري من قاعدة بيانات المتجر</i>
`.trim();
}

/**
 * Report: Past 7 Days Weekly Report
 */
export function generateWeekReport(orders: any[], storeName = 'KAZAKI.IQ'): string {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weekOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    return new Date(o.createdAt) >= sevenDaysAgo;
  });

  const count = weekOrders.length;
  const totalRevenue = weekOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  const delivered = weekOrders.filter((o) => o.status === 'delivered').length;
  const pending = weekOrders.filter((o) => o.status === 'pending').length;
  const avgOrder = count > 0 ? Math.round(totalRevenue / count) : 0;

  return `
📈 <b>تقرير الأسبوع (آخر 7 أيام) - ${storeName}</b>
━━━━━━━━━━━━━━━━━━━━
📦 <b>مجموع الطلبات:</b> <b>${count}</b> طلب
💵 <b>إجمالي المبيعات:</b> <b>${totalRevenue.toLocaleString('ar-IQ')} د.ع</b>
🎯 <b>متوسط قيمة السلة:</b> <b>${avgOrder.toLocaleString('ar-IQ')} د.ع</b>

📊 <b>مؤشرات الإنجاز:</b>
▫️ طلبات تم تسليمها بنجاح: <b>${delivered}</b>
▫️ طلبات لا تزال معلقة: <b>${pending}</b>
▫️ نسبة الإنجاز: <b>${count > 0 ? Math.round((delivered / count) * 100) : 0}%</b>
━━━━━━━━━━━━━━━━━━━━
<i>بوت تقارير KAZAKI.IQ التفاعلي</i>
`.trim();
}

/**
 * Report: Lifetime Comprehensive Overview
 */
export function generateFullReport(orders: any[], storeName = 'KAZAKI.IQ'): string {
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  const pending = orders.filter((o) => o.status === 'pending').length;
  const processing = orders.filter((o) => o.status === 'processing').length;
  const shipped = orders.filter((o) => o.status === 'shipped').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;

  // Total items sold
  let totalItemsCount = 0;
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        totalItemsCount += Number(it.quantity) || 1;
      });
    }
  });

  return `
📑 <b>التقرير الشامل التراكمي - ${storeName}</b>
━━━━━━━━━━━━━━━━━━━━
🛍️ <b>إجمالي عدد الطلبات المسجلة:</b> <b>${totalOrders}</b> طلب
💰 <b>إجمالي الإيرادات الكلية:</b> <b>${totalRevenue.toLocaleString('ar-IQ')} د.ع</b>
🌸 <b>إجمالي القطع والورود المباعة:</b> <b>${totalItemsCount}</b> قطعة

📊 <b>حالات الطلبات بالكامل:</b>
▫️ ⏳ معلقة بالانتظار: <b>${pending}</b>
▫️ 📦 جاري تجهيزها: <b>${processing}</b>
▫️ 🚚 مشحونة بالطريق: <b>${shipped}</b>
▫️ ✅ تم تسليمها بنجاح: <b>${delivered}</b>
▫️ ❌ ملغية: <b>${cancelled}</b>

🏆 <b>نسبة نجاح التسليم:</b> <b>${totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0}%</b>
━━━━━━━━━━━━━━━━━━━━
<i>متاح تصدير كامل البيانات بصيغة Excel عبر أمر /export</i>
`.trim();
}

/**
 * List Pending Orders for Quick Action
 */
export function generatePendingOrdersMessage(orders: any[]): { text: string; inlineKeyboard: any } {
  const pending = orders.filter((o) => o.status === 'pending');

  if (pending.length === 0) {
    return {
      text: `🎉 <b>رائع جداً! لا توجد أي طلبات معلقة حالياً.</b>\nجميع الطلبات تمت معالجتها وشحنها بنجاح!`,
      inlineKeyboard: undefined,
    };
  }

  const latestPending = pending.slice(0, 5);
  const itemsText = latestPending
    .map((o, idx) => {
      const itemsCount = Array.isArray(o.items) ? o.items.length : 1;
      return `${idx + 1}. <b>#${o.id}</b> - ${o.customerName} (${o.city})\n   📞 <code>${o.customerPhone}</code> | 💰 ${(o.finalAmount || 0).toLocaleString('ar-IQ')} د.ع (${itemsCount} منتج)`;
    })
    .join('\n\n');

  const text = `
⏳ <b>قائمة الطلبات المعلقة (${pending.length} طلب بحاجة لمتابعة):</b>
━━━━━━━━━━━━━━━━━━━━
${itemsText}
━━━━━━━━━━━━━━━━━━━━
${pending.length > 5 ? `<i>يوجد ${pending.length - 5} طلبات أخرى أيضاً في لوحة الإدارة.</i>\n` : ''}👇 اختر طلباً للبدء بتجهيزه فوراً:
`.trim();

  // Create inline buttons for first 3 pending orders
  const buttons: any[] = [];
  latestPending.slice(0, 3).forEach((o) => {
    buttons.push([
      { text: `📦 تجهيز #${o.id.slice(-6)}`, callback_data: `st:processing:${o.id}` },
      { text: `❌ إلغاء #${o.id.slice(-6)}`, callback_data: `st:cancelled:${o.id}` },
    ]);
  });

  return { text, inlineKeyboard: { inline_keyboard: buttons } };
}

/**
 * Generate UTF-8 BOM CSV / Excel File for All Orders
 */
export function generateOrdersCsv(orders: any[]): string {
  // UTF-8 BOM ensures Excel on Windows/Mac opens Arabic text without garbled characters
  const BOM = '\uFEFF';
  const headers = [
    'رقم الطلب',
    'رمز التتبع',
    'تاريخ الطلب',
    'اسم الزبون',
    'رقم الهاتف',
    'البريد الإلكتروني',
    'المحافظة',
    'العنوان التفصيلي',
    'طريقة الدفع',
    'حالة الطلب',
    'عدد المنتجات',
    'المجموع الفرعي (د.ع)',
    'الخصم (د.ع)',
    'أجور التوصيل (د.ع)',
    'المبلغ النهائي (د.ع)',
    'المنتجات المطلوبة',
    'ملاحظات الزبون',
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = orders.map((o) => {
    const itemsList = Array.isArray(o.items)
      ? o.items.map((it: any) => `${it.product?.title || it.title || 'منتج'} (x${it.quantity || 1})`).join(' + ')
      : '';

    return [
      escapeCsv(o.id),
      escapeCsv(o.trackingNumber || o.id),
      escapeCsv(o.createdAt ? new Date(o.createdAt).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' }) : ''),
      escapeCsv(o.customerName),
      escapeCsv(o.customerPhone),
      escapeCsv(o.customerEmail || ''),
      escapeCsv(o.city),
      escapeCsv(o.address),
      escapeCsv(o.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'),
      escapeCsv(getStatusBadgeArabic(o.status)),
      escapeCsv(Array.isArray(o.items) ? o.items.length : 1),
      escapeCsv(o.totalAmount || 0),
      escapeCsv(o.discountAmount || 0),
      escapeCsv(o.shippingFee || 0),
      escapeCsv(o.finalAmount || 0),
      escapeCsv(itemsList),
      escapeCsv(o.notes || ''),
    ].join(',');
  });

  return BOM + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Handle incoming message from Telegram
 */
async function handleTelegramMessage(msg: any): Promise<void> {
  const chatId = String(msg.chat?.id || '');
  const text = (msg.text || '').trim();

  // If user sends /start
  if (text === '/start') {
    const welcomeText = `
👋 <b>أهلاً بك في بوت متجر KAZAKI.IQ لإدارة الطلبات والتقارير!</b> 🌸
━━━━━━━━━━━━━━━━━━━━
تم ربط البوت بنجاح مع المتجر وقاعدة البيانات.

🔹 <b>وظائف البوت:</b>
• تلقي إشعار فوري عند كل طلب جديد مع كامل بيانات الزبون.
• أزرار تفاعلية لتغيير حالة الطلب مباشرة (تجهيز، شحن، تسليم، إلغاء).
• تقارير يومية وأسبوعية وشاملة للمبيعات والأرباح.
• تصدير ملفات إكسل شاملة للطلبات بكبسة زر واحدة.

<b>معرف المحادثة الخاص بك (Chat ID):</b> <code>${chatId}</code>
━━━━━━━━━━━━━━━━━━━━
👇 اختر من القائمة أدناه أو اكتب الأمر مباشرة:
`.trim();

    await sendTelegramMessage(chatId, welcomeText, {
      replyMarkup: getMainReplyKeyboard(),
    });
    return;
  }

  // /help or مساعدة
  if (text === '/help' || text.includes('مساعدة') || text.includes('أوامر')) {
    const helpText = `
📖 <b>قائمة الأوامر المتاحة في البوت:</b>
━━━━━━━━━━━━━━━━━━━━
📊 <code>/today</code> - عرض تقرير مبيعات وطلبات اليوم
📈 <code>/week</code> - تقرير الأسبوع الماضي (آخر 7 أيام)
📑 <code>/report</code> - التقرير الشامل والمبيعات الكلية
⏳ <code>/pending</code> - عرض الطلبات المعلقة مع أزرار الإجراء السريع
📁 <code>/export</code> - تحميل ملف Excel/CSV كامل لجميع الطلبات
🔎 أو اكتب رقم أي طلب (مثال: <code>ORD-6518</code>) لعرض تفاصيله الكاملة والتحكم بحالته!
━━━━━━━━━━━━━━━━━━━━
`.trim();
    await sendTelegramMessage(chatId, helpText, { replyMarkup: getMainReplyKeyboard() });
    return;
  }

  // Orders array
  const orders = getOrdersCallback() || [];

  // /today or تقرير اليوم
  if (text === '/today' || text.includes('تقرير اليوم')) {
    const report = generateTodayReport(orders);
    await sendTelegramMessage(chatId, report, { replyMarkup: getMainReplyKeyboard() });
    return;
  }

  // /week or تقرير الأسبوع
  if (text === '/week' || text.includes('تقرير الأسبوع')) {
    const report = generateWeekReport(orders);
    await sendTelegramMessage(chatId, report, { replyMarkup: getMainReplyKeyboard() });
    return;
  }

  // /report or تقرير شامل
  if (text === '/report' || text.includes('تقرير شامل') || text.includes('احصائيات')) {
    const report = generateFullReport(orders);
    await sendTelegramMessage(chatId, report, { replyMarkup: getMainReplyKeyboard() });
    return;
  }

  // /pending or الطلبات المعلقة
  if (text === '/pending' || text.includes('الطلبات المعلقة') || text.includes('معلقة')) {
    const { text: pendingMsg, inlineKeyboard } = generatePendingOrdersMessage(orders);
    await sendTelegramMessage(chatId, pendingMsg, {
      replyMarkup: inlineKeyboard || getMainReplyKeyboard(),
    });
    return;
  }

  // /export or تصدير ملف إكسل
  if (text === '/export' || text === '/excel' || text.includes('إكسل') || text.includes('اكسل') || text.includes('تصدير')) {
    await sendTelegramMessage(chatId, '⏳ جاري تجهيز واستخراج ملف الإكسل...');
    const csvContent = generateOrdersCsv(orders);
    const fileName = `Kazaki_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    await sendTelegramDocument(
      chatId,
      fileName,
      csvContent,
      `📁 <b>ملف جميع طلبيات متجر KAZAKI.IQ (${orders.length} طلب)</b>\n📅 ${new Date().toLocaleDateString('ar-IQ')}`
    );
    return;
  }

  // Search by Order ID if text matches format or starts with ORD or digits
  const cleanQuery = text.replace('#', '').trim();
  const matchedOrder = orders.find(
    (o) =>
      o.id.toLowerCase() === cleanQuery.toLowerCase() ||
      (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(cleanQuery.toLowerCase())
  );

  if (matchedOrder) {
    const { text: orderDetails, inlineKeyboard } = formatOrderAlert(matchedOrder);
    await sendTelegramMessage(chatId, `🔍 <b>تم العثور على الطلب:</b>\n\n${orderDetails}`, {
      replyMarkup: inlineKeyboard,
    });
    return;
  }

  // Default unrecognized input
  await sendTelegramMessage(
    chatId,
    `لم أفهم هذا الأمر. يمكنك استخدام الأزرار في الأسفل أو كتابة /help لمعرفة الأوامر المتاحة.`,
    { replyMarkup: getMainReplyKeyboard() }
  );
}

/**
 * Handle inline button click (Callback Query)
 */
async function handleTelegramCallbackQuery(cb: any): Promise<void> {
  const cbId = cb.id;
  const data = cb.data || '';
  const message = cb.message;
  const chatId = String(message?.chat?.id || '');
  const messageId = message?.message_id;

  if (!data.startsWith('st:')) {
    await answerTelegramCallback(cbId, 'إجراء غير معروف');
    return;
  }

  // Format: st:<newStatus>:<orderId>
  const parts = data.split(':');
  const newStatus = parts[1];
  const orderId = parts.slice(2).join(':');

  if (!orderId || !newStatus) {
    await answerTelegramCallback(cbId, 'بيانات الطلب غير صالحة');
    return;
  }

  try {
    const result = await updateOrderStatusCallback(
      orderId,
      newStatus,
      `تم تحديث الحالة عبر بوت تيليجرام بواسطة الإدارة`
    );

    const statusName = getStatusBadgeArabic(newStatus);
    await answerTelegramCallback(cbId, `تم تغيير حالة الطلب #${orderId} إلى: ${statusName} ✅`, true);

    // Edit message text in Telegram to append confirmation banner
    if (message?.text && messageId) {
      const originalText = message.text;
      const updatedBanner = `\n\n━━━━━━━━━━━━━━━━━━━━\n🔄 <b>حالة الطلب الآن:</b> ${statusName}\n👤 <i>تم التحديث بواسطة الإدارة عبر البوت بنجاح</i>`;
      await editTelegramMessage(chatId, messageId, originalText + updatedBanner, {
        inline_keyboard: [
          [
            { text: `الحالة الحالية: ${statusName}`, callback_data: `noop` }
          ]
        ]
      });
    }
  } catch (err: any) {
    await answerTelegramCallback(cbId, `فشل تحديث الحالة: ${err.message || 'خطأ'}`);
  }
}

/**
 * Long-polling loop for Telegram updates
 */
async function startPollingLoop(): Promise<void> {
  if (pollingActive) return;
  pollingActive = true;
  pollingAbortController = new AbortController();

  console.log('[TelegramBot] Polling loop started.');

  while (pollingActive) {
    if (!currentConfig.enabled || !currentConfig.botToken) {
      // Sleep a bit and check again
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    try {
      const token = currentConfig.botToken.trim();
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;

      const res = await fetch(url, {
        signal: pollingAbortController?.signal,
      });

      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }

      const resJson = await res.json();
      if (resJson.ok && Array.isArray(resJson.result)) {
        for (const update of resJson.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);

          if (update.message) {
            handleTelegramMessage(update.message).catch((e) =>
              console.error('[TelegramBot] Error handling message:', e)
            );
          } else if (update.callback_query) {
            handleTelegramCallbackQuery(update.callback_query).catch((e) =>
              console.error('[TelegramBot] Error handling callback query:', e)
            );
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        break;
      }
      // Network hiccup: wait 5s then retry
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log('[TelegramBot] Polling loop stopped.');
}

/**
 * Check if it's time for daily report
 */
function checkDailyScheduledReport(): void {
  if (!currentConfig.enabled || !currentConfig.dailyReportEnabled || !currentConfig.chatId) {
    return;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().slice(0, 10);

  if (currentHour === currentConfig.dailyReportHour && lastDailyReportDate !== todayStr) {
    lastDailyReportDate = todayStr;
    const orders = getOrdersCallback() || [];
    const reportText = `🌙 <b>التقرير اليومي التلقائي للإدارة:</b>\n\n` + generateTodayReport(orders);

    sendTelegramMessage(currentConfig.chatId, reportText, {
      replyMarkup: getMainReplyKeyboard(),
    }).catch((e) => console.warn('[TelegramBot] Daily report dispatch error:', e));
  }
}

/**
 * Initialize Telegram Bot Subsystem
 */
export function initTelegramBot(options: {
  getOrders: GetOrdersFn;
  updateOrderStatus: UpdateOrderStatusFn;
}): void {
  getOrdersCallback = options.getOrders;
  updateOrderStatusCallback = options.updateOrderStatus;

  loadBotConfig();

  // Test and fetch bot info in background
  if (currentConfig.botToken) {
    getBotInfo().then((info) => {
      if (info) {
        console.log(`[TelegramBot] Connected as @${info.username} (${info.first_name})`);
      }
    });
  }

  // Start polling
  startPollingLoop();

  // Schedule daily report check every 2 minutes
  setInterval(checkDailyScheduledReport, 2 * 60 * 1000);
}

/**
 * Notify Telegram on New Order Arrival
 */
export async function notifyNewOrderTelegram(order: any): Promise<{ success: boolean; message: string }> {
  if (!currentConfig.enabled || !currentConfig.notifyNewOrders || !currentConfig.botToken || !currentConfig.chatId) {
    return { success: false, message: 'Telegram Bot is not enabled or credentials are missing' };
  }

  try {
    const { text, inlineKeyboard } = formatOrderAlert(order);
    await sendTelegramMessage(currentConfig.chatId, text, {
      replyMarkup: currentConfig.allowStatusUpdateFromBot ? inlineKeyboard : getMainReplyKeyboard(),
    });
    return { success: true, message: 'تم إرسال إشعار الطلب إلى تيليجرام بنجاح!' };
  } catch (err: any) {
    console.error('[TelegramBot] Failed to dispatch new order alert:', err);
    return { success: false, message: err.message || 'فشل إرسال إشعار تيليجرام' };
  }
}

/**
 * Trigger sending custom report manually
 */
export async function sendTelegramCustomReport(
  type: 'today' | 'week' | 'full' | 'excel',
  targetChatId?: string
): Promise<{ success: boolean; message: string }> {
  const chatId = targetChatId || currentConfig.chatId;
  if (!currentConfig.botToken || !chatId) {
    return { success: false, message: 'بيانات بوت تيليجرام غير مكتملة (Token أو Chat ID)' };
  }

  const orders = getOrdersCallback() || [];

  try {
    if (type === 'today') {
      const report = generateTodayReport(orders);
      await sendTelegramMessage(chatId, report, { replyMarkup: getMainReplyKeyboard() });
    } else if (type === 'week') {
      const report = generateWeekReport(orders);
      await sendTelegramMessage(chatId, report, { replyMarkup: getMainReplyKeyboard() });
    } else if (type === 'full') {
      const report = generateFullReport(orders);
      await sendTelegramMessage(chatId, report, { replyMarkup: getMainReplyKeyboard() });
    } else if (type === 'excel') {
      const csv = generateOrdersCsv(orders);
      const filename = `Kazaki_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
      await sendTelegramDocument(
        chatId,
        filename,
        csv,
        `📁 <b>تقرير جميع الطلبيات بصيغة إكسل</b> (${orders.length} طلب)`
      );
    }
    return { success: true, message: 'تم إرسال التقرير إلى تيليجرام بنجاح!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'خطأ أثناء إرسال التقرير' };
  }
}

/**
 * Test Bot Connection
 */
export async function testTelegramBotConnection(
  customToken?: string,
  customChatId?: string
): Promise<{ success: boolean; message: string; botInfo?: any }> {
  const token = (customToken || currentConfig.botToken || '').trim();
  const chatId = (customChatId || currentConfig.chatId || '').trim();

  if (!token || !chatId) {
    return { success: false, message: 'يرجى إدخال Bot Token و Chat ID أولاً' };
  }

  try {
    const info = await getBotInfo(token);
    if (!info) {
      return { success: false, message: 'لم يتم العثور على البوت، تأكد من صحة الـ Token' };
    }

    const testText = `
🎉 <b>تم اختبار الاتصال ببوت متجر KAZAKI.IQ بنجاح!</b> 🌸
━━━━━━━━━━━━━━━━━━━━
مرحباً بك! البوت <b>@${info.username}</b> متصل الآن بسيرفر المتجر بنجاح.

✅ <b>جاهز لتلقي:</b>
• إشعارات الطلبات الجديدة الفورية.
• أزرار التحكم بحالة الطلبات.
• التقارير اليومية والأسبوعية والإحصائيات.
• ملفات إكسل بصيغة CSV جاهزة للتحميل.

⏰ <b>وقت الاختبار:</b> ${new Date().toLocaleTimeString('ar-IQ', { timeZone: 'Asia/Baghdad' })}
━━━━━━━━━━━━━━━━━━━━
`.trim();

    await sendTelegramMessage(chatId, testText, {
      token,
      replyMarkup: getMainReplyKeyboard(),
    });

    return {
      success: true,
      message: `تم الاتصال بنجاح بالبوت @${info.username} وتم إرسال رسالة تجريبية لحسابك!`,
      botInfo: info,
    };
  } catch (err: any) {
    return { success: false, message: `فشل الاتصال بتيليجرام: ${err.message}` };
  }
}

/**
 * Return current status & config for admin UI
 */
export function getTelegramBotStatus(): {
  config: TelegramBotConfig;
  connected: boolean;
  botInfo: any;
  pollingActive: boolean;
} {
  return {
    config: currentConfig,
    connected: Boolean(currentConfig.enabled && currentConfig.botToken && currentConfig.chatId),
    botInfo: botInfoCache,
    pollingActive,
  };
}
