
-- Allow both authenticated and anonymous users to browse products
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_select_anon" ON products;
CREATE POLICY "products_select_all" ON products
  FOR SELECT TO authenticated, anon USING (true);
