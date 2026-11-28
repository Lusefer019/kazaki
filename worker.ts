import {
  callTelegramApi,
  dispatchTelegramReport,
  fetchTelegramBotInfo,
  formatOrderAlert,
  getMainReplyKeyboard,
  normalizeTelegramApiBase,
  postTelegramMessage,
  processTelegramCallbackQuery,
  processTelegramMessageUpdate,
} from './src/lib/telegramShared.ts';

interface ResolvedBotSettings {
  botToken: string;
  chatId: string;
  apiBase: string;
  enabled: boolean;
  notifyNewOrders: boolean;
  allowStatusUpdateFromBot: boolean;
  dailyReportEnabled: boolean;
  dailyReportHour: number;
}

const VALID_ORDER_STATUSES = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
const MAX_JSON_BODY_BYTES = 512 * 1024; // 512 KB cap to stay well within Worker memory limits

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}

async function readBoundedJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  const lenHeader = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(lenHeader) && lenHeader > MAX_JSON_BODY_BYTES) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }
  const raw = await request.text();
  if (raw.length > MAX_JSON_BODY_BYTES) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }
  if (!raw.trim()) return {} as T;
  return JSON.parse(raw) as T;
}

/** Constant-time equality comparison using fixed-length SHA-256 digests via Web Crypto. */
async function timingSafeStringEqual(a: string, b: string): Promise<boolean> {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i] ^ bytesB[i];
  }
  return diff === 0;
}

