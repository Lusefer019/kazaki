import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  LogIn,
  LogOut,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  Package,
} from 'lucide-react';

const IRAQI_CITIES_DATA = [
  { ar: 'بغداد', en: 'Baghdad', ku: 'بەغدا' },
  { ar: 'أربيل', en: 'Erbil', ku: 'هەولێر' },
  { ar: 'البصرة', en: 'Basra', ku: 'بەسرە' },
  { ar: 'النجف الأشرف', en: 'Najaf', ku: 'نەجەف' },
  { ar: 'كربلاء المقدسة', en: 'Karbala', ku: 'کەربەلا' },
  { ar: 'السليمانية', en: 'Sulaymaniyah', ku: 'سلێمانی' },
  { ar: 'دهوك', en: 'Duhok', ku: 'دهۆک' },
  { ar: 'كركوك', en: 'Kirkuk', ku: 'کەرکووک' },
  { ar: 'بابل / الحلة', en: 'Babylon / Hilla', ku: 'بابل / حللە' },
  { ar: 'ديالى', en: 'Diyala', ku: 'دیالە' },
  { ar: 'الأنبار', en: 'Anbar', ku: 'ئەنبار' },
  { ar: 'صلاح الدين', en: 'Saladin', ku: 'سەڵاحەدین' },
  { ar: 'واسط / الكوت', en: 'Wasit / Kut', ku: 'واسیت / کووت' },
  { ar: 'المثنى / السماوة', en: 'Muthanna / Samawah', ku: 'موسەننا / سەماوە' },
  { ar: 'ميسان / العمارة', en: 'Maysan / Amarah', ku: 'مەیسان / عەمارە' },
  { ar: 'ذي قار / الناصرية', en: 'Dhi Qar / Nasiriyah', ku: 'زی قار / ناسریە' },
  { ar: 'نينوى / الموصل', en: 'Nineveh / Mosul', ku: 'نەینەوا / مووسڵ' },
  { ar: 'الديوانية / القادسية', en: 'Diwaniyah / Qadisiyyah', ku: 'دیوانیە / قادسیە' },
];

