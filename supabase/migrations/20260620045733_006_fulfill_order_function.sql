-- Atomic order fulfillment: deduct filled stock, credit empty crates returned.
CREATE OR REPLACE FUNCTION public.fulfill_order(p_order_id uuid)
RETURNS void AS $$
DECLARE
  item RECORD;
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

  -- Credit empty crates returned
  UPDATE public.products p
    SET empty_stock = empty_stock + (
      SELECT empty_crates_returned FROM public.orders WHERE id = p_order_id
    )
    WHERE id = (
      SELECT oi.product_id FROM public.order_items oi WHERE oi.order_id = p_order_id LIMIT 1
    );

  -- Credit empty crates to the first product in the order (simplified model)
  UPDATE public.products
    SET empty_stock = empty_stock + COALESCE(
      (SELECT empty_crates_returned FROM public.orders WHERE id = p_order_id), 0
    ) * 0  -- placeholder no-op to avoid double-count; counted in the block above
    WHERE false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;