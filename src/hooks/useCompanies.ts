import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

export type Company = Database['public']['Tables']['companies']['Row'];

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  }, []);

  const fetchCompanyBySlug = useCallback(async (slug: string) => {
    const { data, error: err } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();
    if (err) return { company: null, error: err };
    return { company: data, error: null };
  }, []);

  const fetchCompanyById = useCallback(async (id: string) => {
    const { data, error: err } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (err) return { company: null, error: err };
    return { company: data, error: null };
  }, []);

  const createCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error: err } = await supabase.from('companies').insert(company).select().single();
    return { data, error: err };
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    const { data, error: err } = await supabase.from('companies').update(updates).eq('id', id).select().single();
    return { data, error: err };
  };

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    loading,
    error,
    refresh: fetchCompanies,
    fetchCompanyBySlug,
    fetchCompanyById,
    createCompany,
    updateCompany,
  };
}
