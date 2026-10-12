import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCompanies } from '../hooks/useCompanies';
import { useAuth } from '../hooks/useAuth';
import { LANDING_PAGE, TRUST_BADGES } from '../config/content';
import {
  ChevronRight,
  Package,
  Store,
  ArrowRight,
  Star,
  Truck,
  CreditCard,
  Repeat,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

const HERO_IMAGE = 'https://images.pexels.com/photos/7414290/pexels-photo-7414290.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const SELLER_IMAGE = 'https://images.pexels.com/photos/37299597/pexels-photo-37299597.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products } = useProducts();
  const { companies } = useCompanies();

  const featuredProducts = products.filter((p) => p.filled_stock > 0).slice(0, 4);
  const featuredSellers = companies.slice(0, 3);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white shadow-glow">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-accent-300/20 rounded-full blur-2xl" />
        <div className="relative px-6 py-12 md:px-12 md:py-20 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 bg-success-300 rounded-full animate-pulse" />
            Nigeria's wholesale drinks marketplace
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-balance">
            {LANDING_PAGE.heroHeadline}
          </h1>
          <p className="mt-4 text-brand-100 text-sm md:text-lg leading-relaxed max-w-xl">
            {LANDING_PAGE.heroSubheadline}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {LANDING_PAGE.heroCtaBrowse}
              <ChevronRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all"
              >
                {LANDING_PAGE.heroCtaRegister}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="relative px-6 pb-8 md:px-12 md:pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LANDING_PAGE.stats.map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="font-display text-2xl md:text-3xl font-extrabold">{stat.value}</div>
                <div className="text-xs text-brand-200 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRUST_BADGES.map((badge) => (
          <div key={badge.title} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${badge.colorClass}`}>
              <badge.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{badge.title}</p>
              <p className="text-xs text-slate-500">{badge.subtitle}</p>
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section>
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">How it works</h2>
          <p className="text-sm text-slate-500 mt-1">Order premium drinks in four simple steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LANDING_PAGE.howItWorks.map((step, i) => (
            <div key={step.title} className="card p-5 relative">
              <div className="absolute top-4 right-4 text-4xl font-display font-extrabold text-slate-100 select-none">
                {i + 1}
              </div>
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-3">
                <step.icon className="w-6 h-6" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{step.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Featured drinks</h2>
              <p className="text-sm text-slate-500 mt-1">Top picks from our sellers</p>
            </div>
            <Link to="/catalog" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="card overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  {product.filled_stock > 0 && (
                    <span className="absolute top-2 right-2 badge-success">In stock</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-slate-900 text-xs line-clamp-1">{product.name}</h3>
                  {product.company && (
                    <p className="text-[11px] text-brand-600 mt-0.5">{product.company.name}</p>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-base font-bold text-slate-900 font-display">
                      ₦{product.retail_price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">/crate</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Seller CTA banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-glow">
        <div className="absolute inset-0 opacity-20">
          <img src={SELLER_IMAGE} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40" />
        <div className="relative px-6 py-10 md:px-12 md:py-14 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-medium mb-4">
            <Store className="w-3.5 h-3.5" /> For sellers
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold leading-tight">
            {LANDING_PAGE.sellerCtaHeadline}
          </h2>
          <p className="mt-3 text-slate-300 text-sm md:text-base leading-relaxed">
            {LANDING_PAGE.sellerCtaBody}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            {LANDING_PAGE.sellerCtaButton}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Featured sellers */}
      {featuredSellers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Top sellers</h2>
              <p className="text-sm text-slate-500 mt-1">Trusted sellers on CrateFlow NG</p>
            </div>
            <Link to="/sellers" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              All sellers <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredSellers.map((seller) => (
              <Link
                key={seller.id}
                to={`/sellers/${seller.slug}`}
                className="card p-5 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                  {seller.logo_url ? (
                    <img src={seller.logo_url} alt={seller.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-brand-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{seller.name}</h3>
                  {seller.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{seller.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features grid */}
      <section>
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">Why CrateFlow NG</h2>
          <p className="text-sm text-slate-500 mt-1">Everything you need for wholesale drinks ordering</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LANDING_PAGE.features.map((feature) => (
            <div key={feature.title} className="card p-5 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center shrink-0">
                <feature.icon className="w-6 h-6" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{feature.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white shadow-glow">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative px-6 py-12 md:px-12 md:py-16 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-4xl font-extrabold leading-tight">
            Ready to order premium drinks at wholesale prices?
          </h2>
          <p className="mt-3 text-brand-100 text-sm md:text-base">
            Join CrateFlow NG today and start ordering from verified sellers across Nigeria.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Browse Catalog
              <ChevronRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all"
              >
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
