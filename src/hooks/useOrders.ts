import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];

export interface OrderWithItems extends Order {
  items: (OrderItem & { product: { name: string; image_url: string | null } })[];
  customer: { full_name: string | null; email: string; phone: string | null } | null;
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('orders')
      .select(`
        *,
        customer:profiles(full_name, email, phone),
        items:order_items(
          *,
          product:products(name, image_url)
        )
      `)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setOrders((data as unknown as OrderWithItems[]) || []);
    }
    setLoading(false);
  }, []);

  const createOrder = async (
    items: { product_id: string; quantity: number; unit_price: number }[],
    paymentMethod: 'cash_on_delivery' | 'online',
    emptyCratesReturned: number,
    deliveryLocation?: string,
    deliveryNotes?: string
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: new Error('Not authenticated') };

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: userData.user.id,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        empty_crates_returned: emptyCratesReturned,
        delivery_location: deliveryLocation || null,
        delivery_notes: deliveryNotes || null,
      })
      .select()
      .single();

    if (orderErr) return { error: orderErr };

    const orderItems = items.map((item) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) return { error: itemsErr };

    // Update stock levels: reduce filled stock per item, increase empty stock once
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('filled_stock, empty_stock')
        .eq('id', item.product_id)
        .single();
      if (product) {
        await supabase
          .from('products')
          .update({
            filled_stock: product.filled_stock - item.quantity,
          })
          .eq('id', item.product_id);
      }
    }
    // Add empty crates returned to total empty stock (applied to the first product for simplicity)
    if (emptyCratesReturned > 0 && items.length > 0) {
      const { data: product } = await supabase
        .from('products')
        .select('empty_stock')
        .eq('id', items[0].product_id)
        .single();
      if (product) {
        await supabase
          .from('products')
          .update({
            empty_stock: product.empty_stock + emptyCratesReturned,
          })
          .eq('id', items[0].product_id);
      }
    }

    return { data: orderData, error: null };
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const { data, error: err } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (err) return { error: err };
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
    return { data, error: null };
  };

  const fulfillOrder = async (id: string) => {
    const { error: rpcErr } = await supabase.rpc('fulfill_order', { p_order_id: id });
    if (rpcErr) return { error: rpcErr };
    const { data, error: err } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (err) return { error: err };
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
    return { data, error: null };
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refresh: fetchOrders, createOrder, updateOrderStatus, fulfillOrder };
}
