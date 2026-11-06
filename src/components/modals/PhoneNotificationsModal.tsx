import React, { useState } from 'react';
import { useStore, isCurrentSessionAdmin } from '../../context/StoreContext';
import {
  Bell,
  BellOff,
  BellRing,
  X,
  Smartphone,
  CheckCircle2,
  Tag,
  Volume2,
  Package,
  ShieldCheck,
  Send,
  MessageSquare,
  Clock,
  ExternalLink,
  Trash2,
  ShoppingBag,
} from 'lucide-react';

interface PhoneNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneNotificationsModal: React.FC<PhoneNotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    phoneNotificationsEnabled,
    togglePhoneNotifications,
    sendPhoneTestNotification,
    currentLanguage,
    currentUser,
    activeView,
    adminNotifications,
    orders,
    supportMessages,
    tempChats,
    setActiveView,
    markNotificationAsRead,
    clearNotifications,
    t,
  } = useStore();

  const isEn = currentLanguage === 'en';
  const isKu = currentLanguage === 'ku';

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [adminTab, setAdminTab] = useState<'all' | 'orders' | 'messages'>('all');

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin' || isCurrentSessionAdmin(currentUser, activeView);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const res = await togglePhoneNotifications();
      showToast(
        isEn
          ? phoneNotificationsEnabled
            ? 'Phone notifications turned off'
            : 'Phone notifications activated successfully!'
          : isKu
          ? phoneNotificationsEnabled
            ? 'ئاگاداری مۆبایل ناچالاک کرا'
            : 'ئاگاداری مۆبایل بە سەرکەوتوویی چالاک کرا!'
          : res.message
      );
    } catch {
      showToast(
        isEn
          ? 'Error changing notifications status'
          : isKu
          ? 'هەڵەیەک ڕوویدا لە کاتی گۆڕینی دۆخی ئاگاداری'
          : 'حدث خطأ أثناء تعديل حالة الإشعارات'
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendTest = () => {
    sendPhoneTestNotification();
    showToast(
      isEn
        ? 'In-store notification chime played successfully!'
        : isKu
        ? 'دەنگی ئاگاداری ناو فرۆشگا بە سەرکەوتوویی لێدرا!'
        : 'تم تشغيل نغمة الإشعار الصوتي داخل المتجر بنجاح!'
    );
  };

  // Compile full admin notifications items
  const orderNotifs = adminNotifications.filter(
    (n) => n.orderId || n.title?.includes('طلب') || n.title?.includes('Order')
  );
  const messageNotifs = adminNotifications.filter(
    (n) => !n.orderId && (n.title?.includes('رسالة') || n.title?.includes('استفسار') || n.title?.includes('شات') || n.title?.includes('Message'))
  );

  const displayedAdminNotifs =
    adminTab === 'orders'
      ? orderNotifs
      : adminTab === 'messages'
      ? messageNotifs
      : adminNotifications;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className={`relative bg-white rounded-3xl ${
          isAdmin ? 'max-w-2xl' : 'max-w-md'
        } w-full overflow-hidden shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200 ${
          isEn ? 'text-left font-sans' : isKu ? 'text-right font-kurdish' : 'text-right font-cairo'
        }`}
        onClick={(e) => e.stopPropagation()}
        dir={isEn ? 'ltr' : 'rtl'}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-30 p-3 bg-stone-900 text-white rounded-2xl shadow-xl border border-rose-500/40 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-50/80 via-pink-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl transition-colors ${
                phoneNotificationsEnabled
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              {phoneNotificationsEnabled ? (
                <BellRing className="w-5 h-5 animate-bounce" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  {isEn
                    ? 'In-Store Live Notifications'
                    : isKu
                    ? 'ئاگادارییە ڕاستەوخۆکانی ناو ماڵپەڕ'
                    : 'التنبيهات الفورية داخل الموقع'}
                </h2>
                {isAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                    {isEn ? 'Admin' : isKu ? 'بەڕێوەبەر' : 'لوحة الإدارة'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                {isAdmin
                  ? isEn
                    ? 'Live in-store chimes and alerts for incoming orders and customer chats'
                    : isKu
                    ? 'دەنگ و ئاگاداری ڕاستەوخۆی ناو فرۆشگا بۆ داواکاری و چاتی کڕیاران'
                    : 'نغمات صوتية وتنبيهات فورية داخل المتجر لطلبات الزبائن الجديدة والرسائل'
                  : isEn
                  ? 'Instant alerts and audio chime upon new orders and updates'
                  : isKu
                  ? 'ئاگاداری دەستبەجێ بە دەنگ بۆ نوێکردنەوەکان لەناو فرۆشگا'
                  : 'تنبيهات فورية مع نغمة صوتية عند تحديث الطلب أو إضافة منتجات جديدة'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-rose-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            aria-label={isEn ? 'Close' : isKu ? 'داخستن' : 'إغلاق'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Toggle Switch Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              phoneNotificationsEnabled
                ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      phoneNotificationsEnabled
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-stone-400'
                    }`}
                  />
                  <span className="font-bold text-sm">
                    {phoneNotificationsEnabled
                      ? isEn
                        ? 'In-Store Live Notifications Active'
                        : isKu
                        ? 'ئاگادارییەکانی ناو ماڵپەڕ چالاکن'
                        : 'التنبيهات الفورية داخل المتجر مفعّلة'
                      : isEn
                      ? 'In-Store Notifications Muted'
                      : isKu
                      ? 'ئاگادارییەکانی ناو ماڵپەڕ کپکراون'
                      : 'تنبيهات المتجر مكتومة'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {phoneNotificationsEnabled
                    ? isAdmin
                      ? isEn
                        ? 'Instant audio chimes & alerts will fire in-store on new orders and messages.'
                        : isKu
                        ? 'دەنگ و ئاگاداری ڕاستەوخۆ لێدەدات لەناو فرۆشگا لەگەڵ هەر داواکاری و نامەیەکی نوێ.'
                        : 'ستسمع نغمة الرنين وتظهر لك البنرات الفورية في المتجر فور ورود أي طلب أو رسالة.'
                      : isEn
                      ? 'Instant alerts with chime inside the store upon order updates or arrivals.'
                      : isKu
                      ? 'ئاگاداری دەستبەجێ بە دەنگ پێتدەگات لە کاتی نوێکردنەوەی داواکاری.'
                      : 'ستصلك تنبيهات فورية مع نغمة داخل المتجر عند تحديث طلبك أو إضافة منتجات جديدة.'
                    : isEn
                    ? 'In-store audio chimes are muted.'
                    : isKu
                    ? 'دەنگی ئاگادارییەکان کپکراوە.'
                    : 'نغمات التنبيه داخل المتجر مكتومة حالياً.'}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={handleToggle}
                disabled={isToggling}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  phoneNotificationsEnabled ? 'bg-rose-600' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={phoneNotificationsEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    phoneNotificationsEnabled
                      ? isEn
                        ? 'translate-x-6'
                        : '-translate-x-6'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Test button & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={handleSendTest}
                className="py-1.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 text-rose-600 ${isEn ? '' : 'rotate-180'}`} />
                <span>{isEn ? 'Test Chime' : isKu ? 'تاقیکردنەوەی دەنگ' : 'تجربة نغمة الإشعار'}</span>
              </button>

              <span className="text-[11px] text-stone-400">
                {isEn ? 'Plays floral chime & vibrates device.' : isKu ? 'دەنگ و لەرینەوە تاقی دەکاتەوە.' : 'يقوم بتشغيل نغمة الورد واهتزاز الهاتف.'}
              </span>
            </div>
          </div>

          {/* ADMIN LIVE FEED SECTION */}
          {isAdmin ? (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-rose-600" />
                    <span>
                      {isEn ? 'Live Website Notifications' : isKu ? 'ئاگادارییە ڕاستەوخۆکانی ماڵپەڕ' : 'تنبيهات الموقع والطلبات الواردة'}
                    </span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {adminNotifications.length}
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAdminTab('all')}
                    className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      adminTab === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {isEn ? 'All' : isKu ? 'هەموو' : 'الكل'} ({adminNotifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminTab('orders')}
                    className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      adminTab === 'orders' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {isEn ? 'Orders' : isKu ? 'داواکاری' : 'الطلبات'} ({orderNotifs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminTab('messages')}
                    className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      adminTab === 'messages' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {isEn ? 'Messages' : isKu ? 'نامەکان' : 'الرسائل'} ({messageNotifs.length})
                  </button>
                </div>
              </div>

              {/* Feed List */}
              {displayedAdminNotifs.length === 0 ? (
                <div className="text-center py-8 space-y-2 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                  <Bell className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500 font-bold">
                    {isEn
                      ? 'No incoming notifications in this filter'
                      : isKu
                      ? 'هیچ ئاگادارییەک لەم بەشەدا نییە'
                      : 'لا توجد تنبيهات واردة في هذا القسم حالياً'}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {isEn
                      ? 'New orders and customer inquiries will appear here automatically.'
                      : isKu
                      ? 'داواکاری و نامەی نوێ خۆکارانە لێرە دەردەکەون.'
                      : 'الطلبات الجديدة ورسائل الزبائن ستظهر هنا تلقائياً دون الحاجة لتحديث الصفحة.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedAdminNotifs.map((notif) => {
                    const isOrder = Boolean(notif.orderId || notif.title?.includes('طلب'));
                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                          notif.read
                            ? 'bg-stone-50/70 border-stone-200 text-stone-700'
                            : 'bg-rose-50/80 border-rose-200 text-stone-900 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-xl ${
                                isOrder
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {isOrder ? (
                                <Package className="w-3.5 h-3.5" />
                              ) : (
                                <MessageSquare className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span className="font-bold text-stone-900">
                              {t(notif.title)}
                            </span>
                          </div>

                          <span className="text-[10px] text-stone-400 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.timestamp).toLocaleTimeString('ar-IQ', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-stone-600 leading-relaxed text-[11px] pr-7">
                          {t(notif.message)}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <span className="text-stone-400">
                            {notif.customerName && `من: ${notif.customerName}`}
                            {notif.customerPhone && ` • ${notif.customerPhone}`}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              onClose();
                              setActiveView('admin');
                            }}
                            className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <span>
                              {isOrder
                                ? isEn ? 'View in Admin Panel' : 'عرض في لوحة الطلبات'
                                : isEn ? 'Reply to Customer' : 'الرد على الزبون'}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* CUSTOMER FEATURES HIGHLIGHT */
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-bold text-stone-800 block">
                {isEn ? 'What do you receive when enabling alerts?' : isKu ? 'چی وەردەگریت لە کاتی چالاککردنی ئاگاداری؟' : 'ما الذي تتلقاه عند تفعيل الإشعارات؟'}
              </span>
              <div className="grid grid-cols-1 gap-2 text-xs text-stone-600">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-50/40 border border-rose-100/60">
                  <Package className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{isEn ? 'Real-time order packaging & courier delivery tracking' : isKu ? 'بەدواداچوونی ڕاستەوخۆی پاکێجکردن و گەیاندنی مەندووب' : 'متابعة حالة وتوصيل طلباتك لحظة بلحظة'}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-50/40 border border-rose-100/60">
                  <Tag className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{isEn ? 'Exclusive discount codes and special Lego flower promos' : isKu ? 'کۆدی داشکاندن و ئۆفەری تایبەتی گوڵی لیگۆ' : 'كوبونات خصم وعروض حصرية لورد الليكو'}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-50/40 border border-rose-100/60">
                  <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isEn ? 'Gentle floral chime with gentle mobile vibration' : isKu ? 'نەغمەی لەسەرخۆ لەگەڵ لەرینەوەی ئاگادارکردنەوە' : 'نغمة رقيقة مع اهتزاز تنبيهي للهاتف'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
          {isAdmin && adminNotifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
              className="text-stone-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Clear All' : isKu ? 'سڕینەوەی هەموو' : 'مسح كافة التنبيهات'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveView('admin');
                }}
                className="py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {isEn ? 'Go to Admin Dashboard' : isKu ? 'چوون بۆ داشبۆرد' : 'الانتقال للوحة التحكم'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {isEn ? 'Close' : isKu ? 'داخستن' : 'إغلاق'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
