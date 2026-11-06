/**
 * Multi-Language Dictionary Engine for Arabic -> English & Kurdish (Sorani - سۆرانی)
 * نظام قواميس الترجمة والتحويل الفوري من العربية إلى الإنجليزية والكردية
 */

// Comprehensive dictionary for Kurdish Sorani & English
const PHRASE_DICTIONARY: Record<string, { en: string; ku: string }> = {
  // Navigation & Buttons
  'الرئيسية': { en: 'Home', ku: 'سەرەکی' },
  'المتجر': { en: 'Shop', ku: 'فرۆشگا' },
  'تسوق الآن': { en: 'Shop Now', ku: 'ئێستا بکڕە' },
  'تصفح المنتجات': { en: 'Browse Products', ku: 'گەڕان لە بەرهەمەکان' },
  'الأقسام': { en: 'Categories', ku: 'پۆلەکان' },
  'جميع الأقسام': { en: 'All Categories', ku: 'هەموو پۆلەکان' },
  'أضف إلى السلة': { en: 'Add to Cart', ku: 'زیادکردن بۆ سەبەتە' },
  'شراء الآن': { en: 'Buy Now', ku: 'ئێستا بکڕە' },
  'تسجيل الدخول': { en: 'Login', ku: 'چوونەژوورەوە' },
  'إنشاء حساب': { en: 'Register', ku: 'دروستکردنی هەژمار' },
  'إنشاء حساب جديد': { en: 'Register New Account', ku: 'دروستکردنی هەژماری نوێ' },
  'تواصل معنا': { en: 'Contact Us', ku: 'پەیوەندیمان پێوە بکە' },
  'خدمة العملاء': { en: 'Customer Service', ku: 'خزمەتگوزاری کڕیاران' },
  'الدفع وإتمام الطلب': { en: 'Proceed to Checkout', ku: 'تەواوکردنی داواکاری و پارەدان' },
  'إتمام الطلب': { en: 'Complete Order', ku: 'تەواوکردنی داواکاری' },
  'تتبع الطلب': { en: 'Track Order', ku: 'بەدواداچوونی داواکاری' },
  'طلباتي السابقة': { en: 'My Past Orders', ku: 'داواکارییە پێشووەکانم' },
  'عرض السلة': { en: 'View Cart', ku: 'بینینی سەبەتە' },
  'إرسال الرسالة': { en: 'Send Message', ku: 'ناردنی پەیام' },
  'عرض التفاصيل': { en: 'View Details', ku: 'بینینی وردەکارییەکان' },
  'من نحن': { en: 'About Us', ku: 'دەربارەی ئێمە' },
  'من نحن وقصتنا': { en: 'About Us & Story', ku: 'دەربارەی ئێمە و چیرۆکەکەمان' },
  'قصة المتجر': { en: 'Store Story', ku: 'چیرۆکی فرۆشگا' },
  'تسجيل الخروج': { en: 'Logout', ku: 'چوونەدەرەوە' },
  'لوحة التحكم': { en: 'Admin Dashboard', ku: 'دەستەی بەڕێوەبردن' },

  // Flower & Gift Specific Terms
  'ورد الليكو الفاخر': { en: 'Luxury Lego Flowers', ku: 'گوڵی لێکۆی شایستە' },
  'ورد الليكو': { en: 'Lego Flowers', ku: 'گوڵی لێکۆ' },
  'ورد': { en: 'Roses', ku: 'گوڵ' },
  'زهور': { en: 'Flowers', ku: 'گوڵەکان' },
  'ورود ليغو': { en: 'Lego Flowers', ku: 'گوڵی لێکۆ' },
  'ورود ليغو الفاخرة': { en: 'Luxury Lego Flowers', ku: 'گوڵی لێکۆی شایستە' },
  'بوكسات ورد الليكو': { en: 'Lego Flower Boxes', ku: 'سندووق و بوکسی دیاری گوڵی لێکۆ' },
  'بوكسات': { en: 'Boxes', ku: 'بوکسەکان' },
  'ورد جوري': { en: 'Damask Roses', ku: 'گوڵەباخ' },
  'ورد الجوري الفاخر': { en: 'Luxury Red Rose', ku: 'گوڵەباخی شایستە' },
  'أزهار فردية': { en: 'Individual Flowers', ku: 'گوڵی تاکی جیاواز' },
  'أزهار التوليب': { en: 'Tulip Flowers', ku: 'گوڵی لالە' },
  'توليب': { en: 'Tulip', ku: 'گوڵی لالە' },
  'لافندر': { en: 'Lavender', ku: 'لاڤێندەر' },
  'دوار الشمس': { en: 'Sunflower', ku: 'گوڵەبەڕۆژە' },
  'أوركيد': { en: 'Orchid', ku: 'ئۆرکید' },
  'نباتات مصغرة': { en: 'Miniature Plants', ku: 'ڕووەکی بچووککراوە' },
  'نباتات بونساي': { en: 'Bonsai Plants', ku: 'ڕووەکی بۆنسای' },
  'هدايا وتذكارات': { en: 'Gifts & Souvenirs', ku: 'دیاری و یادگارییەکان' },
  'عروض خاصة': { en: 'Special Offers', ku: 'ئۆفەرە تایبەتەکان' },
  'أطقم فاخرة': { en: 'Luxury Sets', ku: 'سێتی شایستە' },
  'صندوق هدايا': { en: 'Gift Box', ku: 'سندووقی دیاری' },
  'مزهرية فاخرة': { en: 'Luxury Vase', ku: 'گوڵدانی شایستە' },

  // E-commerce Status & UI
  'وصل حديثاً': { en: 'New Arrival', ku: 'تازە گەیشتوو' },
  'الأكثر مبيعاً': { en: 'Best Seller', ku: 'پڕفرۆشترین' },
  'تخفيض خاص': { en: 'Special Discount', ku: 'داشکاندنی تایبەت' },
  'توصيل سريع': { en: 'Fast Delivery', ku: 'گەیاندنی خێرا' },
  'توصيل مجاني': { en: 'Free Delivery', ku: 'گەیاندنی بێبەرامبەر' },
  'لكافة محافظات العراق': { en: 'To all Iraq governorates', ku: 'بۆ هەموو پارێزگاکانی عێراق' },
  'ضمان الجودة': { en: 'Quality Guarantee', ku: 'متمانەی کوالێتی بەرز' },
  'الدفع عند الاستلام': { en: 'Cash on Delivery', ku: 'پارەدان لەکاتی وەرگرتن' },
  'السعر': { en: 'Price', ku: 'نرخ' },
  'السعر الإجمالي': { en: 'Total Price', ku: 'کۆی گشتی نرخ' },
  'المجموع': { en: 'Total', ku: 'کۆی گشتی' },
  'دينار عراقي': { en: 'IQD', ku: 'دیناری عێراقی' },
  'متوفر في المخزون': { en: 'In Stock', ku: 'بەردەستە لە کۆگا' },
  'متوفر بالمخزون': { en: 'In Stock', ku: 'لە کۆگادا بەردەستە' },
  'غير متوفر حالياً': { en: 'Currently Out of Stock', ku: 'لە ئێستادا نەماوە' },
  'غير متوفر': { en: 'Out of Stock', ku: 'بەردەست نییە' },
  'نفدت الكمية': { en: 'Out of Stock', ku: 'لە کۆگادا نەماوە' },
  'الكمية': { en: 'Quantity', ku: 'بڕ' },
  'الكمية:': { en: 'Quantity:', ku: 'بڕ / ژمارە:' },
  'كود الخصم': { en: 'Discount Code', ku: 'کۆدی داشکاندن' },
  'تطبيق الكود': { en: 'Apply Code', ku: 'جێبەجێکردنی کۆد' },
  'تطبيق الخصم': { en: 'Apply Discount', ku: 'داشکاندن بەکاربهێنە' },
  'معلومات التوصيل': { en: 'Shipping Info', ku: 'زانیارییەکانی گەیاندن' },
  'الاسم الكامل': { en: 'Full Name', ku: 'ناوی تەواو' },
  'الاسم الكريم': { en: 'Full Name', ku: 'ناوی تەواو' },
  'رقم الهاتف': { en: 'Phone Number', ku: 'ژمارەی مۆبایل' },
  'رقم الجوال': { en: 'Phone Number', ku: 'ژمارەی مۆبایل' },
  'رقم الهاتف والجوال': { en: 'Phone Number', ku: 'ژمارەی مۆبایل' },
  'المحافظة': { en: 'Governorate', ku: 'پارێزگا' },
  'المحافظة / المدينة': { en: 'Governorate / City', ku: 'پارێزگا / شار' },
  'محافظة التوصيل': { en: 'Delivery Governorate', ku: 'پارێزگای گەیاندن' },
  'العنوان بالتفصيل': { en: 'Detailed Address', ku: 'ناونیشانی تەواو' },
  'ملاحظات إضافية': { en: 'Additional Notes', ku: 'تێبینی زیاتر' },
  'ملاحظات إضافية للتوصيل': { en: 'Delivery Notes (Optional)', ku: 'تێبینی زیاتر بۆ گەیاندن' },
  'تم الطلب بنجاح': { en: 'Order Placed Successfully', ku: 'داواکارییەکە بەسەرکەوتوویی نێردرا' },
  'شكراً لثقتكم': { en: 'Thank you for your trust', ku: 'سوپاس بۆ متمانەتان' },
  'شكراً لثقتكم بمتجر KAZAKI.IQ': { en: 'Thank you for choosing KAZAKI.IQ', ku: 'سوپاس بۆ هەڵبژاردنی KAZAKI.IQ' },
  'اختياري': { en: 'Optional', ku: 'ئارەزوومەندانە' },
  'تطبيق': { en: 'Apply', ku: 'جێبەجێکردن' },
  'إلغاء': { en: 'Cancel', ku: 'هەڵوەشاندنەوە' },
  'حذف': { en: 'Delete', ku: 'سڕینەوە' },
  'تعديل السعر': { en: 'Edit Price', ku: 'دەستکاری نرخ' },
  'د.ع': { en: 'IQD', ku: 'د.ع' },
  'دينار': { en: 'IQD', ku: 'دینار' },

  // Hero & Brand Taglines
  'ورد مميز لا يذبل • صممت لتبقى معك للأبد': { en: 'Special Flowers That Never Wilt • Designed To Stay With You Forever', ku: 'گوڵی بێوێنە کە هەرگیز سیس نابێت • دیزاین کراوە تا هەمیشە لەگەڵت بمێنێتەوە' },
  'صممت لتبقى معك للأبد': { en: 'Designed To Stay With You Forever', ku: 'دیزاین کراوە تا هەمیشە لەگەڵت بمێنێتەوە' },
  'ورد مميز لا يذبل صُممت لتبقى معك للأبد مع ضمان الجودة والتغليف الفاخر لجميع الطلبات': { en: 'Special flowers that never wilt, designed to stay with you forever with luxury packaging', ku: 'گوڵی بێوێنە کە هەرگیز سیس نابێت، دیزاین کراوە بۆ ئەوەی هەمیشە بمێنێتەوە لەگەڵ گەرەنتی کوالێتی و پێچانەوەی شایستە بۆ هەموو داواکارییەکان' },
  'اختيار اجمل انواع الورد بعناية مع ضمان الجودة والتغليف الفاخر لجميع الطلبات': { en: 'Carefully selecting the most beautiful flowers with guaranteed quality and luxury packaging for all orders', ku: 'هەڵبژاردنی جوانترین جۆرەکانی گوڵ بە وردی لەگەڵ گەرەنتی کوالێتی و پێچانەوەی شاهانە بۆ سەرجەم داواکارییەکان' },
  'ورد مميز لا يذبل صُممت لتبقى معك للأبد بأرقى تفاصيل التركيب والتغليف الفاخر': { en: 'Special flowers that never wilt, designed to stay forever with premium packaging', ku: 'گوڵی تایبەت کە هەرگیز سیس نابێت، دروستکراوە بۆ هەمیشە بە باڵاترین وردەکارییەکانی بەستن و پێچانەوەی شاهانە' },
  'ورد الليكو الدائم للأبد': { en: 'Forever Blooming Lego Flowers', ku: 'گوڵی لێکۆی هەمیشەیی بۆ هەتاهەتایە' },
  'ورد مميز لا يذبل': { en: 'Special Flowers That Never Wilt', ku: 'گوڵی بێوێنە کە هەرگیز سیس نابێت' },
  'ورد دائم لا يذبل': { en: 'Everlasting Flowers', ku: 'گوڵی هەمیشەیی کە سیس نابێت' },
  'ورد لا يذبل للأبد': { en: 'Flowers That Never Wilt', ku: 'گوڵی نەمر بۆ هەتاهەتایە' },
  'ورد لا يذبل': { en: 'Everlasting Flowers', ku: 'گوڵی نەپووکاوە' },
  'لا يذبل للأبد': { en: 'Never Wilts', ku: 'هەرگیز سیس نابێت' },
  'أهلاً بكم في عالم ورد الليكو | KAZAKI.IQ': { en: 'Welcome to KAZAKI.IQ Lego Flowers', ku: 'بەخێربێن بۆ جیهانی گوڵی لێکۆ | KAZAKI.IQ' },
  'تشكيلة ورد الليكو الفاخرة': { en: 'Luxury Lego Flowers Collection', ku: 'کۆمەڵەی ناوازەی گوڵی لێکۆ' },
  'التسوق حسب القسم': { en: 'Shop by Category', ku: 'کڕین بەپێی پۆل' },
  'عرض الكل': { en: 'View All', ku: 'بینینی هەمووی' },
  'جميع المنتجات': { en: 'All Products', ku: 'هەموو بەرهەمەکان' },
  'تصفح ورود ليغو': { en: 'Browse Lego Flowers', ku: 'گەڕان لە گوڵی لێکۆ' },
  'تصفحي المنتجات': { en: 'Explore Products', ku: 'سەیری بەرهەمەکان بکە' },
  'تسوق ورد الليكو الآن': { en: 'Shop Lego Flowers Now', ku: 'ئێستا گوڵی لێکۆ بکڕە' },
  'استكشف ورد الليكو': { en: 'Explore Lego Flowers', ku: 'سەیری گوڵی لێکۆ بکە' },
  'استكشاف ورد الليكو': { en: 'Explore Lego Flowers', ku: 'سەیری گوڵی لێکۆ بکە' },
  'دخول إلى المتجر': { en: 'Enter Store', ku: 'چوونەژوورەوەی فرۆشگا' },

  // Trust & Guarantees
  'منتجات أصلية 100%': { en: '100% Authentic Products', ku: 'بەرهەمی ١٠٠٪ ئەسڵی و دەستەبەرکراو' },
  'منتج أصلي 100%': { en: '100% Authentic', ku: 'بەرهەمی ١٠٠٪ ئەسڵی' },
  'ورد أصلي لا يذبل': { en: '100% Authentic Everlasting Flowers', ku: 'گوڵی ئەسڵی کە هەرگیز سیس نابێت' },
  'ورد أصلي ومضمون': { en: 'Guaranteed Authentic Flowers', ku: 'گوڵی ئەسڵی و دەستەبەرکراو' },
  'ورد ليكو أصلي ومضمون': { en: 'Original Guaranteed Lego Flowers', ku: 'گوڵی لێکۆی ئەسڵی و دەستەبەرکراو' },
  'شحن لجميع العراق': { en: 'Shipping Across All Iraq', ku: 'گەیاندن بۆ هەموو عێراق' },
  'شحن سريع وموثوق': { en: 'Shipping Across All Iraq', ku: 'گەیاندن بۆ هەموو عێراق' },
  'إرجاع سهل ومرن': { en: 'Easy & Flexible Returns', ku: 'گەڕاندنەوەی ئاسان و گونجاو' },
  'إرجاع سهل': { en: 'Easy Returns', ku: 'گەڕاندنەوەی ئاسان' },
  'ضمان ذهبي للمنتجات': { en: 'Golden Quality Guarantee', ku: 'گرەنتی زێڕینی بەرهەمەکان' },
  'ضمان الجودة الذهبي': { en: 'Golden Quality Guarantee', ku: 'گرەنتی زێڕینی کواڵیتی' },
  'خلال 24-48 ساعة': { en: 'Within 24-48 Hours', ku: 'لە ماوەی ٢٤-٤٨ کاتژمێردا' },
  'خلال 24 ساعة': { en: 'Within 24 Hours', ku: 'لە ماوەی ٢٤ کاتژمێردا' },
  'خلال 48 ساعة': { en: 'Within 48 Hours', ku: 'لە ماوەی ٤٨ کاتژمێردا' },
  'خلال 14 يوماً بسهولة': { en: 'Easy 14-day policy', ku: 'لە ماوەی ١٤ رۆژدا بە ئاسانی' },
  'تغليف فاخر ومميز': { en: 'Premium Luxury Packaging', ku: 'پێچانەوەی شایستە' },
  'شحن لكل العراق': { en: 'All Iraq Delivery', ku: 'گەیاندن بۆ هەموو عێراق' },
  'توصيل لكافة العراق': { en: 'All Iraq Delivery', ku: 'گەیاندن بۆ هەموو عێراق' },

  // User & Nav
  'حسابي': { en: 'My Account', ku: 'هەژماری من' },
  'حساب الزبون': { en: 'Customer Account', ku: 'هەژماری کڕیار' },
  'سجّل دخولك لمتابعة مشترياتك وطلباتك بكل سهولة': { en: 'Sign in to easily track your orders and purchases', ku: 'بچۆ ژوورەوە بۆ ئەوەی بە ئاسانی چاودێری کڕین و داواکارییەکانت بکەیت' },
  'تفاصيل حسابي والملف الشخصي': { en: 'Account Details & Profile', ku: 'وردەکاری هەژمارەکەم و پرۆفایل' },
  'حسابي والملف': { en: 'My Profile', ku: 'هەژمار و پرۆفایل' },
  'لوحة تحكم المتجر (الإدارة)': { en: 'Admin Dashboard', ku: 'دەستەی بەڕێوەبردن (ئەدمین)' },
  'الإدارة': { en: 'Admin', ku: 'بەڕێوەبردن' },
  'صلاحية: المدير العام': { en: 'Role: General Manager', ku: 'ڕۆڵ: بەڕێوەبەری گشتی' },
  'حساب زبون مسجل': { en: 'Registered Customer', ku: 'کڕیاری تۆمارکراو' },
  'تغيير لغة المتجر': { en: 'Change Language', ku: 'گۆڕینی زمانی فرۆشگا' },
  'دخول': { en: 'Enter', ku: 'چوونەژوورەوە' },
  'اللغة / Language:': { en: 'Language:', ku: 'زمان:' },

  // Cart & Checkout
  'سلة المشتريات': { en: 'Shopping Cart', ku: 'سەبەتەی کڕین' },
  'السلة فارغة': { en: 'Cart is empty', ku: 'سەبەتە بەتاڵە' },
  'سلة المشتريات فارغة': { en: 'Shopping cart is empty', ku: 'سەبەتەی کڕین بەتاڵە' },
  'سلة المشتريات فارغة حالياً': { en: 'Shopping cart is currently empty', ku: 'سەبەتەی کڕین لە ئێستادا بەتاڵە' },
  'مجموع المنتجات:': { en: 'Subtotal:', ku: 'کۆی بەرهەمەکان:' },
  'مجموع المنتجات': { en: 'Products Subtotal', ku: 'کۆی بەرهەمەکان' },
  'الخصم المطبق:': { en: 'Discount Applied:', ku: 'داشکاندنی بەکارهاتوو:' },
  'الخصم المطبق': { en: 'Discount Applied', ku: 'داشکاندنی بەکارهاتوو' },
  'رسوم التوصيل:': { en: 'Delivery Fee:', ku: 'کرێی گەیاندن:' }
  ,'رسوم التوصيل': { en: 'Delivery Fee', ku: 'کرێی گەیاندن' },
  'أجرة التوصيل إلى': { en: 'Delivery Fee to', ku: 'کرێی گەیاندن بۆ' },
  'الإجمالي النهائي:': { en: 'Final Total:', ku: 'کۆی گشتی کۆتایی:' },
  'الإجمالي النهائي': { en: 'Final Total', ku: 'کۆی گشتی کۆتایی' },
  'المبلغ الإجمالي المطلوب:': { en: 'Total Amount Due:', ku: 'کۆی گشتی دراو:' },
  'متابعة إتمام الطلب': { en: 'Proceed to Checkout', ku: 'تەواوکردنی داواکاری و پارەدان' },
  'تهانينا! لقد حصلتِ على شحن مجاني': { en: 'Congratulations! You unlocked free shipping', ku: 'پیرۆزە! گەیاندنی بێبەرامبەرت بەدەستهێنا' },
  'للشحن المجاني!': { en: 'for free shipping!', ku: 'بۆ گەیاندنی بێبەرامبەر!' },
  'أضيفي بقيمة': { en: 'Add', ku: 'زیاد بکە بە بڕی' },
  'إتمام وتأكيد الطلب': { en: 'Checkout & Confirm Order', ku: 'تەواوکردنی داواکاری و پارەدان' },
  'بيانات المستلم وعنوان التوصيل': { en: 'Recipient & Delivery Details', ku: 'زانیاری وەرگر و ناونیشانی گەیاندن' },
  'طريقة الدفع المعتمدة': { en: 'Accepted Payment Methods', ku: 'شێوازەکانی پارەدان' },
  'طرق الدفع المعتمدة': { en: 'Accepted Payment Methods', ku: 'شێوازەکانی پارەدان' },
  'الدفع نقداً لمندوب التوصيل عند استلام الطلب ومعاينته': { en: 'Pay in cash to the courier upon receiving and inspecting the order', ku: 'پارەی کاش بدە لە کاتی وەرگرتن و پشکنینی داواکارییەکەدا' },
  'ادفعي نقداً لمندوب التوصيل عند استلام الطلب ومعاينته': { en: 'Pay in cash to the courier upon receiving and inspecting the order', ku: 'پارەی کاش بدە لە کاتی وەرگرتن و پشکنینی داواکارییەکەدا' },
  'الدفع الإلكتروني المباشر ببطاقة ماستركارد مصرف الرافدين': { en: 'Direct electronic payment via Al-Rafidain Mastercard', ku: 'پارەدانی ڕاستەوخۆ بە ماستەرکاردی بانکی ڕافیدەین' },
  'تأكيد ودفع الطلب': { en: 'Confirm & Place Order', ku: 'تەواوکردنی داواکاری و پارەدان' },
  'المدة التقديرية:': { en: 'Estimated delivery:', ku: 'کاتی گەیشتن:' },
  'شحن مجاني': { en: 'Free Shipping', ku: 'گەیاندنی بێبەرامبەر' },
  'رقم الطلب:': { en: 'Order ID:', ku: 'ژمارەی داواکاری:' }
  ,'رقم التتبع السريع:': { en: 'Tracking Number:', ku: 'ژمارەی بەدواداچوون:' },
  'نسخ رقم التتبع': { en: 'Copy tracking number', ku: 'کۆپیکردنی ژمارەی بەدواداچوون' },
  'تم النسخ!': { en: 'Copied!', ku: 'کۆپی کرا!' },
  'طريقة الدفع:': { en: 'Payment Method:', ku: 'شێوازی پارەدان:' },
  'مدينة التوصيل:': { en: 'Delivery City:', ku: 'شاری گەیاندن:' },
  'المبلغ الإجمالي المدفوع:': { en: 'Total Amount Due:', ku: 'کۆی گشتی دراو:' },
  'متابعة التسوق بالمتجر': { en: 'Continue Shopping', ku: 'بەردەوامبوون لە کڕین' },
  'تسوق الآن واستكشف ورود ليغو': { en: 'Shop Now & Explore Lego Flowers', ku: 'ئێستا بکڕە و سەیری گوڵی لێکۆ بکە' },
  'تسوق الآن واستكشف ورود ليغو والبوكسات': { en: 'Shop Now & Explore Lego Flowers & Boxes', ku: 'ئێستا بکڕە و سەیری گوڵی لێکۆ و بوکسەکان بکە' },
  'تواصل مع خدمة العملاء': { en: 'Contact Customer Service', ku: 'پەیوەندی بە خزمەتگوزاری کڕیاران بکە' },
  'تمت الإضافة بنجاح إلى السلة!': { en: 'Added to cart successfully!', ku: 'بە سەرکەوتوویی خرایە سەبەتەوە!' },
  'الترتيب:': { en: 'Sort by:', ku: 'ڕیزکردن:' },
  'المميزة والأكثر طلباً': { en: 'Featured & Popular', ku: 'دیاریکراو و پڕداواکاری' },
  'السعر: من الأقل للأعلى': { en: 'Price: Low to High', ku: 'نرخ: لە کەمەوە بۆ زۆر' },
  'السعر: من الأعلى للأقل': { en: 'Price: High to Low', ku: 'نرخ: لە زۆرەوە بۆ کەم' },
  'الأعلى تقييماً': { en: 'Top Rated', ku: 'بەرزترین هەڵسەنگاندن' },
  'لم يتم العثور على منتجات مطابقة': { en: 'No matching products found', ku: 'هیچ بەرهەمێکی گونجاو نەدۆزرایەوە' },
  'جربي البحث بكلمات أخرى أو تصفح قسم مختلف من أقسام المتجر.': { en: 'Try searching with different keywords or browse another category.', ku: 'هەوڵبدە بە وشەی تر بگەڕێیت یان سەیری پۆلێکی تری فرۆشگاکە بکە.' },
  'إعادة تعيين التصفية': { en: 'Reset Filters', ku: 'ڕێکخستنەوەی فلتەرەکان' },
  'إلغاء البحث': { en: 'Clear Search', ku: 'سڕینەوەی گەڕان' },
  'نتائج البحث عن:': { en: 'Search results for:', ku: 'ئەنجامەکانی گەڕان بۆ:' },
  'البحث في المتجر...': { en: 'Search the store...', ku: 'گەڕان لە فرۆشگادا...' },

  // Footer & About
  'جميع الحقوق محفوظة لمتجر': { en: 'All rights reserved to', ku: 'هەموو مافەکان پارێزراون بۆ فرۆشگای' },
  'جميع الحقوق محفوظة': { en: 'All rights reserved', ku: 'هەموو مافەکان پارێزراون' },
  'تابعينا على السوشيال ميديا': { en: 'Follow Us on Social Media', ku: 'لە تۆڕە کۆمەڵایەتییەکان لەگەڵمان بن' },
  'إرسال رسالة أو استفسار مباشر': { en: 'Send a message or direct inquiry', ku: 'ناردنی پەیام یان پرسیاری ڕاستەوخۆ' },
  'المقر الفعلي في العراق': { en: 'Store Boutique in Iraq', ku: 'شوێنی سەرەکی لە عێراق' },
  'أوقات العمل:': { en: 'Working Hours:', ku: 'کاتەکانی کارکردن:' },
  'يومياً 10:00 ص - 10:00 م': { en: 'Daily 10:00 AM - 10:00 PM', ku: 'ڕۆژانە ١٠:٠٠ بەیانی - ١٠:٠٠ شەو' },
  'أرسلي رسالة أو استفسار لفريقنا': { en: 'Send a message or inquiry to our team', ku: 'پەیام یان پرسیارێک بنێرە بۆ تیمەکەمان' },
  'موضوع الرسالة': { en: 'Message Subject', ku: 'بابەتی پەیام' },
  'نص الرسالة أو الاستفسار': { en: 'Message or Inquiry Details', ku: 'دەقی پەیام یان پرسیار' },
  'إرسال الرسالة إلى خدمة العملاء': { en: 'Send Message to Support', ku: 'ناردنی پەیام بۆ خزمەتگوزاری کڕیاران' },
  'تم إرسال رسالتكِ بنجاح! سيقوم فريق خدمة عملاء KAZAKI.IQ بالرد عليكِ في أقرب وقت.': { en: 'Your message has been sent successfully! The KAZAKI.IQ team will reply shortly.', ku: 'پەیامەکەت بە سەرکەوتوویی نێردرا! تیمی KAZAKI.IQ بەمزووانە وەڵامت دەداتەوە.' },
  'محادثة واتساب فورية': { en: 'Direct WhatsApp Chat', ku: 'چاتی ڕاستەوخۆی واتسئاپ' },
  'متابعة انستغرام': { en: 'Follow on Instagram', ku: 'فۆڵۆو لە ئینستاگرام' },
  'حساب تيك توك الرسمي': { en: 'Official TikTok Account', ku: 'هەژماری فەرمی تیکتۆک' },
  'تسوق آمن وموثوق مع خيارات دفع متعددة في العراق': { en: 'Secure shopping with trusted payment options in Iraq', ku: 'کڕینی پارێزراو لەگەڵ هەڵبژاردەی جۆراوجۆری پارەدان لە عێراق' },
  'طرق الدفع المعتمدة في KAZAKI.IQ': { en: 'Accepted Payment Methods in KAZAKI.IQ', ku: 'شێوازە پەسەندکراوەکانی پارەدان لە KAZAKI.IQ' },
  'تسجيل الدخول للاستمتاع بتجربة تسوق متكاملة وسريعة': { en: 'Sign in to enjoy a complete shopping experience', ku: 'بچۆ ژوورەوە بۆ ئەزموونی کڕینێکی تەواو' },
  'العودة للرئيسية': { en: 'Back to Home', ku: 'گەڕانەوە بۆ سەرەکی' },
  'فلسفة البداية والشغف': { en: 'Our Concept & Philosophy', ku: 'فەلسەفەی دەستپێک و خولیا' },
  'رسالتنا ووعدنا لكل عميل': { en: 'Our Mission & Promise', ku: 'پەیام و بەڵێنمان بۆ کڕیار' },
  'دقة هندسية وجمال خالد لا يبهت': { en: 'Precision Craftsmanship & Timeless Elegance', ku: 'ئەندازەی ورد و جوانی نەمر کە کاڵ نابێتەوە' },
  'سنوات من التميز': { en: 'Years of Passion', ku: 'ساڵانێک لە داهێنان' },
  'زبون يثق بنا': { en: 'Happy Clients', ku: 'کڕیار متمانەمان پێدەکات' },
  'معرض صور المتجر والورشة': { en: 'Boutique & Studio Gallery', ku: 'گەلەری وێنەی فرۆشگا و کارگە' },
  'لقطات ورد الليكو': { en: 'Lego Flower Glimpses', ku: 'دیمەنەکانی گوڵی لێکۆ' },
  'لماذا يختار الجميع KAZAKI.IQ؟': { en: 'Why Choose KAZAKI.IQ?', ku: 'بۆچی هەموان KAZAKI.IQ هەڵدەبژێرن؟' },
  'مزايا فريدة صنعت لأجمل لحظات العمر': { en: 'Crafted For Life’s Most Precious Moments', ku: 'تایبەتمەندی بێوێنە بۆ جوانترین ساتەکانی ژیان' },
  'اجعل هديتك تدوم للأبد': { en: 'Make It An Everlasting Gift', ku: 'دیارییەکەت بکە بە هەمیشەیی' },
  'جاهز لاختيار بوكس أو ورود ليغو التي تناسب ذوقك؟': { en: 'Ready To Pick Your Luxury Lego Flowers or Box?', ku: 'ئامادەیت بۆ هەڵبژاردنی بوکس یان گوڵی لێکۆ کە لەگەڵ چێژت دەگونجێت؟' },
  'تصفح تشكيلتنا الحصرية مع خدمة التوصيل السريع لكافة محافظات العراق والتغليف الفاخر والمميز.': { en: 'Explore our exclusive collection with fast delivery across Iraq and luxury gift packaging.', ku: 'سەیری کۆمەڵە تایبەتەکەمان بکە بە گەیاندنی خێرا بۆ هەموو پارێزگاکان و پێچانەوەی شایستە.' },
  'سجل وتتبع طلبات المشتريات': { en: 'Orders History & Tracking', ku: 'مێژووی داواکارییەکان و بەدواداچوون' },
  'تتبعي مسار شحناتكِ وإشعارات التوصيل لحظة بلحظة في KAZAKI.IQ': { en: 'Track your shipments and real-time delivery notifications in KAZAKI.IQ', ku: 'چاودێری گەیشتنی بارەکەت و ئاگادارییەکان بکە لە KAZAKI.IQ' },
  'تتبع طلب عبر رقم الطلب أو رقم الهاتف:': { en: 'Track order via Order ID or Phone Number:', ku: 'بەدواداچوونی داواکاری بە ژمارەی داواکاری یان مۆبایل:' },
  'قيد الانتظار': { en: 'Pending', ku: 'چاوەڕوانکراو' },
  'جاري التجهيز بالمستودع': { en: 'Processing in Warehouse', ku: 'لە ئامادەکردندایە' },
  'تم الشحن مع المندوب': { en: 'Shipped with Courier', ku: 'نێردرا لەگەڵ نوێنەر' },
  'تم التوصيل بنجاح': { en: 'Delivered Successfully', ku: 'بە سەرکەوتوویی گەیشت' },
  'طلب ملغي': { en: 'Cancelled', ku: 'هەڵوەشێنراوەتەوە' },
};

