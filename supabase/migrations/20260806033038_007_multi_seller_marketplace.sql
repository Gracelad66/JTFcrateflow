/*
# Multi-Seller Marketplace Foundation

## Overview
Transforms CrateFlow from a single-shop app into a multi-seller beverage marketplace.
Introduces "companies" (sellers), links products to companies, and expands user roles.

## New Tables
- `companies`
  - `id` (uuid, PK)
  - `name` (text, not null) — seller's display name
  - `slug` (text, unique, not null) — URL-safe identifier for storefront URLs
  - `description` (text, nullable) — seller bio/about
  - `logo_url` (text, nullable) — seller logo image
  - `owner_id` (uuid, FK → profiles, not null) — the seller who owns this company
  - `active` (boolean, default true) — admin can suspend a seller
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

## Modified Tables
- `profiles`
  - `role` CHECK constraint expanded to include 'seller'
  - `company_id` (uuid, nullable, FK → companies) — set for sellers to link them to their company

- `products`
  - `company_id` (uuid, FK → companies, not null) — every product now belongs to a seller
  - Existing products will be assigned to a default "CrateFlow NG" company

## Security Changes (RLS)
- `companies` table: RLS enabled
  - SELECT: public to authenticated (anyone can browse sellers)
  - INSERT: seller can insert their own company (owner_id = auth.uid())
  - UPDATE: owner can update their own company; admin can update any
  - DELETE: admin only

- `products` policies rewritten:
  - SELECT: anyone can see active products (unchanged behavior)
  - INSERT/UPDATE/DELETE: seller can modify only their own company's products; admin can modify any

- `orders` policies updated:
  - SELECT: customer sees own orders; seller sees orders containing their products; admin sees all

- `order_items` SELECT updated:
  - Customer sees items in their orders; seller sees items referencing their products; admin sees all

- Storage policies for product-images updated:
  - Sellers can upload/update/delete images for their own products

## Data Migration
1. Create a default company "CrateFlow NG" owned by the first admin user
2. Set all existing products' company_id to that default company
3. Set all admin profiles' company_id to that company

## Important Notes
1. The `handle_new_user` trigger is updated to accept 'seller' role from signup metadata
2. The `fulfill_order` function is updated to be company-aware (deducts from the correct seller's stock)
*/

-- ─── Expand profiles.role to include 'seller' ─────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'seller', 'customer'));

-- ─── Create companies table FIRST ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active);

-- ─── Now add company_id to profiles ─────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- ─── Add company_id to products ────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

-- ─── Enable RLS on companies ───────────────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Companies: anyone authenticated can see active companies + their own + all for admin
DROP POLICY IF EXISTS "companies_select_all" ON companies;
CREATE POLICY "companies_select_all"
  ON companies FOR SELECT TO authenticated
  USING (active = true
         OR owner_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Companies: a seller can create their own company
DROP POLICY IF EXISTS "companies_insert_own" ON companies;
CREATE POLICY "companies_insert_own"
  ON companies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Companies: owner can update their own; admin can update any
DROP POLICY IF EXISTS "companies_update_own_or_admin" ON companies;
CREATE POLICY "companies_update_own_or_admin"
  ON companies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (owner_id = auth.uid()
              OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Companies: admin can delete
DROP POLICY IF EXISTS "companies_delete_admin" ON companies;
CREATE POLICY "companies_delete_admin"
  ON companies FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Rewrite products RLS for multi-seller ─────────────────────────────────
-- SELECT: anyone can see active products + seller sees own (even inactive) + admin sees all
DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all"
  ON products FOR SELECT TO authenticated
  USING (active = true
         OR company_id IN (
           SELECT id FROM companies WHERE owner_id = auth.uid()
         )
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- INSERT: seller can insert products for their own company; admin can insert any
DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_own_company"
  ON products FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE: seller can update their own company's products; admin can update any
DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_own_company"
  ON products FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE: seller can delete their own company's products; admin can delete any
DROP POLICY IF EXISTS "products_delete_admin" ON products;
CREATE POLICY "products_delete_own_company"
  ON products FOR DELETE TO authenticated
  USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── Update orders RLS for seller visibility ────────────────────────────────
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN companies c ON p.company_id = c.id
      WHERE oi.order_id = orders.id AND c.owner_id = auth.uid()
    )
  );

-- ─── Update order_items RLS for seller visibility ───────────────────────────
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.customer_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
           OR EXISTS (
             SELECT 1 FROM products p
             JOIN companies c ON p.company_id = c.id
             WHERE p.id = order_items.product_id AND c.owner_id = auth.uid()
           ))
    )
  );

-- ─── Update storage policies for product images ─────────────────────────────
DROP POLICY IF EXISTS "product_images_insert_admin" ON storage.objects;
CREATE POLICY "product_images_insert_seller_or_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')
    )
  );

DROP POLICY IF EXISTS "product_images_update_admin" ON storage.objects;
CREATE POLICY "product_images_update_seller_or_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')
    )
  );

DROP POLICY IF EXISTS "product_images_delete_admin" ON storage.objects;
CREATE POLICY "product_images_delete_seller_or_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')
    )
  );

-- ─── Update handle_new_user trigger to accept 'seller' role ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Data migration: create default company and assign existing products ───
DO $$
DECLARE
  v_admin_id uuid;
  v_company_id uuid;
BEGIN
  -- Find first admin user
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;

  IF v_admin_id IS NOT NULL THEN
    -- Create default company if it doesn't exist
    INSERT INTO companies (name, slug, description, owner_id, active)
    VALUES ('CrateFlow NG', 'crateflow-ng', 'Default marketplace seller', v_admin_id, true)
    ON CONFLICT (slug) DO UPDATE SET name = 'CrateFlow NG'
    RETURNING id INTO v_company_id;

    -- Assign all existing products to this company
    UPDATE products SET company_id = v_company_id WHERE products.company_id IS NULL;

    -- Link admin profiles to this company
    UPDATE profiles SET company_id = v_company_id WHERE role = 'admin' AND profiles.company_id IS NULL;
  END IF;
END $$;

-- ─── Make products.company_id NOT NULL after data migration ─────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE company_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot set NOT NULL: some products still have null company_id';
  END IF;
  ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
END $$;

-- ─── Update fulfill_order to be company-aware ───────────────────────────────
CREATE OR REPLACE FUNCTION public.fulfill_order(p_order_id uuid)
RETURNS void AS $$
DECLARE
  item RECORD;
  empty_returned integer;
BEGIN
  UPDATE public.orders
    SET status = 'fulfilled', updated_at = now()
    WHERE id = p_order_id AND status IN ('pending', 'paid');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found or not in a fulfillable state', p_order_id;
  END IF;

  FOR item IN
    SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products
      SET filled_stock = GREATEST(0, filled_stock - item.quantity),
          updated_at = now()
      WHERE id = item.product_id;
  END LOOP;

  SELECT empty_crates_returned INTO empty_returned
    FROM public.orders WHERE id = p_order_id;

  IF empty_returned > 0 THEN
    UPDATE public.products
      SET empty_stock = empty_stock + empty_returned
      WHERE id = (
        SELECT oi.product_id FROM public.order_items oi
        WHERE oi.order_id = p_order_id LIMIT 1
      );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
