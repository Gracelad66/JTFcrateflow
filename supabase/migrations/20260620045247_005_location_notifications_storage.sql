-- Capture delivery location on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_location text,
  ADD COLUMN IF NOT EXISTS delivery_notes text;

-- Notifications: auto-messages to buyers (e.g. new stock arrived)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'stock_arrival', 'order_update')),
  related_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_service"
  ON notifications FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Track which products each customer has ordered (for stock-arrival notifications)
CREATE TABLE IF NOT EXISTS customer_product_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  last_ordered_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_product_interest_product ON customer_product_interest(product_id);

ALTER TABLE customer_product_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interest_select_own"
  ON customer_product_interest FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "interest_insert_own"
  ON customer_product_interest FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "interest_delete_own"
  ON customer_product_interest FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Trigger: when an order's items are inserted, record customer interest.
CREATE OR REPLACE FUNCTION public.record_customer_interest()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_product_interest (user_id, product_id, last_ordered_at)
  SELECT o.customer_id, NEW.product_id, now()
  FROM public.orders o WHERE o.id = NEW.order_id
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET last_ordered_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_item_insert ON order_items;
CREATE TRIGGER on_order_item_insert
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION public.record_customer_interest();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: admins upload, anyone can view (public products)
CREATE POLICY "product_images_read_all"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "product_images_update_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "product_images_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );