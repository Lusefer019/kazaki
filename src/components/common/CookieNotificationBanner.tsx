import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, X, Sparkles } from 'lucide-react';
import { playNotificationChime } from '../../lib/notifications';

export const CookieNotificationBanner: React.FC = () => {
  const { currentLanguage } = useStore();
  const [isVisible, setIsVisible] = useState(false);

  const isEn = currentLanguage === 'en';
  const isKu = currentLanguage === 'ku';

  useEffect(() => {
    try {
      const consent = localStorage.getItem('kazaki_cookie_consent_v1');
      if (!consent) {
        // Show after a gentle 1.5s delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(false);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('kazaki_cookie_consent_v1', 'granted');
    } catch {}

    setIsVisible(false);
    playNotificationChime();
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('kazaki_cookie_consent_v1', 'dismissed');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 bg-stone-900/95 text-white p-5 rounded-3xl shadow-2xl border border-rose-500/30 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-2xl bg-rose-600/30 text-rose-400 shrink-0 mt-0.5 border border-rose-500/30">
          <Sparkles className="w-5 h-5 text-rose-400" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>
                {isEn
                  ? 'Store Experience & Cookies'
                  : isKu
                  ? 'ئەزموونی فرۆشگا و کووکی'
                  : 'ملفات تعريف الارتباط وتجربة الموقع'}
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h4>
            <button
              onClick={handleDismiss}
              className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            {isEn
              ? 'We use cookies to save your cart, preferences, and orders seamlessly inside the store.'
              : isKu
              ? 'کووکی بەکاردەهێنین بۆ پاراستنی سەبەتە و داواکارییەکانت بە شێوەیەکی ئاسان لەناو ماڵپەڕدا.'
              : 'نستخدم ملفات الارتباط لحفظ سلة التسوق، وخياراتك، ومتابعة طلباتك وتنبيهاتك داخل الموقع مباشرة.'}
          </p>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              onClick={handleAcceptAll}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 cursor-pointer transition-all active:scale-95 text-center"
            >
              {isEn ? 'Accept & Continue' : isKu ? 'ڕازیبوون و بەردەوامبوون' : 'موافق ومتابعة'}
            </button>

            <button
              onClick={handleDismiss}
              className="py-2.5 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              {isEn ? 'Later' : isKu ? 'دواتر' : 'لاحقاً'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
