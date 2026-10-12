import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts, type ProductWithCompany } from '../hooks/useProducts';
import { useCompanies } from '../hooks/useCompanies';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Package,
  ChevronRight,
  Store,
  Star,
} from 'lucide-react';
import { CATALOG_HERO, TRUST_BADGES } from '../config/content';

interface CartItem {
  product: ProductWithCompany;
  quantity: number;
}

export default function Catalog() {
  const { products, loading, error } = useProducts();
  const { companies } = useCompanies();
  const { categories } = useCategories();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const sellerOptions = useMemo(() => {
    const ids = new Set(products.map((p) => p.company_id));
    return companies.filter((c) => ids.has(c.id));
  }, [products, companies]);

  const updateCart = (items: CartItem[]) => {
    setCart(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const addToCart = (product: ProductWithCompany) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      updateCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.filled_stock) }
            : item
        )
      );
    } else {
      updateCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    updateCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    updateCart(
      cart
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: Math.min(newQty, item.product.filled_stock) };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const getPrice = (product: ProductWithCompany, qty: number) => {
    return qty >= product.wholesale_threshold ? product.wholesale_price : product.retail_price;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * getPrice(item.product, item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (sellerFilter === 'all' || p.company_id === sellerFilter) &&
      (categoryFilter === 'all' || p.category_id === categoryFilter)
    );
    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.retail_price - b.retail_price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.retail_price - a.retail_price);
    } else if (sortBy === 'stock') {
      result = [...result].sort((a, b) => b.filled_stock - a.filled_stock);
    }
    return result;
  }, [products, search, sellerFilter, categoryFilter, sortBy]);

  const inStock = products.filter((p) => p.filled_stock > 0).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white shadow-glow">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-10 bottom-0 w-40 h-40 bg-accent-300/20 rounded-full blur-2xl" />
        <div className="relative px-6 py-10 md:px-10 md:py-14 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-success-300 rounded-full animate-pulse" />
            {inStock} drinks available now
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-balance">
            {CATALOG_HERO.headline}
          </h1>
          <p className="mt-3 text-brand-100 text-sm md:text-base leading-relaxed max-w-lg">
            {CATALOG_HERO.subheadline}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {CATALOG_HERO.ctaBrowse}
              <ChevronRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all"
              >
                {CATALOG_HERO.ctaRegister}
              </button>
            )}
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

      {/* Search + Filters */}
      <div className="space-y-3" id="catalog-grid">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drinks by name..."
              className="input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input max-w-[160px] cursor-pointer"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="input max-w-[160px] cursor-pointer"
          >
            <option value="all">All sellers</option>
            {sellerOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input max-w-[160px] cursor-pointer"
          >
            <option value="name">Sort: Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="stock">Most Stock</option>
          </select>
          {user && cartCount > 0 && (
            <button
              onClick={() => navigate('/cart')}
              className="btn-primary relative shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                {cartCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-40 skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded skeleton" />
                <div className="h-3 w-1/2 rounded skeleton" />
                <div className="h-8 w-full rounded-lg skeleton mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card p-8 text-center">
          <p className="text-danger-600 text-sm font-medium">Failed to load products. Please refresh the page.</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-900">No products found</h3>
          <p className="text-sm text-slate-500 mt-1">{search ? 'Try a different search term' : 'Check back soon for new stock'}</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const cartItem = cart.find((item) => item.product.id === product.id);
            const qty = cartItem?.quantity || 0;
            const price = getPrice(product, qty || 1);
            const isWholesale = qty >= product.wholesale_threshold;
            const outOfStock = product.filled_stock === 0;
            const lowStock = product.filled_stock > 0 && product.filled_stock <= 10;

            return (
              <div key={product.id} className="card overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative h-40 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
                    {outOfStock ? (
                      <span className="badge-danger">Out of stock</span>
                    ) : (
                      <>
                        <span className="badge-success">{product.filled_stock} in stock</span>
                        {lowStock && <span className="badge-warning">Low stock</span>}
                      </>
                    )}
                    {isWholesale && <span className="badge-info">Wholesale</span>}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">{product.name}</h3>
                  {product.company && (
                    <Link to={`/sellers/${product.company.slug}`} className="inline-flex items-center gap-1 mt-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                      <Store className="w-3 h-3" /> {product.company.name}
                    </Link>
                  )}
                  {product.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                  )}

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-900 font-display">₦{price.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">/crate</span>
                  </div>
                  {!isWholesale && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Buy {product.wholesale_threshold}+ for ₦{product.wholesale_price.toLocaleString()} wholesale
                    </p>
                  )}

                  {qty > 0 && !isWholesale && (
                    <p className="mt-2 text-xs text-brand-600 font-medium">
                      Add {product.wholesale_threshold - qty} more to unlock wholesale price
                    </p>
                  )}

                  <div className="mt-4">
                    {outOfStock ? (
                      <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                        Out of Stock
                      </button>
                    ) : !user ? (
                      <button
                        onClick={() => navigate('/login')}
                        className="btn-primary w-full"
                      >
                        Sign in to Order
                      </button>
                    ) : qty > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center text-sm font-semibold text-slate-900">{qty}</span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.filled_stock <= qty}
                          className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="btn-primary w-full"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile sticky cart bar */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 z-20 px-4">
          <button
            onClick={() => navigate('/cart')}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm font-medium">{cartCount} crate{cartCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">₦{cartTotal.toLocaleString()}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
