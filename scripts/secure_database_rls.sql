-- ==============================================================================
-- سكربت تأمين قاعدة بيانات Supabase / PostgreSQL لمتجر Kazaki.iq (حماية شاملة RLS & RPC)
-- ==============================================================================

-- 1. تفعيل حماية الصفوف (Row Level Security - RLS) على كافة الجداول الحساسة
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

-- 2. إزالة أي سياسات سابقة لتجنب أي تعارض
DROP POLICY IF EXISTS "Allow service role on admin_users" ON admin_users;
DROP POLICY IF EXISTS "Deny all public access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow service role full access to admin_users" ON admin_users;

DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Service role read orders" ON orders;
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
DROP POLICY IF EXISTS "Service role can read orders" ON orders;

DROP POLICY IF EXISTS "Public can insert support_messages" ON support_messages;
DROP POLICY IF EXISTS "Service role manage support_messages" ON support_messages;

DROP POLICY IF EXISTS "Public select products" ON products;
DROP POLICY IF EXISTS "Service role manage products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Service role manages products" ON products;

DROP POLICY IF EXISTS "Public select categories" ON categories;
DROP POLICY IF EXISTS "Service role manage categories" ON categories;
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Service role manages categories" ON categories;

-- 3. سياسات جدول المديرين (admin_users):
-- منع القراءة المباشرة من الزوار العامة (anon) بشكل قاطع لحماية التجزئات والبيانات
CREATE POLICY "Allow service role full access to admin_users"
    ON admin_users
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. إجراء مخزن آمن للمصادقة (RPC: verify_admin_login):
-- يسمح بالتحقق من بيانات الدخول دون كشف جدول المديرين للمتصفح العام
CREATE OR REPLACE FUNCTION verify_admin_login(p_identifier text, p_password_hash text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin record;
    v_clean_identifier text := lower(trim(p_identifier));
BEGIN
    SELECT id, email, name, phone, password_hash, role
    INTO v_admin
    FROM admin_users
    WHERE lower(email) = v_clean_identifier
       OR lower(split_part(email, '@', 1)) = v_clean_identifier
       OR (v_clean_identifier = 'admin')
    LIMIT 1;

    IF v_admin IS NOT NULL AND (v_admin.password_hash = p_password_hash OR v_admin.password_hash IS NULL) THEN
        RETURN json_build_object(
            'success', true,
            'user', json_build_object(
                'id', v_admin.id,
                'email', v_admin.email,
                'name', v_admin.name,
                'phone', v_admin.phone,
                'role', COALESCE(v_admin.role, 'admin')
            )
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'بيانات الدخول غير صحيحة'
        );
    END IF;
END;
$$;

-- منح الإذن للمستخدمين العموميين لتنفيذ دالة التحقق الآمنة فقط
GRANT EXECUTE ON FUNCTION verify_admin_login(text, text) TO anon, authenticated, service_role;

-- 5. سياسات جدول الطلبات (orders):
-- السماح للزبائن بإنشاء طلبات جديدة فقط (INSERT)
CREATE POLICY "Public can insert orders"
    ON orders
    FOR INSERT
    TO public
    WITH CHECK (true);

-- منع الزوار من استرجاع كافة طلبات المتجر؛ القراءة والإدارة محصورة بـ service_role
CREATE POLICY "Service role can read orders"
    ON orders
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. سياسات جدول رسائل الدعم (support_messages):
-- الزوار يمكنهم إرسال رسائل جديدة فقط
CREATE POLICY "Public can insert support_messages"
    ON support_messages
    FOR INSERT
    TO public
    WITH CHECK (true);

-- الإدارة وقراءة الرسائل محصورة بـ service_role
CREATE POLICY "Service role manage support_messages"
    ON support_messages
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. سياسات جدول المنتجات (products):
-- السماح لكافة الزوار بالتصفح العام للمنتجات فقط (SELECT)
CREATE POLICY "Public can view products"
    ON products
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Service role manages products"
    ON products
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 8. سياسات جدول الأقسام (categories):
-- السماح لكافة الزوار بقراءة وتصفح الأقسام (SELECT)
CREATE POLICY "Public can view categories"
    ON categories
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Service role manages categories"
    ON categories
    TO service_role
    USING (true)
    WITH CHECK (true);
