import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

export type Product = Database['public']['Tables']['products']['Row'];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, []);

  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error: err } = await supabase.from('products').insert(product).select().single();
    if (err) return { error: err };
    setProducts((prev) => [...prev, data]);
    return { data, error: null };
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { data, error: err } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (err) return { error: err };
    setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
    return { data, error: null };
  };

  const deleteProduct = async (id: string) => {
    const { error: err } = await supabase.from('products').delete().eq('id', id);
    if (err) return { error: err };
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return { error: null };
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refresh: fetchProducts, createProduct, updateProduct, deleteProduct };
}
