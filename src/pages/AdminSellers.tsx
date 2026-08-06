import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Company } from '../hooks/useCompanies';
import { useProducts } from '../hooks/useProducts';
import {
  Store,
  Users,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function AdminSellers() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { products } = useProducts({ includeInactive: true });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const toggleActive = async (company: Company) => {
    setTogglingId(company.id);
    await supabase
      .from('companies')
      .update({ active: !company.active, updated_at: new Date().toISOString() })
      .eq('id', company.id);
    setTogglingId(null);
    fetchCompanies();
  };

  const productCount = (companyId: string) =>
    products.filter((p) => p.company_id === companyId).length;

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = companies.filter((c) => c.active).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Sellers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all seller companies on the platform.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span>{companies.length} total · {activeCount} active</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sellers..."
          className="input pl-10"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
        </div>
      )}

      {error && <div className="card p-6 text-center text-danger-600 text-sm">Failed to load sellers.</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-900">No sellers found</h3>
          <p className="text-sm text-slate-500 mt-1">Sellers will appear here when they register.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((company) => (
            <div key={company.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-gradient-to-br from-brand-100 to-brand-200 rounded-xl flex items-center justify-center shrink-0">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Store className="w-5 h-5 text-brand-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{company.name}</h3>
                    {company.active ? (
                      <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="badge-danger"><XCircle className="w-3 h-3" /> Suspended</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" /> {productCount(company.id)} products
                    </span>
                    <span>/{company.slug}</span>
                    <span>{new Date(company.created_at || '').toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleActive(company)}
                disabled={togglingId === company.id}
                className="flex items-center gap-2 text-sm shrink-0"
              >
                {togglingId === company.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : company.active ? (
                  <>
                    <ToggleRight className="w-8 h-8 text-success-500" />
                    <span className="text-success-600 font-medium hidden sm:inline">Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                    <span className="text-slate-400 font-medium hidden sm:inline">Suspended</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