export const LoginView: React.FC = () => {
  const {
    currentUser,
    login,
    register,
    loginAdminAsync,
    logout,
    setActiveView,
    getBtnText,
    orders,
    currentLanguage,
    t,
  } = useStore();

  const isEn = currentLanguage === 'en';
  const isKu = currentLanguage === 'ku';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('بغداد');
  const [regPassword, setRegPassword] = useState('');

  // Count user orders if logged in
  const userOrdersCount = orders.filter((o) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const matchEmail = o.customerEmail && currentUser.email && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase();
    const matchPhone = o.customerPhone && currentUser.phone && o.customerPhone.trim() === currentUser.phone.trim();
    return Boolean(matchEmail || matchPhone);
  }).length;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!email || !password) {
      setErrorMessage(
        isEn
          ? 'Please enter your email or phone number and password'
          : isKu
          ? 'تکایە ئیمەیڵ یان ژمارەی مۆبایل و وشەی نهێنی بنووسە'
          : 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور'
      );
      return;
    }

    setIsLoading(true);

    try {
      // First attempt admin check
      const adminRes = await loginAdminAsync(email, password);
      if (adminRes.success) {
        setSuccessMessage(
          isEn
            ? 'Signed in successfully as store administrator'
            : isKu
            ? 'بە سەرکەوتوویی وەک بەڕێوەبەر چوویتە ژوورەوە'
            : 'تم تسجيل الدخول بنجاح كمدير للمتجر'
        );
        setTimeout(() => {
          setActiveView('admin');
        }, 700);
        return;
      }
    } catch {
      // fallback to regular customer login
    }

    // Regular customer login
    const success = login(email, password);
    setIsLoading(false);

    if (success) {
      setSuccessMessage(
        isEn
          ? 'Logged in successfully! Welcome to KAZAKI.IQ'
          : isKu
          ? 'بە سەرکەوتوویی چوویتە ژوورەوە! بەخێربێیت بۆ KAZAKI.IQ'
          : 'تم تسجيل الدخول بنجاح! أهلاً بك في متجر KAZAKI.IQ'
      );
      setTimeout(() => {
        setActiveView('home');
      }, 700);
    } else {
      setErrorMessage(
        isEn
          ? 'Invalid credentials or password, please check and try again'
          : isKu
          ? 'زانیاری چوونەژوورەوە یان وشەی نهێنی هەڵەیە، تکایە دووبارە هەوڵبدەرەوە'
          : 'بيانات تسجيل الدخول أو رمز المرور غير صحيحة، يرجى التأكد وإعادة المحاولة'
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const phone = regPhone.trim();
    const password = regPassword.trim();

    if (!name || !email || !password) {
      setErrorMessage(
        isEn
          ? 'Please fill in all required fields (Name, Email, Password)'
          : isKu
          ? 'تکایە هەموو خانە پێویستەکان پڕبکەرەوە (ناو، ئیمەیڵ، وشەی نهێنی)'
          : 'يرجى ملء جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، كلمة المرور)'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        isEn
          ? 'Password must be at least 6 characters long'
          : isKu
          ? 'وشەی نهێنی دەبێت لانیکەم ٦ پیت یان ژمارە بێت'
          : 'يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل'
      );
      return;
    }

    const success = register({
      name,
      email,
      phone,
      city: regCity,
      password,
    });

    if (success) {
      setSuccessMessage(
        isEn
          ? 'Account created successfully! Welcome to KAZAKI.IQ'
          : isKu
          ? 'هەژمارەکەت بە سەرکەوتوویی دروستکرا! بەخێربێیت بۆ KAZAKI.IQ'
          : 'تم إنشاء حسابك بنجاح! مرحباً بك في متجر KAZAKI.IQ'
      );
      setTimeout(() => {
        setActiveView('home');
      }, 800);
    } else {
      setErrorMessage(
        isEn
          ? 'An error occurred while creating your account, please try again'
          : isKu
          ? 'هەڵەیەک ڕوویدا لە کاتی دروستکردنی هەژمار، تکایە دووبارە هەوڵبدەرەوە'
          : 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى'
      );
    }
  };


  return (
    <div
      className={`min-h-[80vh] bg-gradient-to-b from-rose-50/60 via-white to-pink-50/30 py-10 px-4 sm:px-6 lg:px-8 ${
        isEn ? 'text-left font-sans' : isKu ? 'text-right font-kurdish' : 'text-right font-cairo'
      }`}
      dir={isEn ? 'ltr' : 'rtl'}
    >
      <div className="max-w-xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-rose-100">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <button
              onClick={() => setActiveView('home')}
              className="hover:text-rose-600 transition-colors cursor-pointer"
            >
              {isEn ? 'Home' : isKu ? 'سەرەکی' : 'الرئيسية'}
            </button>
            <ChevronLeft className={`w-3.5 h-3.5 ${isEn ? '' : 'rotate-180'} text-stone-400`} />
            <span className="text-stone-900 font-bold">
              {currentUser
                ? (isEn ? 'Customer Profile' : isKu ? 'پڕۆفایلی هەژمار' : 'ملف الحساب الشخصي')
                : mode === 'login'
                ? (isEn ? 'Customer Sign In' : isKu ? 'چوونەژوورەوەی کڕیار' : 'تسجيل دخول الزبون')
                : (isEn ? 'Create New Account' : isKu ? 'دروستکردنی هەژماری نوێ' : 'إنشاء حساب زبون جديد')}
            </span>
          </div>

          <button
            onClick={() => setActiveView('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs"
          >
            <span>{isEn ? 'Back to Store' : isKu ? 'گەڕانەوە بۆ فرۆشگا' : 'العودة للمتجر'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isEn ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* When user is already logged in */}
        {currentUser ? (
          <div className="bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden p-8 sm:p-10 text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-lg shadow-rose-200">
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-10 h-10" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 bg-rose-100 text-rose-700">
                {currentUser.role === 'admin'
                  ? (isEn ? 'Role: Administrator' : isKu ? 'دەسەڵات: بەڕێوەبەر' : 'صلاحية: المدير العام')
                  : (isEn ? 'Registered Customer' : isKu ? 'هەژماری کڕیار' : 'حساب زبون مسجل')}
              </span>
              <h2 className="text-2xl font-extrabold text-stone-900">
                {isEn ? `Welcome back, ${currentUser.name}` : isKu ? `بەخێربێیت، ${currentUser.name}` : `أهلاً بك، ${currentUser.name}`}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 font-mono">
                {currentUser.email}
              </p>
            </div>

            {/* Customer Details Summary Card */}
            <div className={`p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2.5 text-xs ${isEn ? 'text-left' : 'text-right'}`}>
              <h3 className="font-bold text-stone-800 text-sm border-b border-rose-100 pb-2">
                {isEn ? 'Your Registered Details:' : isKu ? 'زانیارییە تۆمارکراوەکانی هەژمار:' : 'بيانات حسابك المسجلة:'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                <div>
                  <span className="font-semibold text-stone-900">
                    {isEn ? 'Full Name: ' : isKu ? 'ناوی تەواو: ' : 'الاسم الكامل: '}
                  </span>
                  <span>{currentUser.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-stone-900">
                    {isEn ? 'Email: ' : isKu ? 'ئیمەیڵ: ' : 'البريد الإلكتروني: '}
                  </span>
                  <span className="font-mono text-[11px]">{currentUser.email}</span>
                </div>
                {currentUser.phone && (
                  <div>
                    <span className="font-semibold text-stone-900">
                      {isEn ? 'Phone: ' : isKu ? 'مۆبایل: ' : 'رقم الهاتف: '}
                    </span>
                    <span dir="ltr">{currentUser.phone}</span>
                  </div>
                )}
                {currentUser.city && (
                  <div>
                    <span className="font-semibold text-stone-900">
                      {isEn ? 'Governorate: ' : isKu ? 'پارێزگا: ' : 'المحافظة / المدينة: '}
                    </span>
                    <span>
                      {IRAQI_CITIES_DATA.find((c) => c.ar === currentUser.city)?.[currentLanguage] || currentUser.city}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-stone-900">
                    {isEn ? 'Total Orders: ' : isKu ? 'ژمارەی داواکارییەکان: ' : 'عدد الطلبات: '}
                  </span>
                  <span className="font-bold text-rose-600">
                    {userOrdersCount} {isEn ? 'orders' : isKu ? 'داواکاری' : 'طلب'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-bold">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setActiveView('admin')}
                  className="py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isEn ? 'Admin Control Panel' : isKu ? 'داشبۆردی بەڕێوەبەر' : 'لوحة تحكم الإدارة'}</span>
                </button>
              )}

              <button
                onClick={() => setActiveView('products')}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isEn ? 'Browse Lego Flowers' : isKu ? 'بینینی گوڵەکانی لیگۆ' : 'تصفح تشكيلة ورد الليكو'}</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  setSuccessMessage(isEn ? 'Signed out successfully' : isKu ? 'بە سەرکەوتوویی چوویتە دەرەوە' : 'تم تسجيل الخروج بنجاح');
                }}
                className="col-span-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 border border-stone-200 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>{isEn ? 'Sign Out from Account' : isKu ? 'چوونە دەرەوە لە هەژمار' : 'تسجيل الخروج من الحساب'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Authentication Container */
          <div className="bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden p-6 sm:p-10">
            {/* Clean 2-Way Switcher */}
            <div className="grid grid-cols-2 p-1.5 bg-stone-100/80 rounded-2xl mb-8 border border-stone-200/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-stone-600 hover:text-rose-600'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{isEn ? 'Sign In' : isKu ? 'چوونەژوورەوە' : 'تسجيل الدخول'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-rose-600'
                }`}
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>{isEn ? 'Register' : isKu ? 'دروستکردنی هەژمار' : 'إنشاء حساب'}</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1. LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {isEn ? 'Email or Phone Number' : isKu ? 'ئیمەیڵ یان ژمارەی مۆبایل' : 'البريد الإلكتروني أو رقم الهاتف'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={isEn ? 'name@example.com or 07701234567' : isKu ? 'name@example.com یان 07701234567' : 'name@example.com أو 07701234567'}
                      className={`w-full ${
                        isEn ? 'pl-10 pr-4 text-left' : 'pr-10 pl-4 text-right'
                      } py-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all`}
                    />
                    <Mail className={`w-4 h-4 text-stone-400 absolute ${isEn ? 'left-3.5' : 'right-3.5'} top-3.5 pointer-events-none`} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {isEn ? 'Password' : isKu ? 'وشەی نهێنی' : 'كلمة المرور'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full ${
                        isEn ? 'pl-10 pr-10 text-left' : 'pr-10 pl-10 text-right'
                      } py-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all`}
                    />
                    <Lock className={`w-4 h-4 text-stone-400 absolute ${isEn ? 'left-3.5' : 'right-3.5'} top-3.5 pointer-events-none`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`p-1 text-stone-400 hover:text-stone-600 absolute ${isEn ? 'right-3' : 'left-3'} top-3 cursor-pointer`}
                      aria-label={isEn ? 'Toggle password visibility' : isKu ? 'بینینی وشەی نهێنی' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-md shadow-rose-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isLoading
                      ? (isEn ? 'Signing in...' : isKu ? 'چوونەژوورەوە...' : 'جاري التحقق...')
                      : getBtnText('login', isEn ? 'Sign In' : isKu ? 'چوونەژوورەوە' : 'تسجيل الدخول')}
                  </span>
                </button>

                <div className="text-center pt-4 text-xs text-stone-600">
                  {isEn ? "Don't have an account yet? " : isKu ? 'هێشتا هەژمارت دروست نەکردووە؟ ' : 'ليس لديك حساب حتى الآن؟ '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    {isEn ? 'Create New Account' : isKu ? 'دروستکردنی هەژماری نوێ' : 'إنشاء حساب جديد'}
                  </button>
                </div>
              </form>
            )}

            {/* 2. REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {isEn ? 'Full Name' : isKu ? 'ناوی تەواو' : 'الاسم الكامل'} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={isEn ? 'Enter your full name' : isKu ? 'ناوی تەواوت بنووسە' : 'أدخل اسمك الكريم'}
                      className={`w-full ${
                        isEn ? 'pl-10 pr-4 text-left' : 'pr-10 pl-4 text-right'
                      } py-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all`}
                    />
                    <User className={`w-4 h-4 text-stone-400 absolute ${isEn ? 'left-3.5' : 'right-3.5'} top-3.5 pointer-events-none`} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {isEn ? 'Email Address' : isKu ? 'ئیمەیڵ' : 'البريد الإلكتروني'} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full ${
                        isEn ? 'pl-10 pr-4 text-left' : 'pr-10 pl-4 text-right'
                      } py-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all`}
                    />
                    <Mail className={`w-4 h-4 text-stone-400 absolute ${isEn ? 'left-3.5' : 'right-3.5'} top-3.5 pointer-events-none`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      {isEn ? 'Phone Number' : isKu ? 'ژمارەی مۆبایل' : 'رقم الهاتف'} <span className="text-stone-400 font-normal">({isEn ? 'for delivery' : isKu ? 'بۆ گەیاندن' : 'للتوصيل'})</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="07701234567"
                        className={`w-full ${
                          isEn ? 'pl-10 pr-4' : 'pr-10 pl-4'
                        } py-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-left`}
                        dir="ltr"
                      />
                      <Phone className={`w-4 h-4 text-stone-400 absolute ${isEn ? 'left-3.5' : 'right-3.5'} top-3.5 pointer-events-none`} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      {isEn ? 'Governorate / City' : isKu ? 'پارێزگا / شار' : 'المحافظة / المدينة'}
                    </label>
                    <div className="relative">
                      <select
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className={`w-full ${
                          isEn ? 'pl-10 pr-4 text-left' : 'pr-10 pl-4 text-right'
                        } py-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all cursor-pointer bg-white`}
                      >
                        {IRAQI_CITIES_DATA.map((city) => (
                          <option key={city.ar} value={city.ar}>
                            {isEn ? city.en : isKu ? city.ku : city.ar}
                          </option>
                        ))}
                      </select>
                      <MapPin className={`w-4 h-4 text-stone-400 absolute ${isEn ? 'left-3.5' : 'right-3.5'} top-3.5 pointer-events-none`} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {isEn ? 'Password' : isKu ? 'وشەی نهێنی' : 'كلمة المرور'} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={isEn ? 'At least 6 characters' : isKu ? 'لانیکەم ٦ پیت یان ژمارە' : 'أدخل كلمة مرور لا تقل عن 6 أحرف'}
                      className={`w-full ${
                        isEn ? 'pl-10 pr-10 text-left' : 'pr-10 pl-10 text-right'
                      } py-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all`}
                    />
                    <Lock className={`w-4 h-4 text-stone-400 absolute ${isEn ? 'left-3.5' : 'right-3.5'} top-3.5 pointer-events-none`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`p-1 text-stone-400 hover:text-stone-600 absolute ${isEn ? 'right-3' : 'left-3'} top-3 cursor-pointer`}
                      aria-label={isEn ? 'Toggle password visibility' : isKu ? 'بینینی وشەی نهێنی' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-md shadow-rose-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>{isEn ? 'Create Customer Account' : isKu ? 'دروستکردنی هەژماری کڕیار' : 'إنشاء حساب زبون جديد'}</span>
                </button>

                <div className="text-center pt-4 text-xs text-stone-600">
                  {isEn ? 'Already have an account? ' : isKu ? 'هەژمارت هەیە؟ ' : 'لديك حساب بالفعل؟ '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    {isEn ? 'Sign In' : isKu ? 'چوونەژوورەوە' : 'تسجيل الدخول'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

