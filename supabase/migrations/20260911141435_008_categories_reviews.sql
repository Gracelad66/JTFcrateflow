/*
# Add Categories and Reviews

## Purpose
Adds product categories for filtering and a reviews/ratings system for products.
This enables category-based browsing and social proof (star ratings + comments).

## New Tables
1. `categories` — Product categories (e.g. Soft Drinks, Juices, Water, Energy, Malt)
   - `id` (uuid, PK)
   - `name` (text, unique, not null)
   - `slug` (text, unique, not null)
   - `description` (text, nullable)
   - `icon` (text, nullable — lucide icon name for UI)
   - `created_at` (timestamptz, default now())

2. `reviews` — Product reviews with 1-5 star ratings
   - `id` (uuid, PK)
   - `product_id` (uuid, FK to products, not null)
   - `user_id` (uuid, FK to profiles, not null, default auth.uid())
   - `rating` (int, 1-5, not null)
   - `comment` (text, nullable)
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())
   - Unique constraint on (product_id, user_id) — one review per user per product

## Modified Tables
- `products` gets `category_id` (uuid, nullable, FK to categories)
  Nullable so existing products aren't forced into a category immediately.

## Security
- `categories`: Public read (anon + authenticated), admin write only
- `reviews`: Public read (anyone can see reviews), authenticated users can insert/update/delete their own reviews

## Seed Data
- 6 categories: Soft Drinks, Juices, Water, Energy Drinks, Malt Drinks, Others
- Existing products assigned to "Soft Drinks" category
*/

-- ─── Categories table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ─── Add category_id to products ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Reviews table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_reviews" ON reviews;
CREATE POLICY "anon_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON reviews;
CREATE POLICY "insert_own_review" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_review" ON reviews;
CREATE POLICY "update_own_review" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_review" ON reviews;
CREATE POLICY "delete_own_review" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── Index for faster review queries ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- ─── Seed categories ───────────────────────────────────────────
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Soft Drinks', 'soft-drinks', 'Carbonated soft drinks and sodas', 'CupSoda'),
  ('Juices', 'juices', 'Fruit juices and nectars', 'GlassWater'),
  ('Water', 'water', 'Bottled and mineral water', 'Droplets'),
  ('Energy Drinks', 'energy-drinks', 'Energy and sports drinks', 'Zap'),
  ('Malt Drinks', 'malt-drinks', 'Malt beverages and non-alcoholic malt', 'Beer'),
  ('Others', 'others', 'Other beverages', 'Package')
ON CONFLICT (name) DO NOTHING;

-- ─── Assign existing products to Soft Drinks category ──────────
DO $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT id INTO cat_id FROM categories WHERE slug = 'soft-drinks';
  IF cat_id IS NOT NULL THEN
    UPDATE products SET category_id = cat_id WHERE category_id IS NULL;
  END IF;
END $$;
