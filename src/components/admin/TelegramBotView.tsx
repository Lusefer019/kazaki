import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Bot,
  Send,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Clock,
  Sparkles,
  Smartphone,
  MessageSquare,
  Package,
  Layers,
  MapPin,
  CheckCheck,
} from 'lucide-react';

interface BotConfigState {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyNewOrders: boolean;
  allowStatusUpdateFromBot: boolean;
  dailyReportEnabled: boolean;
  dailyReportHour: number;
}

export const TelegramBotView: React.FC = () => {
  const { orders, products, settings } = useStore();

  // Local state for bot settings
  const [botConfig, setBotConfig] = useState<BotConfigState>({
    botToken: settings.notificationSettings?.telegramBotToken || '',
    chatId: settings.notificationSettings?.telegramChatId || '',
    enabled: settings.notificationSettings?.enableTelegram || false,
    notifyNewOrders: true,
    allowStatusUpdateFromBot: true,
    dailyReportEnabled: true,
    dailyReportHour: 22,
  });

  const [botStatus, setBotStatus] = useState<{
    connected: boolean;
    botInfo: any;
    pollingActive: boolean;
  }>({
    connected: false,
    botInfo: null,
    pollingActive: false,
  });

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Smart Analytical Assistant State (No AI Key Needed - Pure algorithmic business intelligence)
  const [activeQuery, setActiveQuery] = useState<'today' | 'top_products' | 'cities' | 'pending' | 'kpis'>('today');

  // Fetch status from backend on mount
  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/telegram-bot/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBotStatus({
            connected: data.connected,
            botInfo: data.botInfo,
            pollingActive: data.pollingActive,
          });
          if (data.config) {
            setBotConfig((prev) => ({
              ...prev,
              ...data.config,
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch bot status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Save Config
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/telegram-bot/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin',
          'x-admin-user-id': 'admin',
        },
        body: JSON.stringify({
          ...botConfig,
          enabled: Boolean(botConfig.botToken && botConfig.chatId),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: 'تم حفظ إعدادات البوت بنجاح! 🌸', type: 'success' });
        await fetchStatus();
      } else {
        setStatusMessage({ text: data.message || 'فشل حفظ الإعدادات', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: 'خطأ في الاتصال بالسيرفر: ' + err.message, type: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/telegram-bot/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin',
          'x-admin-user-id': 'admin',
        },
        body: JSON.stringify({
          botToken: botConfig.botToken,
          chatId: botConfig.chatId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: data.message, type: 'success' });
        await fetchStatus();
      } else {
        setStatusMessage({ text: data.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: 'فشل إرسال رسالة التجربة: ' + err.message, type: 'error' });
    } finally {
      setTestingConnection(false);
    }
  };

  // Trigger manual report to Telegram
  const handleSendReport = async (type: 'today' | 'week' | 'full' | 'excel') => {
    setSendingReport(type);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/telegram-bot/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin',
          'x-admin-user-id': 'admin',
        },
        body: JSON.stringify({ type, chatId: botConfig.chatId }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: data.message, type: 'success' });
      } else {
        setStatusMessage({ text: data.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: 'خطأ: ' + err.message, type: 'error' });
    } finally {
      setSendingReport(null);
    }
  };

  // Analytics Computation (Runs on local orders)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => (o.createdAt || '').slice(0, 10) === todayStr);
  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);

  // Top products calculation
  const productSalesMap: Record<string, { title: string; count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        const title = it.product?.title || it.title || 'منتج';
        const price = Number(it.product?.price || it.price || 0);
        const qty = Number(it.quantity || 1);
        if (!productSalesMap[title]) {
          productSalesMap[title] = { title, count: 0, revenue: 0 };
        }
        productSalesMap[title].count += qty;
        productSalesMap[title].revenue += price * qty;
      });
    }
  });

  const topProductsList = Object.values(productSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top cities
  const citySalesMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    const c = o.city || 'أخرى';
    if (!citySalesMap[c]) {
      citySalesMap[c] = { count: 0, revenue: 0 };
    }
    citySalesMap[c].count += 1;
    citySalesMap[c].revenue += Number(o.finalAmount || 0);
  });
  const topCitiesList = Object.entries(citySalesMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black">بوت تيليجرام لإدارة الطلبات والتقارير</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/25 border border-white/30 backdrop-blur-sm">
                  رسمي ومجاني 100%
                </span>
              </div>
              <p className="text-sky-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                استقبل إشعارات فورية بكل طلب جديد على تيليجرام مع كامل تفاصيل العميل، وتحكّم بحالات الطلبات بأزرار تفاعلية،
                واطلب تقارير المبيعات وتحميل ملفات الإكسل بكبسة زر واحدة من هاتفك.
              </p>
            </div>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 self-start md:self-center shrink-0">
            <div
              className={`w-3 h-3 rounded-full ${
                botStatus.connected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-stone-300'
              }`}
            ></div>
            <span className="text-xs font-bold text-white">
              {botStatus.connected ? (
                <>
                  متصل: <span className="font-mono text-emerald-300">@{botStatus.botInfo?.username || 'بوت مفعل'}</span>
                </>
              ) : (
                'غير مفعل حالياً'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Status Alert if any */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-600 text-sm font-normal px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Settings & Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Bot Configuration & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Configuration Form */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-stone-800">بيانات الربط مع تيليجرام</h3>
              </div>
              <button
                type="button"
                onClick={fetchStatus}
                disabled={loadingStatus}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-sky-600 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                <span>تحديث الحالة</span>
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Bot Token Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رمز البوت (Bot Token) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    dir="ltr"
                    value={botConfig.botToken}
                    onChange={(e) => setBotConfig({ ...botConfig, botToken: e.target.value })}
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                    className="w-full pl-24 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="px-2 py-1 text-[10px] font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 rounded-md cursor-pointer"
                    >
                      {showToken ? 'إخفاء' : 'إظهار'}
                    </button>
                    {botConfig.botToken && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(botConfig.botToken);
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        className="p-1 text-stone-500 hover:text-stone-800 bg-stone-100 rounded-md cursor-pointer"
                        title="نسخ"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">تحصل عليه فوراً وبشكل مجاني من حساب BotFather الرسمي على تيليجرام.</p>
              </div>

              {/* Chat ID Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  معرف المحادثة الخاص بك (Chat ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={botConfig.chatId}
                  onChange={(e) => setBotConfig({ ...botConfig, chatId: e.target.value })}
                  placeholder="مثال: 123456789 أو -100123456789"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  معرف حسابك في تيليجرام الذي ستصل إليه الإشعارات (يمكنك الحصول عليه من بوت userinfobot@).
                </p>
              </div>

              {/* Features Toggles */}
              <div className="pt-2 border-t border-stone-100 space-y-2.5">
                <span className="block text-xs font-bold text-stone-800 mb-1">خصائص التنبيه والتحكم التلقائي:</span>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={botConfig.notifyNewOrders}
                    onChange={(e) => setBotConfig({ ...botConfig, notifyNewOrders: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-stone-300 focus:ring-sky-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800 block">إرسال إشعار فوري عند كل طلب جديد</span>
                    <span className="text-stone-500 text-[11px]">يصلك تنبيه مع كامل تفاصيل الزبون، المنتجات والمبلغ.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={botConfig.allowStatusUpdateFromBot}
                    onChange={(e) => setBotConfig({ ...botConfig, allowStatusUpdateFromBot: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-stone-300 focus:ring-sky-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800 block">تفعيل أزرار التحكم بحالة الطلب من تيليجرام</span>
                    <span className="text-stone-500 text-[11px]">تغيير الحالة (تجهيز، شحن، تسليم، إلغاء) بكبسة زر مباشرة من رسالة الطلب.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={botConfig.dailyReportEnabled}
                    onChange={(e) => setBotConfig({ ...botConfig, dailyReportEnabled: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-stone-300 focus:ring-sky-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800 block">إرسال تقرير يومي تلقائي الساعة 10:00 مساءً</span>
                    <span className="text-stone-500 text-[11px]">ملخص بأرباح اليوم وعدد الطلبات ونسبة الإنجاز.</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-bold hover:shadow-md hover:shadow-sky-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingConfig ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  <span>حفظ وتفعيل البوت</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !botConfig.botToken || !botConfig.chatId}
                  className="py-2.5 px-4 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold hover:bg-stone-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {testingConnection ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  ) : (
                    <Send className="w-4 h-4 text-sky-600" />
                  )}
                  <span>إرسال رسالة تجربة لحسابي</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Manual Report Triggers */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-stone-800">إرسال تقارير فورية إلى تيليجرام الآن</h3>
            </div>
            <p className="text-xs text-stone-500">
              يمكنك طلب إرسال أي من التقارير التالية فوراً إلى حسابك على تيليجرام بدون انتظار:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleSendReport('today')}
                disabled={sendingReport !== null}
                className="p-3 rounded-2xl border border-sky-100 bg-sky-50/50 hover:bg-sky-50 text-sky-800 text-center transition-all cursor-pointer group disabled:opacity-50"
              >
                <Clock className="w-5 h-5 mx-auto text-sky-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold">تقرير اليوم</span>
                <span className="text-[10px] text-sky-600/70">مبيعات اليوم</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendReport('week')}
                disabled={sendingReport !== null}
                className="p-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-800 text-center transition-all cursor-pointer group disabled:opacity-50"
              >
                <TrendingUp className="w-5 h-5 mx-auto text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold">تقرير الأسبوع</span>
                <span className="text-[10px] text-indigo-600/70">آخر 7 أيام</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendReport('full')}
                disabled={sendingReport !== null}
                className="p-3 rounded-2xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-purple-800 text-center transition-all cursor-pointer group disabled:opacity-50"
              >
                <Layers className="w-5 h-5 mx-auto text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold">تقرير شامل</span>
                <span className="text-[10px] text-purple-600/70">كل الطلبات</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendReport('excel')}
                disabled={sendingReport !== null}
                className="p-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-center transition-all cursor-pointer group disabled:opacity-50"
              >
                <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold">ملف Excel</span>
                <span className="text-[10px] text-emerald-600/70">تحميل مباشر</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Step-by-Step Setup Guide */}
        <div className="lg:col-span-5 space-y-6">
          {/* Setup Guide Card */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-700/60 pb-3">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold">دليل تفعيل البوت خلال 30 ثانية</h3>
            </div>

            <ol className="space-y-3.5 text-xs text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-white">افتح تيليجرام وابحث عن BotFather</p>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    أو اضغط على الرابط:{' '}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 underline inline-flex items-center gap-0.5"
                    >
                      t.me/BotFather <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-white">أنشئ بوتاً جديداً</p>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    أرسل له أمر <code className="bg-stone-700 px-1 py-0.5 rounded text-sky-300 font-mono">/newbot</code> ثم
                    اختر اسماً للبوت، وسيعطيك رمز الـ <b className="text-white">API Token</b>.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-white">احصل على معرفك (Chat ID)</p>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    افتح بوت{' '}
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 underline inline-flex items-center gap-0.5"
                    >
                      @userinfobot <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    واضغط Start لمعرفة رقم حسابك، أو افتح البوت الجديد الذي أنشأته واضغط Start.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-semibold text-white">ألصق البيانات واضغط حفظ</p>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    ضع الـ Token والـ Chat ID في الحقول واضغط "حفظ واختبار الاتصال"، وسيبدأ العمل فوراً!
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Quick Telegram Commands Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold text-stone-800">أوامر يمكنك كتابتها للبوت في تيليجرام:</h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="font-bold text-sky-700">/today</span>
                <span className="text-stone-500 font-sans text-[11px]">تقرير مبيعات اليوم</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="font-bold text-sky-700">/week</span>
                <span className="text-stone-500 font-sans text-[11px]">تقرير مبيعات الأسبوع</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="font-bold text-sky-700">/report</span>
                <span className="text-stone-500 font-sans text-[11px]">التقرير الشامل الكلي</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="font-bold text-sky-700">/pending</span>
                <span className="text-stone-500 font-sans text-[11px]">الطلبات المعلقة للبدء بتجهيزها</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="font-bold text-sky-700">/export</span>
                <span className="text-stone-500 font-sans text-[11px]">إرسال ملف إكسل CSV فوري</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SMART REPORTS ASSISTANT (IN-DASHBOARD ANALYTICAL BOT) */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900">المساعد الذكي لتحليل الطلبات والتقارير</h3>
              <p className="text-[11px] text-stone-500">
                تحليل مباشر ودقيق 100% مستخرج من قاعدة بيانات المتجر (دون الحاجة لأي مفتاح أو اشتراك AI خارجي)
              </p>
            </div>
          </div>

          {/* Query Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'today', label: '📊 ملخص اليوم' },
              { id: 'top_products', label: '🌸 أكثر المنتجات مبيعاً' },
              { id: 'cities', label: '📍 مبيعات المحافظات' },
              { id: 'pending', label: '⏳ معلقة تحتاج متابعة' },
              { id: 'kpis', label: '📈 مؤشرات الأداء الكلية' },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setActiveQuery(q.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeQuery === q.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Query Results View */}
        {activeQuery === 'today' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
              <span className="text-[11px] font-bold text-rose-700 block mb-1">طلبات اليوم ({todayStr})</span>
              <span className="text-2xl font-black text-rose-950">{todayOrders.length}</span>
              <span className="text-[10px] text-rose-600 block mt-1">طلب مسجل اليوم</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-700 block mb-1">إيرادات اليوم</span>
              <span className="text-2xl font-black text-emerald-950">
                {todayRevenue.toLocaleString('ar-IQ')} <span className="text-xs font-bold">د.ع</span>
              </span>
              <span className="text-[10px] text-emerald-600 block mt-1">المبيعات الفعلية غير الملغاة</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <span className="text-[11px] font-bold text-amber-700 block mb-1">طلبات بانتظار التجهيز</span>
              <span className="text-2xl font-black text-amber-950">
                {todayOrders.filter((o) => o.status === 'pending').length}
              </span>
              <span className="text-[10px] text-amber-600 block mt-1">تحتاج موافقة أو شحن اليوم</span>
            </div>
          </div>
        )}

        {activeQuery === 'top_products' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700">أكثر 5 منتجات مبيعاً وتحقيقاً للإيرادات:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topProductsList.map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-800 line-clamp-1">{p.title}</span>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                    <span>تم بيع: <b className="text-stone-800">{p.count}</b> قطعة</span>
                    <span>الإيراد: <b className="text-emerald-700">{p.revenue.toLocaleString('ar-IQ')} د.ع</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeQuery === 'cities' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700">توزيع المبيعات والطلبات حسب المحافظات العراقية:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {topCitiesList.map(([cityName, stat], idx) => (
                <div key={idx} className="p-3 rounded-2xl border border-stone-200 bg-white text-center shadow-2xs">
                  <MapPin className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                  <span className="text-xs font-black text-stone-800 block">{cityName}</span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">{stat.count} طلبات</span>
                  <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                    {stat.revenue.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeQuery === 'pending' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-700">
                الطلبات المعلقة التي تتطلب إجراء ({pendingOrders.length} طلب):
              </h4>
              <span className="text-[11px] text-stone-400">يمكنك معالجتها مباشرة من تبويب "إدارة الطلبات" أو من بوت تيليجرام</span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold">
                🎉 لا توجد طلبات معلقة! جميع الطلبات تم تجهيزها وشحنها بنجاح.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingOrders.slice(0, 6).map((ord) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-950">#{ord.id}</span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {ord.city}
                      </span>
                    </div>
                    <div className="text-xs text-stone-800 font-semibold">{ord.customerName}</div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-amber-200/60">
                      <span>{ord.customerPhone}</span>
                      <span className="font-bold text-stone-900">
                        {(ord.finalAmount || 0).toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeQuery === 'kpis' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-stone-500 block mb-1 font-semibold">إجمالي الطلبات</span>
              <span className="text-xl font-black text-stone-900">{orders.length} طلب</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-stone-500 block mb-1 font-semibold">إجمالي الإيرادات</span>
              <span className="text-xl font-black text-emerald-700">{totalRevenue.toLocaleString('ar-IQ')} د.ع</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-stone-500 block mb-1 font-semibold">نسبة التسليم المكتمل</span>
              <span className="text-xl font-black text-blue-700">
                {orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0}%
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-stone-500 block mb-1 font-semibold">متوسط قيمة السلة</span>
              <span className="text-xl font-black text-purple-700">
                {orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString('ar-IQ') : 0} د.ع
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
