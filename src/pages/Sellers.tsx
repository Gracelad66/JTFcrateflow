import { useCompanies } from '../hooks/useCompanies';
import { useProducts } from '../hooks/useProducts';
import { Link } from 'react-router-dom';
import { Store, Package, ChevronRight, Loader2, Search } from 'lucide-react';
import { useState } from 'react';

export default function Sellers() {
  const { companies, loading, error } = useCompanies();
  const { products } = useProducts();
  const [search, setSearch] = useState('');

  const productCount = (companyId: string) =>
    products.filter((p) => p.company_id === companyId && p.active).length;

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display">Sellers</h1>
        <p className="text-sm text-slate-500 mt-1">Browse all sellers on CrateFlow NG.</p>
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
          <p className="text-sm text-slate-500 mt-1">{search ? 'Try a different search' : 'Sellers will appear here once they join.'}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <Link
              key={company.id}
              to={`/sellers/${company.slug}`}
              className="card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-xl flex items-center justify-center shrink-0">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Store className="w-6 h-6 text-brand-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">{company.name}</h3>
                  {company.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{company.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                    <Package className="w-3.5 h-3.5" />
                    <span>{productCount(company.id)} products</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
