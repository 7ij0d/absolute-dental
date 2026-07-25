-- =============================================================================
-- SMYLODENT MASTER SQL SCHEMA
-- Dental Students Store — University of Tripoli, Libya
-- Run this FIRST in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. YEARS
CREATE TABLE IF NOT EXISTS public.years (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_ar     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  image_url   TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year_id         UUID REFERENCES public.years(id) ON DELETE CASCADE,
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description_ar  TEXT,
  description_en  TEXT,
  image_url       TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_id                  UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  year_id                     UUID REFERENCES public.years(id) ON DELETE SET NULL,
  name_ar                     TEXT NOT NULL,
  name_en                     TEXT NOT NULL,
  description_ar              TEXT,
  description_en              TEXT,
  details_ar                  TEXT,
  details_en                  TEXT,
  price                       NUMERIC(10,2) NOT NULL DEFAULT 0,
  compare_at_price            NUMERIC(10,2),
  discount_label_ar           TEXT,
  discount_label_en           TEXT,
  discount_ends_at            TIMESTAMPTZ,
  stock_quantity              INTEGER DEFAULT 0,
  availability                TEXT DEFAULT 'available'
                              CHECK (availability IN ('available','limited_quantity','unavailable','coming_soon')),
  image_url                   TEXT,
  usage_video_url             TEXT,
  usage_instruction_image_url TEXT,
  audio_url                   TEXT,
  is_featured                 BOOLEAN DEFAULT FALSE,
  is_archived                 BOOLEAN DEFAULT FALSE,
  is_active                   BOOLEAN DEFAULT TRUE,
  sort_order                  INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCT IMAGES (gallery)
CREATE TABLE IF NOT EXISTS public.product_images (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name        TEXT,
  phone            TEXT,
  phone_alt        TEXT,
  email            TEXT,
  address_text     TEXT,
  latitude         NUMERIC(10,7),
  longitude        NUMERIC(10,7),
  academic_year    TEXT,
  university       TEXT DEFAULT 'University of Tripoli',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tracking_code    TEXT NOT NULL UNIQUE,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_phone2  TEXT,
  customer_email   TEXT,
  address_text     TEXT,
  latitude         NUMERIC(10,7),
  longitude        NUMERIC(10,7),
  delivery_notes   TEXT,
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method   TEXT DEFAULT 'cash_on_delivery',
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  status_note      TEXT,
  is_guest         BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BANNERS / HERO SLIDES
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_ar    TEXT,
  title_en    TEXT,
  subtitle_ar TEXT,
  subtitle_en TEXT,
  image_url   TEXT,
  link_url    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text_ar     TEXT NOT NULL,
  text_en     TEXT,
  link_url    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PAGES CONTENT
CREATE TABLE IF NOT EXISTS public.pages_content (
  key         TEXT PRIMARY KEY,
  title_ar    TEXT,
  title_en    TEXT,
  content_ar  TEXT,
  content_en  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  subject     TEXT,
  body        TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 13. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name        TEXT,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_subjects_year_id    ON public.subjects(year_id);
CREATE INDEX IF NOT EXISTS idx_products_subject_id ON public.products(subject_id);
CREATE INDEX IF NOT EXISTS idx_products_year_id    ON public.products(year_id);
CREATE INDEX IF NOT EXISTS idx_products_active     ON public.products(is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_tracking     ON public.orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_id      ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_images      ON public.product_images(product_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE public.years             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages_content     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_years"    ON public.years    FOR SELECT USING (true);
CREATE POLICY "public_read_subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "public_read_products" ON public.products FOR SELECT USING (is_active = true AND is_archived = false);
CREATE POLICY "public_read_product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "public_read_banners"  ON public.banners  FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "public_read_pages"    ON public.pages_content FOR SELECT USING (true);
CREATE POLICY "public_read_reviews"  ON public.reviews  FOR SELECT USING (is_approved = true);
CREATE POLICY "public_read_orders"   ON public.orders   FOR SELECT USING (true);
CREATE POLICY "anyone_insert_order"  ON public.orders   FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_order_history" ON public.order_status_history FOR SELECT USING (true);
CREATE POLICY "read_own_profile"     ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own_profile"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "anyone_insert_message" ON public.messages FOR INSERT WITH CHECK (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Schema OK — now run 02_seed_data.sql' AS status;