function getSupabaseRestConfig(env: Env): { url: string; serviceKey: string } | null {
  const url = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

async function verifyAdminRequest(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
  const adminKey = (request.headers.get('x-admin-key') || '').trim();
  const presented = bearer || adminKey;
  if (!presented) return false;

  if (env.ADMIN_API_SECRET && (await timingSafeStringEqual(presented, env.ADMIN_API_SECRET.trim()))) {
    return true;
  }

  const sb = getSupabaseRestConfig(env);
  if (!sb) return false;

  try {
    const res = await fetch(`${sb.url}/rest/v1/admin_users?select=password_hash,role`, {
      headers: {
        apikey: sb.serviceKey,
        Authorization: `Bearer ${sb.serviceKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const rows = (await res.json()) as Array<{ password_hash?: string; role?: string }>;
    for (const row of rows) {
      if (
        row.role === 'admin' &&
        row.password_hash &&
        (await timingSafeStringEqual(presented, row.password_hash.trim()))
      ) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error(JSON.stringify({ event: 'admin_verify_error', error: err instanceof Error ? err.message : String(err) }));
    return false;
  }
}

async function fetchStoreSettingsRow(env: Env): Promise<Record<string, any> | null> {
  const sb = getSupabaseRestConfig(env);
  if (!sb) return null;
  try {
    const res = await fetch(`${sb.url}/rest/v1/store_settings?id=eq.main_settings&select=settings_data`, {
      headers: {
        apikey: sb.serviceKey,
        Authorization: `Bearer ${sb.serviceKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ settings_data?: Record<string, any> }>;
    return rows?.[0]?.settings_data || null;
  } catch {
    return null;
  }
}

async function resolveBotSettings(env: Env): Promise<ResolvedBotSettings> {
  const stored = await fetchStoreSettingsRow(env);
  const storedNotif = stored?.notificationSettings || {};

  // Worker secrets override stored settings when set
  const botToken = (env.TELEGRAM_BOT_TOKEN || storedNotif.telegramBotToken || '').trim();
  const chatId = (env.TELEGRAM_CHAT_ID || storedNotif.telegramChatId || '').trim();
  const apiBase = normalizeTelegramApiBase(env.TELEGRAM_API_BASE || storedNotif.telegramApiBase || '');

  return {
    botToken,
    chatId,
    apiBase,
    enabled: Boolean(botToken && chatId && storedNotif.enableTelegram !== false),
    notifyNewOrders: storedNotif.notifyNewOrders !== false,
    allowStatusUpdateFromBot: storedNotif.allowStatusUpdateFromBot !== false,
    dailyReportEnabled: storedNotif.dailyReportEnabled !== false,
    dailyReportHour: Number.isFinite(Number(storedNotif.dailyReportHour))
      ? Number(storedNotif.dailyReportHour)
      : 22,
  };
}

function mapSupabaseOrderRow(o: any) {
  return {
    id: o.id,
    customerName: o.customer_name || 'زبون',
    customerEmail: o.customer_email || '',
    customerPhone: o.customer_phone || '',
    address: o.address || '',
    city: o.city || 'بغداد',
    notes: o.notes || '',
    items: Array.isArray(o.items) ? o.items : [],
    totalAmount: Number(o.total_amount) || 0,
    discountAmount: Number(o.discount_amount) || 0,
    shippingFee: Number(o.shipping_fee) || 0,
    finalAmount: Number(o.final_amount) || 0,
    paymentMethod: o.payment_method || 'cod',
    status: o.status || 'pending',
    trackingNumber: o.tracking_number || '',
    createdAt: o.created_at || new Date().toISOString(),
  };
}

async function fetchOrdersFromSupabaseServer(env: Env): Promise<any[]> {
  const sb = getSupabaseRestConfig(env);
  if (!sb) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_MISSING');
  }
  const res = await fetch(`${sb.url}/rest/v1/orders?select=*&order=created_at.desc&limit=500`, {
    headers: {
      apikey: sb.serviceKey,
      Authorization: `Bearer ${sb.serviceKey}`,
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`Supabase orders read failed (${res.status})`);
  }
  const rows = (await res.json()) as any[];
  return Array.isArray(rows) ? rows.map(mapSupabaseOrderRow) : [];
}

async function fetchOrderByIdFromSupabase(env: Env, orderId: string): Promise<any | null> {
  const sb = getSupabaseRestConfig(env);
  if (!sb) return null;
  const res = await fetch(
    `${sb.url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`,
    {
      headers: {
        apikey: sb.serviceKey,
        Authorization: `Bearer ${sb.serviceKey}`,
      },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as any[];
  return rows?.[0] ? mapSupabaseOrderRow(rows[0]) : null;
}

async function updateOrderStatusInSupabase(env: Env, orderId: string, newStatus: string): Promise<void> {
  if (!VALID_ORDER_STATUSES.has(newStatus)) {
    throw new Error('حالة الطلب غير صالحة');
  }
  const sb = getSupabaseRestConfig(env);
  if (!sb) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY غير مضبوط في إعدادات Cloudflare Worker');
  }
  const res = await fetch(`${sb.url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      apikey: sb.serviceKey,
      Authorization: `Bearer ${sb.serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status: newStatus }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`تعذر تحديث حالة الطلب (${res.status})`);
  }
}

async function registerTelegramWebhook(
  origin: string,
  token: string,
  apiBase: string,
  webhookSecret?: string
): Promise<{ ok: boolean; webhookUrl?: string; message?: string }> {
  if (!origin.startsWith('https://')) {
    return {
      ok: false,
      message: 'يتطلب Webhook رابط HTTPS عاماً (يُفعّل تلقائياً بمجرد النشر على Cloudflare).',
    };
  }
  const webhookUrl = `${origin}/api/telegram-bot/webhook`;
  const payload: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
  };
  if (webhookSecret?.trim()) {
    payload.secret_token = webhookSecret.trim();
  }
  try {
    await callTelegramApi(token, 'setWebhook', payload, { apiBase });
    return { ok: true, webhookUrl };
  } catch (err: any) {
    return { ok: false, webhookUrl, message: err?.message || 'فشل تسجيل Webhook' };
  }
}

async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // 1. Health Endpoint
  if (path === '/api/health' && method === 'GET') {
    return jsonResponse({
      status: 'ok',
      runtime: 'cloudflare-worker',
      supabaseConfigured: Boolean(env.SUPABASE_URL),
      serviceRoleConfigured: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Telegram Bot Status
  if (path === '/api/telegram-bot/status' && method === 'GET') {
    const resolved = await resolveBotSettings(env);
    const hasToken = Boolean(resolved.botToken);
    const botInfo = hasToken ? await fetchTelegramBotInfo(resolved.botToken, resolved.apiBase) : null;

    return jsonResponse({
      success: true,
      runtime: 'cloudflare-worker',
      connected: Boolean(resolved.enabled && botInfo),
      botInfo,
      pollingActive: Boolean(resolved.enabled && botInfo),
      webhookMode: true,
      config: {
        // Do not return raw botToken back on unauthenticated status checks
        botToken: '',
        hasToken,
        chatId: resolved.chatId,
        apiBase: resolved.apiBase === 'https://api.telegram.org' ? '' : resolved.apiBase,
        enabled: resolved.enabled,
        notifyNewOrders: resolved.notifyNewOrders,
        allowStatusUpdateFromBot: resolved.allowStatusUpdateFromBot,
        dailyReportEnabled: resolved.dailyReportEnabled,
        dailyReportHour: resolved.dailyReportHour,
      },
    });
  }

  // 3. Save Bot Configuration + Auto-register HTTPS Webhook
  if (path === '/api/telegram-bot/config' && method === 'POST') {
    if (!(await verifyAdminRequest(request, env))) {
      return jsonResponse({ success: false, message: 'غير مصرح بتعديل إعدادات البوت' }, 403);
    }

    const body = await readBoundedJson<Record<string, any>>(request);
    if (!body) return jsonResponse({ success: false, message: 'بيانات غير صالحة' }, 400);

    const existingResolved = await resolveBotSettings(env);
    const sb = getSupabaseRestConfig(env);
    const existingSettings = (await fetchStoreSettingsRow(env)) || {};

    const nextBotToken = (body.botToken || existingResolved.botToken || '').trim();
    const nextChatId = (body.chatId || existingResolved.chatId || '').trim();
    const nextApiBase = (body.apiBase || '').trim();

    if (sb) {
      const updatedSettingsData = {
        ...existingSettings,
        notificationSettings: {
          ...(existingSettings.notificationSettings || {}),
          enableTelegram: body.enabled ?? Boolean(nextBotToken && nextChatId),
          telegramBotToken: env.TELEGRAM_BOT_TOKEN ? existingSettings.notificationSettings?.telegramBotToken || '' : nextBotToken,
          telegramChatId: nextChatId,
          telegramApiBase: nextApiBase,
          notifyNewOrders: body.notifyNewOrders !== false,
          allowStatusUpdateFromBot: body.allowStatusUpdateFromBot !== false,
          dailyReportEnabled: body.dailyReportEnabled !== false,
          dailyReportHour: Number.isFinite(Number(body.dailyReportHour)) ? Number(body.dailyReportHour) : 22,
        },
      };

      const upsertRes = await fetch(`${sb.url}/rest/v1/store_settings?on_conflict=id`, {
        method: 'POST',
        headers: {
          apikey: sb.serviceKey,
          Authorization: `Bearer ${sb.serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          id: 'main_settings',
          settings_data: updatedSettingsData,
          updated_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!upsertRes.ok) {
        return jsonResponse(
          { success: false, message: `تعذر حفظ الإعدادات في Supabase (${upsertRes.status})` },
          500
        );
      }
    }

    let webhookResult: { ok: boolean; webhookUrl?: string; message?: string } = { ok: false };
    if (nextBotToken) {
      webhookResult = await registerTelegramWebhook(
        url.origin,
        nextBotToken,
        normalizeTelegramApiBase(nextApiBase || existingResolved.apiBase),
        env.TELEGRAM_WEBHOOK_SECRET
      );
    }

    return jsonResponse({
      success: true,
      message: webhookResult.ok
        ? 'تم حفظ إعدادات البوت وتفعيل الرد التلقائي (Webhook) على Cloudflare بنجاح!'
        : 'تم حفظ إعدادات البوت بنجاح!',
      webhookRegistered: webhookResult.ok,
      webhookUrl: webhookResult.webhookUrl,
    });
  }

  // 4. Test Bot Connection from Cloudflare Edge
  if (path === '/api/telegram-bot/test' && method === 'POST') {
    if (!(await verifyAdminRequest(request, env))) {
      return jsonResponse({ success: false, message: 'غير مصرح بإجراء اختبار الاتصال' }, 403);
    }

    const body = await readBoundedJson<{ botToken?: string; chatId?: string }>(request);
    const resolved = await resolveBotSettings(env);
    const token = (body?.botToken || resolved.botToken || '').trim();
    const chatId = (body?.chatId || resolved.chatId || '').trim();

    if (!token || !chatId) {
      return jsonResponse({ success: false, message: 'يرجى إدخال Bot Token و Chat ID أولاً' }, 400);
    }

    const info = await fetchTelegramBotInfo(token, resolved.apiBase);
    if (!info) {
      return jsonResponse({
        success: false,
        message: 'فشل الاتصال بخادم تيليجرام. تأكد من صحة الـ Bot Token.',
      });
    }

    const testText = `
🎉 <b>تم اختبار الاتصال ببوت متجر KAZAKI.IQ من Cloudflare بنجاح!</b> 🌸
━━━━━━━━━━━━━━━━━━━━
مرحباً بك! البوت <b>@${info.username}</b> متصل الآن ويعمل 24/7 على خوادم Cloudflare.

✅ <b>المزايا الفعّالة:</b>
• إشعارات الطلبات الجديدة فورياً بدون حجب.
• أزرار التحكم بحالة الطلبات.
• تقارير اليوم والأسبوع والتقرير الشامل.
• ملفات إكسل (CSV) للطلبات.

⏰ <b>وقت الاختبار:</b> ${new Date().toLocaleTimeString('ar-IQ', { timeZone: 'Asia/Baghdad' })}
━━━━━━━━━━━━━━━━━━━━
`.trim();

    await postTelegramMessage(token, chatId, testText, {
      replyMarkup: getMainReplyKeyboard(),
      apiBase: resolved.apiBase,
    });

    const webhookResult = await registerTelegramWebhook(
      url.origin,
      token,
      resolved.apiBase,
      env.TELEGRAM_WEBHOOK_SECRET
    );

    return jsonResponse({
      success: true,
      message: webhookResult.ok
        ? `تم الاتصال بالبوت @${info.username} وتفعيل Webhook وإرسال رسالة تجريبية لهاتفك بنجاح!`
        : `تم الاتصال بنجاح بالبوت @${info.username} وتم إرسال رسالة تجريبية لحسابك!`,
      botInfo: info,
      webhookRegistered: webhookResult.ok,
    });
  }

  // 5. Explicit Webhook Registration
  if (path === '/api/telegram-bot/setup-webhook' && method === 'POST') {
    if (!(await verifyAdminRequest(request, env))) {
      return jsonResponse({ success: false, message: 'غير مصرح' }, 403);
    }
    const body = await readBoundedJson<{ botToken?: string }>(request);
    const resolved = await resolveBotSettings(env);
    const token = (body?.botToken || resolved.botToken || '').trim();
    if (!token) {
      return jsonResponse({ success: false, message: 'Bot Token غير متوفر' }, 400);
    }
    const webhookResult = await registerTelegramWebhook(
      url.origin,
      token,
      resolved.apiBase,
      env.TELEGRAM_WEBHOOK_SECRET
    );
    return jsonResponse({
      success: webhookResult.ok,
      message: webhookResult.ok
        ? `تم ربط البوت بـ ${webhookResult.webhookUrl} ويعمل الآن 24/7!`
        : webhookResult.message || 'تعذر تفعيل Webhook',
      webhookUrl: webhookResult.webhookUrl,
    });
  }

  // 6. Send On-Demand Report (Reads live orders from Supabase)
  if (path === '/api/telegram-bot/report' && method === 'POST') {
    if (!(await verifyAdminRequest(request, env))) {
      return jsonResponse({ success: false, message: 'غير مصرح بإرسال التقارير' }, 403);
    }

    const body = await readBoundedJson<{ type?: 'today' | 'week' | 'full' | 'excel'; chatId?: string }>(request);
    const resolved = await resolveBotSettings(env);
    const targetChatId = (body?.chatId || resolved.chatId || '').trim();

    if (!resolved.botToken || !targetChatId) {
      return jsonResponse({ success: false, message: 'بيانات بوت تيليجرام غير مكتملة' }, 400);
    }

    try {
      const orders = await fetchOrdersFromSupabaseServer(env);
      await dispatchTelegramReport({
        token: resolved.botToken,
        chatId: targetChatId,
        type: body?.type || 'today',
        orders,
        apiBase: resolved.apiBase,
      });
      return jsonResponse({ success: true, message: 'تم إرسال التقرير إلى تيليجرام بنجاح!' });
    } catch (err: any) {
      const msg =
        err?.message === 'SUPABASE_SERVICE_ROLE_KEY_MISSING'
          ? 'يرجى إضافة SUPABASE_SERVICE_ROLE_KEY في Secrets بلوحة Cloudflare Worker لقراءة الطلبات من قاعدة البيانات.'
          : err?.message || 'حدث خطأ أثناء إرسال التقرير';
      return jsonResponse({ success: false, message: msg }, 500);
    }
  }

  // 7. Customer Order Notification Proxy (Keeps bot token off client browsers & bypasses Iraqi ISP blocks)
  if (path === '/api/telegram-bot/notify-order' && method === 'POST') {
    const body = await readBoundedJson<{ order?: any }>(request);
    const clientOrder = body?.order;
    if (!clientOrder || !clientOrder.id || !Array.isArray(clientOrder.items)) {
      return jsonResponse({ success: false, message: 'بيانات الطلب غير صالحة' }, 400);
    }

    const resolved = await resolveBotSettings(env);
    if (!resolved.enabled || !resolved.notifyNewOrders || !resolved.botToken || !resolved.chatId) {
      return jsonResponse({ success: false, message: 'Telegram Bot is disabled' }, 200);
    }

    const dispatchPromise = (async () => {
      try {
        // Prefer authoritative order row from Supabase when saved
        const dbOrder = await fetchOrderByIdFromSupabase(env, String(clientOrder.id));
        const targetOrder = dbOrder || clientOrder;
        const { text, inlineKeyboard } = formatOrderAlert(targetOrder);
        await postTelegramMessage(resolved.botToken, resolved.chatId, text, {
          replyMarkup: resolved.allowStatusUpdateFromBot ? inlineKeyboard : getMainReplyKeyboard(),
          apiBase: resolved.apiBase,
        });
      } catch (err) {
        console.error(
          JSON.stringify({
            event: 'telegram_order_notify_error',
            orderId: clientOrder.id,
            error: err instanceof Error ? err.message : String(err),
          })
        );
      }
    })();

    ctx.waitUntil(dispatchPromise);
    return jsonResponse({ success: true, queued: true });
  }

  // 8. Incoming Telegram Bot Webhook
  if (path === '/api/telegram-bot/webhook' && method === 'POST') {
    if (env.TELEGRAM_WEBHOOK_SECRET) {
      const secretHeader = request.headers.get('x-telegram-bot-api-secret-token') || '';
      if (!(await timingSafeStringEqual(secretHeader, env.TELEGRAM_WEBHOOK_SECRET))) {
        return jsonResponse({ ok: false, error: 'Unauthorized webhook' }, 401);
      }
    }

    const update = await readBoundedJson<any>(request);
    const resolved = await resolveBotSettings(env);
    if (!resolved.botToken || !update) {
      return jsonResponse({ ok: true });
    }

    if (update.message) {
      ctx.waitUntil(
        processTelegramMessageUpdate({
          msg: update.message,
          token: resolved.botToken,
          apiBase: resolved.apiBase,
          loadOrders: () => fetchOrdersFromSupabaseServer(env),
        }).catch((err) =>
          console.error(
            JSON.stringify({
              event: 'telegram_webhook_message_error',
              error: err instanceof Error ? err.message : String(err),
            })
          )
        )
      );
    } else if (update.callback_query) {
      ctx.waitUntil(
        processTelegramCallbackQuery({
          cb: update.callback_query,
          token: resolved.botToken,
          apiBase: resolved.apiBase,
          updateOrderStatus: (orderId, status) => updateOrderStatusInSupabase(env, orderId, status),
        }).catch((err) =>
          console.error(
            JSON.stringify({
              event: 'telegram_webhook_callback_error',
              error: err instanceof Error ? err.message : String(err),
            })
          )
        )
      );
    }

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ success: false, message: 'API endpoint not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApiRequest(request, env, ctx);
      } catch (err: any) {
        const isPayloadTooLarge = err?.message === 'PAYLOAD_TOO_LARGE';
        console.error(
          JSON.stringify({
            event: 'worker_api_error',
            path: url.pathname,
            method: request.method,
            error: err instanceof Error ? err.message : String(err),
          })
        );
        return jsonResponse(
          {
            success: false,
            message: isPayloadTooLarge ? 'حجم البيانات كبير جداً' : 'حدث خطأ غير متوقع في الخادم',
          },
          isPayloadTooLarge ? 413 : 500
        );
      }
    }

    // All non-API traffic delegates cleanly to Cloudflare Workers Static Assets (with SPA fallback)
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
