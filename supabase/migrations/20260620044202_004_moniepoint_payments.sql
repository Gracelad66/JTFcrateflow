-- Add payment reference + awaiting_payment state to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Allow 'awaiting_payment' status for orders pending Moniepoint confirmation
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'awaiting_payment', 'fulfilled', 'paid', 'cancelled'));

-- Moniepoint payment records (one per checkout attempt)
CREATE TABLE moniepoint_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'success', 'failed', 'cancelled')),
  moniepoint_reference text,
  customer_name text,
  customer_email text,
  customer_phone text,
  provider_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_moniepoint_payments_order_id ON moniepoint_payments(order_id);
CREATE INDEX idx_moniepoint_payments_reference ON moniepoint_payments(reference);
CREATE INDEX idx_moniepoint_payments_status ON moniepoint_payments(status);

ALTER TABLE moniepoint_payments ENABLE ROW LEVEL SECURITY;

-- Customers can see payments for their own orders; admins see all
CREATE POLICY "moniepoint_payments_select_own"
  ON moniepoint_payments FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = moniepoint_payments.order_id
      AND (orders.customer_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Only service role (edge functions) inserts/updates payments
CREATE POLICY "moniepoint_payments_insert_service"
  ON moniepoint_payments FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "moniepoint_payments_update_service"
  ON moniepoint_payments FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "moniepoint_payments_delete_admin"
  ON moniepoint_payments FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );