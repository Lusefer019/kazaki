/**
 * Runtime-agnostic Telegram Bot API client, HTML/CSV formatters, and command router.
 * Shared cleanly between the Cloudflare Worker entrypoint (worker.ts) and local Node server (telegramBot.ts).
 */

export const DEFAULT_TELEGRAM_API_BASE = 'https://api.telegram.org';

/** Escapes HTML special characters so customer fields cannot break Telegram HTML mode. */
export function escapeTelegramHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function normalizeTelegramApiBase(apiBase?: string): string {
  const clean = (apiBase || '').trim().replace(/\/+$/, '');
  return clean || DEFAULT_TELEGRAM_API_BASE;
}

/** Low-level Telegram Bot API request using Web-standard fetch + AbortSignal.timeout. */
export async function callTelegramApi(
  token: string,
  method: string,
  payload?: unknown,
  options?: { apiBase?: string; signal?: AbortSignal; timeoutMs?: number }
): Promise<any> {
  const cleanToken = (token || '').trim();
  if (!cleanToken) {
    throw new Error('Telegram Bot Token is missing');
  }
  const base = normalizeTelegramApiBase(options?.apiBase);
  const url = `${base}/bot${cleanToken}/${method}`;
  const effectiveSignal = options?.signal || AbortSignal.timeout(options?.timeoutMs ?? 12000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
    signal: effectiveSignal,
  });

  const data: any = await response
    .json()
    .catch(() => ({ ok: false, description: 'Invalid JSON response from Telegram' }));
  if (!data?.ok) {
    throw new Error(data?.description || `Telegram API error on ${method}`);
  }
  return data.result;
}

export async function fetchTelegramBotInfo(token: string, apiBase?: string): Promise<any | null> {
  if (!token?.trim()) return null;
  try {
    return await callTelegramApi(token, 'getMe', undefined, { apiBase });
  } catch {
    return null;
  }
}

export async function postTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  options?: { replyMarkup?: unknown; apiBase?: string }
): Promise<any> {
  if (!token?.trim() || !chatId?.trim()) {
    throw new Error('Telegram token or Chat ID is missing');
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId.trim(),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (options?.replyMarkup !== undefined) {
    payload.reply_markup = options.replyMarkup;
  }

  return callTelegramApi(token, 'sendMessage', payload, { apiBase: options?.apiBase });
}

export async function editTelegramMessageText(
  token: string,
  chatId: string,
  messageId: number,
  text: string,
  options?: { replyMarkup?: unknown; apiBase?: string }
): Promise<any | null> {
  if (!token?.trim() || !chatId?.trim()) return null;

  const payload: Record<string, unknown> = {
    chat_id: chatId.trim(),
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (options?.replyMarkup !== undefined) {
    payload.reply_markup = options.replyMarkup;
  }

  try {
    return await callTelegramApi(token, 'editMessageText', payload, { apiBase: options?.apiBase });
  } catch (err) {
    console.warn('[TelegramBot] Edit message warning:', err);
    return null;
  }
}

export async function answerTelegramCallbackQuery(
  token: string,
  callbackId: string,
  options?: { text?: string; showAlert?: boolean; apiBase?: string }
): Promise<any | null> {
  if (!token?.trim()) return null;
  try {
    return await callTelegramApi(
      token,
      'answerCallbackQuery',
      {
        callback_query_id: callbackId,
        text: options?.text || '',
        show_alert: Boolean(options?.showAlert),
      },
      { apiBase: options?.apiBase }
    );
  } catch {
    return null;
  }
}

export async function postTelegramDocument(
  token: string,
  chatId: string,
  fileName: string,
  fileContent: string | Uint8Array,
  options?: { caption?: string; apiBase?: string }
): Promise<any> {
  if (!token?.trim() || !chatId?.trim()) {
    throw new Error('Missing Telegram token or chat ID');
  }

  const base = normalizeTelegramApiBase(options?.apiBase);
  const url = `${base}/bot${token.trim()}/sendDocument`;
  const formData = new FormData();
  formData.append('chat_id', chatId.trim());

  if (options?.caption) {
    formData.append('caption', options.caption);
    formData.append('parse_mode', 'HTML');
  }

  const rawBytes =
    typeof fileContent === 'string' ? new TextEncoder().encode(fileContent) : fileContent;
  const buffer = new ArrayBuffer(rawBytes.byteLength);
  new Uint8Array(buffer).set(rawBytes);
  const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
  formData.append('document', blob, fileName);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(20000),
  });

  const resJson: any = await response.json();
  if (!resJson?.ok) {
    throw new Error(resJson?.description || 'Failed to send document to Telegram');
  }
  return resJson.result;
}

/** Persistent bottom keyboard for bot navigation. */
export function getMainReplyKeyboard() {
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

export function formatOrderAlert(
  order: any,
  storeName = 'KAZAKI.IQ'
): { text: string; inlineKeyboard: any } {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items
    .map((it: any) => {
      const title = escapeTelegramHtml(it.product?.title || it.title || 'منتج غير مسمى');
      const qty = Number(it.quantity) || 1;
      const price = (Number(it.product?.price ?? it.price) || 0) * qty;
      return `  ▫️ <b>${title}</b> × ${qty} (${price.toLocaleString('ar-IQ')} د.ع)`;
    })
    .join('\n');

  const paymentText =
    order.paymentMethod === 'cod'
      ? 'الدفع عند الاستلام (COD)'
      : order.paymentMethod === 'card'
      ? 'بطاقة دفع إلكتروني'
      : escapeTelegramHtml(order.paymentMethod || 'الدفع عند الاستلام');

  const notesLine = order.notes
    ? `📝 <b>ملاحظات الزبون:</b> ${escapeTelegramHtml(order.notes)}\n`
    : '';
  const discountLine = order.discountAmount
    ? `🏷️ <b>الخصم المطبق:</b> -${Number(order.discountAmount).toLocaleString('ar-IQ')} د.ع\n`
    : '';

  const text = `
💐 <b>طلب جديد وارد في ${escapeTelegramHtml(storeName)}!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>رقم الطلب:</b> <code>#${escapeTelegramHtml(order.id)}</code>
📦 <b>رمز التتبع:</b> <code>${escapeTelegramHtml(order.trackingNumber || order.id)}</code>
👤 <b>الزبون:</b> ${escapeTelegramHtml(order.customerName)}
📞 <b>الهاتف:</b> <code>${escapeTelegramHtml(order.customerPhone)}</code>
📍 <b>المحافظة / المدينة:</b> ${escapeTelegramHtml(order.city)}
🏠 <b>العنوان:</b> ${escapeTelegramHtml(order.address)}
${notesLine}━━━━━━━━━━━━━━━━━━━━
🛒 <b>المنتجات المطلوبة (${items.length}):</b>
${itemsText || '  (لا توجد منتجات محددة)'}

💰 <b>مجموع المنتجات:</b> ${(Number(order.totalAmount) || 0).toLocaleString('ar-IQ')} د.ع
${discountLine}🚚 <b>أجور التوصيل:</b> ${(Number(order.shippingFee) || 0).toLocaleString('ar-IQ')} د.ع
💵 <b>المبلغ النهائي المستحق:</b> <b>${(Number(order.finalAmount) || 0).toLocaleString('ar-IQ')} د.ع</b>
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

export function generateTodayReport(orders: any[], storeName = 'KAZAKI.IQ'): string {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todayOrders = orders.filter((o) => o.createdAt && String(o.createdAt).slice(0, 10) === todayStr);
  const count = todayOrders.length;
  const totalRevenue = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  const pendingCount = todayOrders.filter((o) => o.status === 'pending').length;
  const processingCount = todayOrders.filter((o) => o.status === 'processing').length;
  const shippedCount = todayOrders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = todayOrders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = todayOrders.filter((o) => o.status === 'cancelled').length;

  const citiesMap: Record<string, number> = {};
  todayOrders.forEach((o) => {
    const c = o.city || 'أخرى';
    citiesMap[c] = (citiesMap[c] || 0) + 1;
  });
  const topCities =
    Object.entries(citiesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c, n]) => `${escapeTelegramHtml(c)} (${n})`)
      .join('، ') || 'لا توجد طلبات بعد';

  return `
📊 <b>تقرير مبيعات اليوم - ${escapeTelegramHtml(storeName)}</b>
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

export function generateWeekReport(orders: any[], storeName = 'KAZAKI.IQ'): string {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weekOrders = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= sevenDaysAgo);
  const count = weekOrders.length;
  const totalRevenue = weekOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  const delivered = weekOrders.filter((o) => o.status === 'delivered').length;
  const pending = weekOrders.filter((o) => o.status === 'pending').length;
  const avgOrder = count > 0 ? Math.round(totalRevenue / count) : 0;

  return `
📈 <b>تقرير الأسبوع (آخر 7 أيام) - ${escapeTelegramHtml(storeName)}</b>
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

export function generateFullReport(orders: any[], storeName = 'KAZAKI.IQ'): string {
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  const pending = orders.filter((o) => o.status === 'pending').length;
  const processing = orders.filter((o) => o.status === 'processing').length;
  const shipped = orders.filter((o) => o.status === 'shipped').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;

  let totalItemsCount = 0;
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        totalItemsCount += Number(it.quantity) || 1;
      });
    }
  });

  return `
📑 <b>التقرير الشامل التراكمي - ${escapeTelegramHtml(storeName)}</b>
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
      return `${idx + 1}. <b>#${escapeTelegramHtml(o.id)}</b> - ${escapeTelegramHtml(o.customerName)} (${escapeTelegramHtml(o.city)})\n   📞 <code>${escapeTelegramHtml(o.customerPhone)}</code> | 💰 ${(Number(o.finalAmount) || 0).toLocaleString('ar-IQ')} د.ع (${itemsCount} منتج)`;
    })
    .join('\n\n');

  const text = `
⏳ <b>قائمة الطلبات المعلقة (${pending.length} طلب بحاجة لمتابعة):</b>
━━━━━━━━━━━━━━━━━━━━
${itemsText}
━━━━━━━━━━━━━━━━━━━━
${pending.length > 5 ? `<i>يوجد ${pending.length - 5} طلبات أخرى أيضاً في لوحة الإدارة.</i>\n` : ''}👇 اختر طلباً للبدء بتجهيزه فوراً:
`.trim();

  const buttons = latestPending.slice(0, 3).map((o) => [
    { text: `📦 تجهيز #${String(o.id).slice(-6)}`, callback_data: `st:processing:${o.id}` },
    { text: `❌ إلغاء #${String(o.id).slice(-6)}`, callback_data: `st:cancelled:${o.id}` },
  ]);

  return { text, inlineKeyboard: { inline_keyboard: buttons } };
}

