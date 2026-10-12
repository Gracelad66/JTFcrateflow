import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

export type Review = Database['public']['Tables']['reviews']['Row'];

export interface ReviewWithUser extends Review {
  user: { id: string; full_name: string | null } | null;
}

export function useReviews(productId: string | null) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('reviews')
      .select('*, user:profiles!reviews_user_id_fkey(id, full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setReviews((data as unknown as ReviewWithUser[]) || []);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (rating: number, comment: string) => {
    if (!productId) return { error: { message: 'No product ID' } };
    const { data, error: err } = await supabase
      .from('reviews')
      .insert({ product_id: productId, rating, comment: comment || null })
      .select('*, user:profiles!reviews_user_id_fkey(id, full_name)')
      .single();
    if (err) return { error: err };
    setReviews((prev) => [data as unknown as ReviewWithUser(), ...prev]);
    return { data, error: null };
  };

  const updateReview = async (reviewId: string, rating: number, comment: string) => {
    const { data, error: err } = await supabase
      .from('reviews')
      .update({ rating, comment: comment || null, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select('*, user:profiles!reviews_user_id_fkey(id, full_name)')
      .single();
    if (err) return { error: err };
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? (data as unknown as ReviewWithUser()) : r)));
    return { data, error: null };
  };

  const deleteReview = async (reviewId: string) => {
    const { error: err } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (err) return { error: err };
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    return { error: null };
  };

  return { reviews, loading, error, refresh: fetchReviews, addReview, updateReview, deleteReview };
}