// Word-level mapping for intelligent composition
const WORD_MAP: Record<string, { en: string; ku: string }> = {
  // Objects & Nouns
  'ورد': { en: 'Rose', ku: 'گوڵ' },
  'وردة': { en: 'Rose', ku: 'گوڵ' },
  'زهور': { en: 'Flowers', ku: 'گوڵەکان' },
  'زهرة': { en: 'Flower', ku: 'گوڵ' },
  'بوكس': { en: 'Box', ku: 'بوکس' },
  'بوكسات': { en: 'Boxes', ku: 'بوکسەکان' },
  'ليغو': { en: 'Lego', ku: 'لێکۆ' },
  'ليكو': { en: 'Lego', ku: 'لێکۆ' },
  'هدية': { en: 'Gift', ku: 'دیاری' },
  'هدايا': { en: 'Gifts', ku: 'دیارییەکان' },
  'صندوق': { en: 'Box', ku: 'سندووق' },
  'علبة': { en: 'Box', ku: 'قوتوو' },
  'مزهرية': { en: 'Vase', ku: 'گوڵدان' },
  'قسم': { en: 'Category', ku: 'پۆل' },
  'أقسام': { en: 'Categories', ku: 'پۆلەکان' },
  'منتج': { en: 'Product', ku: 'بەرهەم' },
  'منتجات': { en: 'Products', ku: 'بەرهەمەکان' },
  'طلب': { en: 'Order', ku: 'داواکاری' },
  'طلبات': { en: 'Orders', ku: 'داواکارییەکان' },
  'سعر': { en: 'Price', ku: 'نرخ' },
  'متجر': { en: 'Store', ku: 'فرۆشگا' },
  'توصيل': { en: 'Delivery', ku: 'گەیاندن' },
  'شحن': { en: 'Shipping', ku: 'گەیاندن' },
  'خصم': { en: 'Discount', ku: 'داشکاندن' },
  'كوبون': { en: 'Coupon', ku: 'کۆپۆن' },
  'سلة': { en: 'Cart', ku: 'سەبەتە' },
  'تفاصيل': { en: 'Details', ku: 'وردەکاری' },
  'وصف': { en: 'Description', ku: 'وەسف' },
  'عطر': { en: 'Perfume', ku: 'بۆن' },
  'طقم': { en: 'Set', ku: 'سێت' },
  'تحفة': { en: 'Masterpiece', ku: 'شاكار' },
  'ديكور': { en: 'Decor', ku: 'دیکۆر' },
  'حب': { en: 'Love', ku: 'خۆشەویستی' },
  'جمال': { en: 'Beauty', ku: 'جوانی' },
  'أناقة': { en: 'Elegance', ku: 'ڕازاوەیی' },

  // Colors
  'أحمر': { en: 'Red', ku: 'سوور' },
  'حمراء': { en: 'Red', ku: 'سوور' },
  'وردي': { en: 'Pink', ku: 'پەمەیی' },
  'وردية': { en: 'Pink', ku: 'پەمەیی' },
  'أبيض': { en: 'White', ku: 'سپی' },
  'بيضاء': { en: 'White', ku: 'سپی' },
  'أصفر': { en: 'Yellow', ku: 'زەرد' },
  'صفراء': { en: 'Yellow', ku: 'زەرد' },
  'أزرق': { en: 'Blue', ku: 'شین' },
  'زرقاء': { en: 'Blue', ku: 'شین' },
  'بنفسجي': { en: 'Purple', ku: 'مۆر' },
  'بنفسجية': { en: 'Purple', ku: 'مۆر' },
  'أسود': { en: 'Black', ku: 'ڕەش' },
  'سوداء': { en: 'Black', ku: 'ڕەش' },
  'ذهبي': { en: 'Golden', ku: 'زێڕین' },
  'ذهبية': { en: 'Golden', ku: 'زێڕین' },
  'فضي': { en: 'Silver', ku: 'زیوی' },
  'فضية': { en: 'Silver', ku: 'زیوی' },
  'برتقالي': { en: 'Orange', ku: 'پرتەقاڵی' },
  'أخضر': { en: 'Green', ku: 'سەوز' },
  'خضراء': { en: 'Green', ku: 'سەوز' },

  // Adjectives
  'فاخر': { en: 'Luxury', ku: 'شایستە' },
  'فاخرة': { en: 'Luxury', ku: 'شایستە' },
  'كلاسيكي': { en: 'Classic', ku: 'کلاسیک' },
  'كلاسيكية': { en: 'Classic', ku: 'کلاسیک' },
  'عصري': { en: 'Modern', ku: 'سەردەمیانە' },
  'عصرية': { en: 'Modern', ku: 'سەردەمیانە' },
  'دائم': { en: 'Everlasting', ku: 'نەپووکاوە' },
  'دائمة': { en: 'Everlasting', ku: 'نەپووکاوە' },
  'طبيعي': { en: 'Natural', ku: 'سروشتی' },
  'طبيعية': { en: 'Natural', ku: 'سروشتی' },
  'صناعي': { en: 'Artificial', ku: 'دەستکرد' },
  'يدوي': { en: 'Handmade', ku: 'دەستکرد' },
  'يدوية': { en: 'Handmade', ku: 'دەستکرد' },
  'جميل': { en: 'Beautiful', ku: 'جوان' },
  'جميلة': { en: 'Beautiful', ku: 'جوان' },
  'رائع': { en: 'Wonderful', ku: 'ناوازە' },
  'رائعة': { en: 'Wonderful', ku: 'ناوازە' },
  'مميز': { en: 'Special', ku: 'تایبەت' },
  'مميزة': { en: 'Special', ku: 'تایبەت' },
  'حصري': { en: 'Exclusive', ku: 'تایبەت' },
  'حصرية': { en: 'Exclusive', ku: 'تایبەت' },
  'جديد': { en: 'New', ku: 'نوێ' },
  'جديدة': { en: 'New', ku: 'نوێ' },
  'كبير': { en: 'Large', ku: 'گەورە' },
  'صغير': { en: 'Small', ku: 'بچووک' },
  'سريع': { en: 'Fast', ku: 'خێرا' },
  'مجاني': { en: 'Free', ku: 'بێبەرامبەر' },
  'مجانية': { en: 'Free', ku: 'بێبەرامبەر' },

  // Floral & Category Terms
  'جوري': { en: 'Damask Rose', ku: 'گوڵەباخ' },
  'الجوري': { en: 'Damask Rose', ku: 'گوڵەباخ' },
  'توليب': { en: 'Tulip', ku: 'لالە' },
  'التوليب': { en: 'Tulip', ku: 'لالە' },
  'أوركيد': { en: 'Orchid', ku: 'ئۆرکید' },
  'الأوركيد': { en: 'Orchid', ku: 'ئۆرکید' },
  'اوركيد': { en: 'Orchid', ku: 'ئۆرکید' },
  'الاوركيد': { en: 'Orchid', ku: 'ئۆرکید' },
  'لافندر': { en: 'Lavender', ku: 'لاڤێندەر' },
  'اللافندر': { en: 'Lavender', ku: 'لاڤێندەر' },
  'بونساي': { en: 'Bonsai', ku: 'بۆنسای' },
  'البونساي': { en: 'Bonsai', ku: 'بۆنسای' },
  'ياسمين': { en: 'Jasmine', ku: 'یاسەمین' },
  'الياسمين': { en: 'Jasmine', ku: 'یاسەمین' },
  'قرنفل': { en: 'Carnation', ku: 'قەرەنفیل' },
  'نبات': { en: 'Plant', ku: 'ڕووەک' },
  'نباتات': { en: 'Plants', ku: 'ڕووەکەکان' },
  'صبار': { en: 'Cactus', ku: 'سەببڕ' },
  'أزهار': { en: 'Flowers', ku: 'گوڵەکان' },
  'الأزهار': { en: 'Flowers', ku: 'گوڵەکان' },
  'باقة': { en: 'Bouquet', ku: 'چەپک' },
  'باقات': { en: 'Bouquets', ku: 'چەپکەکان' },
  'فازة': { en: 'Vase', ku: 'گوڵدان' },
  'فازات': { en: 'Vases', ku: 'گوڵدانەکان' },
  'تصميم': { en: 'Design', ku: 'دیزاین' },
  'تصاميم': { en: 'Designs', ku: 'دیزاینەکان' },
  'تشكيلة': { en: 'Collection', ku: 'کۆمەڵە' },
  'مجموعة': { en: 'Collection', ku: 'کۆمەڵە' },
  'تحف': { en: 'Masterpieces', ku: 'شاکارەکان' },
  'إكسسوار': { en: 'Accessory', ku: 'ئێکسسوار' },
  'إكسسوارات': { en: 'Accessories', ku: 'ئێکسسوارات' },
  'إضاءة': { en: 'Lighting', ku: 'ڕووناکی' },
  'شمعة': { en: 'Candle', ku: 'مۆم' },
  'شموع': { en: 'Candles', ku: 'مۆمەکان' },
  'بطاقة': { en: 'Card', ku: 'کارت' },
  'بطاقات': { en: 'Cards', ku: 'کارتەکان' },
  'تغليف': { en: 'Packaging', ku: 'پێچانەوە' },
  'شريط': { en: 'Ribbon', ku: 'قردێلە' },
  'أصلي': { en: 'Original', ku: 'ئەسڵی' },
  'أصلية': { en: 'Original', ku: 'ئەسڵی' },
  'مضمون': { en: 'Guaranteed', ku: 'دەستەبەرکراو' },
  'مضمونة': { en: 'Guaranteed', ku: 'دەستەبەرکراو' },
};

/**
 * Clean & normalize Arabic text for matching
 */
function normalizeArabic(text: string): string {
  return text
    .trim()
    .replace(/[ـ\u064B-\u065F]/g, '') // remove tatweel & harakat
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();
}

/**
 * Translates an Arabic phrase using dictionary lookup and phrase decomposition
 */
function translateWithInternalDictionary(arabicText: string): { en: string; ku: string } {
  const trimmed = arabicText.trim();
  if (!trimmed) {
    return { en: '', ku: '' };
  }

  // 1. Direct exact match in phrase dictionary
  if (PHRASE_DICTIONARY[trimmed]) {
    return PHRASE_DICTIONARY[trimmed];
  }

  // 2. Normalized match in phrase dictionary
  const normTrimmed = normalizeArabic(trimmed);
  for (const [key, val] of Object.entries(PHRASE_DICTIONARY)) {
    if (normalizeArabic(key) === normTrimmed) {
      return val;
    }
  }

  // 3. Word-by-word intelligent composition for multi-word titles/descriptions
  const words = trimmed.split(/[\s,،\-–]+/).filter(Boolean);
  if (words.length > 0) {
    const enParts: string[] = [];
    const kuParts: string[] = [];

    let hasMatchedAny = false;

    for (const word of words) {
      const normWord = normalizeArabic(word);
      let matched = false;

      // Check word map (exact or without 'ال' / 'و' prefix)
      const candidateKeys = [normWord];
      if (normWord.startsWith('وال') && normWord.length > 4) {
        candidateKeys.push(normWord.slice(3));
      }
      if (normWord.startsWith('ال') && normWord.length > 3) {
        candidateKeys.push(normWord.slice(2));
      }
      if (normWord.startsWith('و') && normWord.length > 2) {
        candidateKeys.push(normWord.slice(1));
      }

      for (const cand of candidateKeys) {
        for (const [key, val] of Object.entries(WORD_MAP)) {
          if (normalizeArabic(key) === cand) {
            enParts.push(val.en);
            kuParts.push(val.ku);
            matched = true;
            hasMatchedAny = true;
            break;
          }
        }
        if (matched) break;

        for (const [key, val] of Object.entries(PHRASE_DICTIONARY)) {
          if (normalizeArabic(key) === cand) {
            enParts.push(val.en);
            kuParts.push(val.ku);
            matched = true;
            hasMatchedAny = true;
            break;
          }
        }
        if (matched) break;
      }

      if (!matched) {
        // Keep as is or transliterate basic names
        enParts.push(word);
        kuParts.push(word);
      }
    }

    if (hasMatchedAny) {
      return {
        en: enParts.join(' '),
        ku: kuParts.join(' '),
      };
    }
  }

  // Fallback default
  return {
    en: trimmed,
    ku: trimmed,
  };
}

/**
 * Fetch online translation from public translation API with fallback
 */
async function fetchOnlineTranslation(arabicText: string, targetLang: 'en' | 'ku'): Promise<string> {
  const trimmed = arabicText.trim();
  if (!trimmed) return '';

  try {
    const pair = targetLang === 'en' ? 'ar|en' : 'ar|ku';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${pair}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const text = data.responseData.translatedText;
        // Avoid returning untranslated or error messages
        if (
          text &&
          !text.includes('QUERY LENGTH LIMIT EXCEEDED') &&
          !text.includes('MYMEMORY WARNING')
        ) {
          // If Kurdish, check if matches has a ckb-IQ version (Central Kurdish Sorani)
          if (targetLang === 'ku' && data.matches && Array.isArray(data.matches)) {
            const ckbMatch = data.matches.find(
              (m: any) =>
                m.target &&
                (m.target.toLowerCase().includes('ckb') || m.target.toLowerCase().includes('iq')) &&
                m.translation
            );
            if (ckbMatch && ckbMatch.translation) {
              return ckbMatch.translation.trim();
            }
          }
          return text.trim();
        }
      }
    }
  } catch {
    // network or timeout, continue to internal dictionary fallback
  }

  return '';
}

/**
 * Main translation function: Translates any Arabic text into both English and Kurdish (Sorani)
 */
export async function translateArabicToEnAndKu(arabicText: string): Promise<{ en: string; ku: string }> {
  const trimmed = arabicText.trim();
  if (!trimmed) {
    return { en: '', ku: '' };
  }

  // Step 1: Check internal rich Kurdish & English dictionary
  const internal = translateWithInternalDictionary(trimmed);

  // If internal dictionary found complete match, return directly
  const isDirectDictMatch =
    Boolean(PHRASE_DICTIONARY[trimmed]) ||
    Object.keys(PHRASE_DICTIONARY).some((k) => normalizeArabic(k) === normalizeArabic(trimmed));

  if (isDirectDictMatch) {
    return internal;
  }

  // Step 2: Try online translation for English if needed
  let enResult = internal.en;
  let kuResult = internal.ku;

  try {
    const onlineEn = await fetchOnlineTranslation(trimmed, 'en');
    if (onlineEn && onlineEn !== trimmed) {
      enResult = onlineEn;
    }
  } catch {}

  // If Kurdish from dictionary was untouched (same as Arabic), try online or refine
  if (kuResult === trimmed) {
    try {
      const onlineKu = await fetchOnlineTranslation(trimmed, 'ku');
      if (onlineKu && onlineKu !== trimmed) {
        kuResult = onlineKu;
      }
    } catch {}
  }

  return {
    en: enResult || trimmed,
    ku: kuResult || trimmed,
  };
}

/**
 * Synchronous instant translator for real-time keystroke suggestions & fallback
 */
export function instantTranslateArabic(arabicText: string): { en: string; ku: string } {
  return translateWithInternalDictionary(arabicText);
}