export function generateOrdersCsv(orders: any[]): string {
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
    return `"${String(val).replace(/"/g, '""')}"`;
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

export async function dispatchTelegramReport(params: {
  token: string;
  chatId: string;
  type: 'today' | 'week' | 'full' | 'excel';
  orders: any[];
  apiBase?: string;
}): Promise<void> {
  const { token, chatId, type, orders, apiBase } = params;
  if (type === 'today') {
    await postTelegramMessage(token, chatId, generateTodayReport(orders), {
      replyMarkup: getMainReplyKeyboard(),
      apiBase,
    });
  } else if (type === 'week') {
    await postTelegramMessage(token, chatId, generateWeekReport(orders), {
      replyMarkup: getMainReplyKeyboard(),
      apiBase,
    });
  } else if (type === 'full') {
    await postTelegramMessage(token, chatId, generateFullReport(orders), {
      replyMarkup: getMainReplyKeyboard(),
      apiBase,
    });
  } else if (type === 'excel') {
    const csv = generateOrdersCsv(orders);
    const filename = `Kazaki_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    await postTelegramDocument(token, chatId, filename, csv, {
      caption: `📁 <b>تقرير جميع الطلبيات بصيغة إكسل</b> (${orders.length} طلب)`,
      apiBase,
    });
  }
}

/** Shared command dispatcher for both Express polling and Cloudflare Worker webhook. */
export async function processTelegramMessageUpdate(params: {
  msg: any;
  token: string;
  apiBase?: string;
  loadOrders: () => Promise<any[]> | any[];
}): Promise<void> {
  const { msg, token, apiBase, loadOrders } = params;
  const chatId = String(msg?.chat?.id || '');
  const text = String(msg?.text || '').trim();
  if (!chatId || !text) return;

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

<b>معرف المحادثة الخاص بك (Chat ID):</b> <code>${escapeTelegramHtml(chatId)}</code>
━━━━━━━━━━━━━━━━━━━━
👇 اختر من القائمة أدناه أو اكتب الأمر مباشرة:
`.trim();
    await postTelegramMessage(token, chatId, welcomeText, {
      replyMarkup: getMainReplyKeyboard(),
      apiBase,
    });
    return;
  }

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
    await postTelegramMessage(token, chatId, helpText, {
      replyMarkup: getMainReplyKeyboard(),
      apiBase,
    });
    return;
  }

  const orders = (await loadOrders()) || [];

  if (text === '/today' || text.includes('تقرير اليوم')) {
    await dispatchTelegramReport({ token, chatId, type: 'today', orders, apiBase });
    return;
  }

  if (text === '/week' || text.includes('تقرير الأسبوع')) {
    await dispatchTelegramReport({ token, chatId, type: 'week', orders, apiBase });
    return;
  }

  if (text === '/report' || text.includes('تقرير شامل') || text.includes('احصائيات')) {
    await dispatchTelegramReport({ token, chatId, type: 'full', orders, apiBase });
    return;
  }

  if (text === '/pending' || text.includes('الطلبات المعلقة') || text.includes('معلقة')) {
    const { text: pendingMsg, inlineKeyboard } = generatePendingOrdersMessage(orders);
    await postTelegramMessage(token, chatId, pendingMsg, {
      replyMarkup: inlineKeyboard || getMainReplyKeyboard(),
      apiBase,
    });
    return;
  }

  if (text === '/export' || text === '/excel' || text.includes('إكسل') || text.includes('اكسل') || text.includes('تصدير')) {
    await postTelegramMessage(token, chatId, '⏳ جاري تجهيز واستخراج ملف الإكسل...', { apiBase });
    await dispatchTelegramReport({ token, chatId, type: 'excel', orders, apiBase });
    return;
  }

  const cleanQuery = text.replace('#', '').trim().toLowerCase();
  const matchedOrder = orders.find(
    (o) =>
      String(o.id || '').toLowerCase() === cleanQuery ||
      (o.trackingNumber && String(o.trackingNumber).toLowerCase() === cleanQuery) ||
      String(o.id || '').toLowerCase().includes(cleanQuery)
  );

  if (matchedOrder) {
    const { text: orderDetails, inlineKeyboard } = formatOrderAlert(matchedOrder);
    await postTelegramMessage(token, chatId, `🔍 <b>تم العثور على الطلب:</b>\n\n${orderDetails}`, {
      replyMarkup: inlineKeyboard,
      apiBase,
    });
    return;
  }

  await postTelegramMessage(
    token,
    chatId,
    'لم أفهم هذا الأمر. يمكنك استخدام الأزرار في الأسفل أو كتابة /help لمعرفة الأوامر المتاحة.',
    { replyMarkup: getMainReplyKeyboard(), apiBase }
  );
}

/** Shared callback query handler for inline status buttons in Telegram messages. */
export async function processTelegramCallbackQuery(params: {
  cb: any;
  token: string;
  apiBase?: string;
  updateOrderStatus: (orderId: string, newStatus: string, note: string) => Promise<any> | any;
}): Promise<void> {
  const { cb, token, apiBase, updateOrderStatus } = params;
  const cbId = cb?.id;
  const data = String(cb?.data || '');
  const message = cb?.message;
  const chatId = String(message?.chat?.id || '');
  const messageId = message?.message_id;

  if (data === 'noop') {
    await answerTelegramCallbackQuery(token, cbId, { apiBase });
    return;
  }

  if (!data.startsWith('st:')) {
    await answerTelegramCallbackQuery(token, cbId, { text: 'إجراء غير معروف', apiBase });
    return;
  }

  const parts = data.split(':');
  const newStatus = parts[1];
  const orderId = parts.slice(2).join(':');

  if (!orderId || !newStatus) {
    await answerTelegramCallbackQuery(token, cbId, { text: 'بيانات الطلب غير صالحة', apiBase });
    return;
  }

  try {
    await updateOrderStatus(orderId, newStatus, 'تم تحديث الحالة عبر بوت تيليجرام بواسطة الإدارة');
    const statusName = getStatusBadgeArabic(newStatus);
    await answerTelegramCallbackQuery(token, cbId, {
      text: `تم تغيير حالة الطلب #${orderId} إلى: ${statusName} ✅`,
      showAlert: true,
      apiBase,
    });

    if (message?.text && messageId && chatId) {
      const updatedBanner = `\n\n━━━━━━━━━━━━━━━━━━━━\n🔄 <b>حالة الطلب الآن:</b> ${statusName}\n👤 <i>تم التحديث بواسطة الإدارة عبر البوت بنجاح</i>`;
      await editTelegramMessageText(token, chatId, messageId, escapeTelegramHtml(message.text) + updatedBanner, {
        replyMarkup: {
          inline_keyboard: [[{ text: `الحالة الحالية: ${statusName}`, callback_data: 'noop' }]],
        },
        apiBase,
      });
    }
  } catch (err: any) {
    await answerTelegramCallbackQuery(token, cbId, {
      text: `فشل تحديث الحالة: ${err?.message || 'خطأ'}`,
      apiBase,
    });
  }
}
