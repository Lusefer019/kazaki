import React from 'react';
import { useStore } from '../../context/StoreContext';
import { SupportedLanguage } from '../../types';
import { X, Globe, Check } from 'lucide-react';

export const LanguageModal: React.FC = () => {
  const { isLanguageModalOpen, setIsLanguageModalOpen, currentLanguage, setCurrentLanguage } = useStore();

  if (!isLanguageModalOpen) return null;

  const isEn = currentLanguage === 'en';
  const isKu = currentLanguage === 'ku';

  const languages: {
    id: SupportedLanguage;
    name: string;
    nativeName: string;
    subtext: string;
    code: string;
    badge: string;
    fontHint?: string;
  }[] = [
    {
      id: 'ar',
      name: 'العربية (Arabic)',
      nativeName: 'العربية',
      subtext: 'تصفح المتجر باللغة العربية مع كافة التفاصيل والأسعار بالدينار العراقي',
      code: 'AR',
      badge: 'الافتراضية • العراق',
      fontHint: 'واجهة عربية متكاملة وسلسة',
    },
    {
      id: 'en',
      name: 'English',
      nativeName: 'English',
      subtext: 'Browse our full luxury Lego flowers collection with English labels and details',
      code: 'EN',
      badge: 'International',
      fontHint: 'Modern typography & clear layout',
    },
    {
      id: 'ku',
      name: 'کوردی (Kurdish)',
      nativeName: 'کوردی (سۆرانی)',
      subtext: 'تەواوی بەرهەم و بەشەکانی فرۆشگا بە زمانی کوردی سۆرانی ببینە',
      code: 'KU',
      badge: 'کوردستان • سۆرانی',
      fontHint: 'فۆنتی فەرمی کوردی سۆرانی',
    },
  ];

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setTimeout(() => {
      setIsLanguageModalOpen(false);
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setIsLanguageModalOpen(false)}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir={isEn ? 'ltr' : 'rtl'}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-rose-100/80 bg-gradient-to-r from-rose-50/50 via-white to-rose-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 leading-snug">
                {isEn ? 'Select Store Language' : isKu ? 'زمانی فرۆشگا هەڵبژێرە' : 'اختر لغة المتجر'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {isEn
                  ? 'Choose your preferred shopping language'
                  : isKu
                  ? 'تەواوی لاپەڕەکان بە شێوازی ڕاستەوخۆ دەگۆڕدرێن'
                  : 'يمكنك التبديل بين اللغات في أي وقت'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLanguageModalOpen(false)}
            className="p-2 rounded-full hover:bg-rose-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Options List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang.id;

            return (
              <button
                key={lang.id}
                onClick={() => handleSelectLanguage(lang.id)}
                className={`w-full p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-right group ${
                  isEn ? 'text-left' : 'text-right'
                } ${
                  isSelected
                    ? 'border-rose-600 bg-rose-50/60 shadow-xs ring-2 ring-rose-600/10'
                    : 'border-stone-200/80 hover:border-rose-300 hover:bg-rose-50/20 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Language Code Badge */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm tracking-wider shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                      isSelected ? 'bg-rose-600 text-white border border-rose-600' : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <span>{lang.code}</span>
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-stone-900 group-hover:text-rose-600 transition-colors">
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                        {lang.badge}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {lang.subtext}
                    </p>

                    {lang.fontHint && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-800 font-semibold">
                        <Globe className="w-3 h-3 text-amber-600" />
                        <span>{lang.fontHint}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Checkmark or Indicator */}
                <div className="shrink-0 mr-3 ltr:mr-0 ltr:ml-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'border-2 border-stone-300 group-hover:border-rose-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer Note */}
        <div className="p-4 border-t border-rose-100 bg-stone-50/60 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isEn
                ? 'Changes apply instantly without page reload'
                : isKu
                ? 'گۆڕانکارییەکان دەستبەجێ جێبەجێ دەبن'
                : 'التغييرات تنطبق فوراً وتلقائياً'}
            </span>
          </div>

          <button
            onClick={() => setIsLanguageModalOpen(false)}
            className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            {isEn ? 'Done' : isKu ? 'تەواو' : 'تم'}
          </button>
        </div>
      </div>
    </div>
  );
};
