import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  answerTelegramCallbackQuery,
  callTelegramApi,
  dispatchTelegramReport,
  editTelegramMessageText,
  fetchTelegramBotInfo,
  formatOrderAlert,
  generateFullReport,
  generateOrdersCsv,
  generatePendingOrdersMessage,
  generateTodayReport,
  generateWeekReport,
  getMainReplyKeyboard,
  getStatusBadgeArabic,
  normalizeTelegramApiBase,
  postTelegramDocument,
  postTelegramMessage,
  processTelegramCallbackQuery,
  processTelegramMessageUpdate,
} from './src/lib/telegramShared.ts';

export {
  formatOrderAlert,
  generateFullReport,
  generateOrdersCsv,
  generatePendingOrdersMessage,
  generateTodayReport,
  generateWeekReport,
  getStatusBadgeArabic,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
  apiBase?: string;
  enabled: boolean;
  notifyNewOrders: boolean;
  allowStatusUpdateFromBot: boolean;
  dailyReportEnabled: boolean;
  dailyReportHour: number; // 0 - 23 (default 22:00)
}

const DEFAULT_CONFIG: TelegramBotConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  apiBase: process.env.TELEGRAM_API_BASE || '',
  enabled: false,
  notifyNewOrders: true,
  allowStatusUpdateFromBot: true,
  dailyReportEnabled: true,
  dailyReportHour: 22,
};

const DATA_DIR = path.resolve(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'bot_config.json');

let currentConfig: TelegramBotConfig = { ...DEFAULT_CONFIG };
let pollingActive = false;
let pollingAbortController: AbortController | null = null;
let lastUpdateId = 0;
let lastDailyReportDate = '';
let botInfoCache: any = null;
const recentlyNotifiedOrders = new Set<string>();

type GetOrdersFn = () => any[];
type UpdateOrderStatusFn = (id: string, status: string, note?: string) => Promise<any> | any;

let getOrdersCallback: GetOrdersFn = () => [];
let updateOrderStatusCallback: UpdateOrderStatusFn = () => null;

const resolveApiBase = () => currentConfig.apiBase || process.env.TELEGRAM_API_BASE || '';

