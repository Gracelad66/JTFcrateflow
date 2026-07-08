
-- Allow anonymous users to browse products (public catalog)
CREATE POLICY "products_select_anon" ON products
  FOR SELECT TO anon USING (active = true);