/** Load bot configuration from disk or environment. */
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
        apiBase: data.apiBase || process.env.TELEGRAM_API_BASE || '',
      };
    } else {
      currentConfig = {
        ...DEFAULT_CONFIG,
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        apiBase: process.env.TELEGRAM_API_BASE || '',
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

/** Save bot configuration to disk. */
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

export async function getBotInfo(token?: string): Promise<any> {
  const info = await fetchTelegramBotInfo(token || currentConfig.botToken, resolveApiBase());
  botInfoCache = info;
  return info;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { replyMarkup?: any; token?: string }
): Promise<any> {
  return postTelegramMessage(options?.token || currentConfig.botToken, chatId, text, {
    replyMarkup: options?.replyMarkup,
    apiBase: resolveApiBase(),
  });
}

export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: any,
  token?: string
): Promise<any> {
  return editTelegramMessageText(token || currentConfig.botToken, chatId, messageId, text, {
    replyMarkup,
    apiBase: resolveApiBase(),
  });
}

export async function answerTelegramCallback(
  callbackId: string,
  text?: string,
  showAlert = false,
  token?: string
): Promise<any> {
  return answerTelegramCallbackQuery(token || currentConfig.botToken, callbackId, {
    text,
    showAlert,
    apiBase: resolveApiBase(),
  });
}

export async function sendTelegramDocument(
  chatId: string,
  fileName: string,
  fileContent: string | Uint8Array,
  caption?: string,
  token?: string
): Promise<any> {
  return postTelegramDocument(token || currentConfig.botToken, chatId, fileName, fileContent, {
    caption,
    apiBase: resolveApiBase(),
  });
}

async function startPollingLoop(): Promise<void> {
  if (pollingActive) return;
  pollingActive = true;
  pollingAbortController = new AbortController();

  console.log('[TelegramBot] Polling loop started.');

  while (pollingActive) {
    if (!currentConfig.enabled || !currentConfig.botToken) {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    try {
      const token = currentConfig.botToken.trim();
      const apiBase = normalizeTelegramApiBase(resolveApiBase());
      const url = `${apiBase}/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;

      const res = await fetch(url, { signal: pollingAbortController?.signal });
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }

      const resJson: any = await res.json();
      if (resJson?.ok && Array.isArray(resJson.result)) {
        for (const update of resJson.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);

          if (update.message) {
            processTelegramMessageUpdate({
              msg: update.message,
              token,
              apiBase: resolveApiBase(),
              loadOrders: () => getOrdersCallback() || [],
            }).catch((e) => console.error('[TelegramBot] Error handling message:', e));
          } else if (update.callback_query) {
            processTelegramCallbackQuery({
              cb: update.callback_query,
              token,
              apiBase: resolveApiBase(),
              updateOrderStatus: updateOrderStatusCallback,
            }).catch((e) => console.error('[TelegramBot] Error handling callback query:', e));
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') break;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log('[TelegramBot] Polling loop stopped.');
}

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

export function initTelegramBot(options: {
  getOrders: GetOrdersFn;
  updateOrderStatus: UpdateOrderStatusFn;
}): void {
  getOrdersCallback = options.getOrders;
  updateOrderStatusCallback = options.updateOrderStatus;

  loadBotConfig();

  if (currentConfig.botToken) {
    getBotInfo().then((info) => {
      if (info) {
        console.log(`[TelegramBot] Connected as @${info.username} (${info.first_name})`);
      }
    });
  }

  startPollingLoop();
  setInterval(checkDailyScheduledReport, 2 * 60 * 1000);
}

export async function notifyNewOrderTelegram(order: any): Promise<{ success: boolean; message: string }> {
  if (!currentConfig.enabled || !currentConfig.notifyNewOrders || !currentConfig.botToken || !currentConfig.chatId) {
    return { success: false, message: 'Telegram Bot is not enabled or credentials are missing' };
  }

  const orderId = String(order?.id || '');
  if (orderId && recentlyNotifiedOrders.has(orderId)) {
    return { success: true, message: 'Order alert already dispatched' };
  }
  if (orderId) {
    recentlyNotifiedOrders.add(orderId);
    if (recentlyNotifiedOrders.size > 200) {
      const oldest = recentlyNotifiedOrders.values().next().value;
      if (oldest) recentlyNotifiedOrders.delete(oldest);
    }
  }

  try {
    const { text, inlineKeyboard } = formatOrderAlert(order);
    await sendTelegramMessage(currentConfig.chatId, text, {
      replyMarkup: currentConfig.allowStatusUpdateFromBot ? inlineKeyboard : getMainReplyKeyboard(),
    });
    return { success: true, message: 'تم إرسال إشعار الطلب إلى تيليجرام بنجاح!' };
  } catch (err: any) {
    console.error('[TelegramBot] Failed to dispatch new order alert:', err);
    return { success: false, message: err?.message || 'فشل إرسال إشعار تيليجرام' };
  }
}

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
    await dispatchTelegramReport({
      token: currentConfig.botToken,
      chatId,
      type,
      orders,
      apiBase: resolveApiBase(),
    });
    return { success: true, message: 'تم إرسال التقرير إلى تيليجرام بنجاح!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'خطأ أثناء إرسال التقرير' };
  }
}

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
    const info = await fetchTelegramBotInfo(token, resolveApiBase());
    if (!info) {
      return {
        success: false,
        message:
          'تعذر الوصول إلى سيرفر تيليجرام الرسمي من شبكة الإنترنت الحالية (بسبب حجب شركات الاتصال في العراق لـ api.telegram.org). يرجى تشغيل VPN على جهازك (مثل Cloudflare WARP 1.1.1.1) أو إضافة رابط بروكسي وسيط.',
      };
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

    await callTelegramApi(
      token,
      'sendMessage',
      {
        chat_id: chatId,
        text: testText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: getMainReplyKeyboard(),
      },
      { apiBase: resolveApiBase() }
    );

    return {
      success: true,
      message: `تم الاتصال بنجاح بالبوت @${info.username} وتم إرسال رسالة تجريبية لحسابك!`,
      botInfo: info,
    };
  } catch (err: any) {
    return { success: false, message: `فشل الاتصال بتيليجرام: ${err?.message}` };
  }
}

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
