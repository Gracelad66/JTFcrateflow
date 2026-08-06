import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProducts, type ProductWithCompany } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import type { Company } from '../hooks/useCompanies';
import {
  Store,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

interface CartItem {
  product: ProductWithCompany;
  quantity: number;
}

export default function SellerStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading, error } = useProducts();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!slug) return;
    setCompanyLoading(true);
    supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!err && data) setCompany(data);
        setCompanyLoading(false);
      });
  }, [slug]);

  const sellerProducts = products.filter((p) => p.company_id === company?.id && p.active);

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

  const getPrice = (product: ProductWithCompany, qty: number) =>
    qty >= product.wholesale_threshold ? product.wholesale_price : product.retail_price;

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * getPrice(item.product, item.quantity), 0);

  if (companyLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="card py-16 text-center">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900">Seller not found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">This seller may no longer be active.</p>
        <Link to="/sellers" className="btn-primary">Browse all sellers</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Link to="/sellers" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All sellers
      </Link>

      {/* Seller header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white shadow-glow">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative px-6 py-8 md:px-10 md:py-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center shrink-0">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Store className="w-8 h-8" strokeWidth={2.5} />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold leading-tight">{company.name}</h1>
            {company.description && (
              <p className="mt-1 text-brand-100 text-sm md:text-base max-w-lg">{company.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-brand-100">
              <Package className="w-3.5 h-3.5" />
              <span>{sellerProducts.length} products available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-40 skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded skeleton" />
                <div className="h-3 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="card p-6 text-center text-danger-600 text-sm">Failed to load products.</div>}

      {!loading && !error && sellerProducts.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-900">No products available</h3>
          <p className="text-sm text-slate-500 mt-1">This seller hasn't listed any products yet.</p>
        </div>
      )}

      {!loading && !error && sellerProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellerProducts.map((product) => {
            const cartItem = cart.find((item) => item.product.id === product.id);
            const qty = cartItem?.quantity || 0;
            const price = getPrice(product, qty || 1);
            const isWholesale = qty >= product.wholesale_threshold;
            const outOfStock = product.filled_stock === 0;

            return (
              <div key={product.id} className="card overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative h-40 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    {outOfStock ? (
                      <span className="badge-danger">Out of stock</span>
                    ) : (
                      <span className="badge-success">{product.filled_stock} in stock</span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">{product.name}</h3>
                  {product.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-900 font-display">₦{price.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">/crate</span>
                  </div>
                  {!isWholesale && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Buy {product.wholesale_threshold}+ for ₦{product.wholesale_price.toLocaleString()} wholesale
                    </p>
                  )}
                  <div className="mt-4">
                    {outOfStock ? (
                      <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">Out of Stock</button>
                    ) : !user ? (
                      <button onClick={() => navigate('/login')} className="btn-primary w-full">Sign in to Order</button>
                    ) : qty > 0 ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(product.id, -1)} className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center text-sm font-semibold text-slate-900">{qty}</span>
                        <button onClick={() => addToCart(product)} disabled={product.filled_stock <= qty} className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 shrink-0">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeFromCart(product.id)} className="px-2.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors shrink-0">Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(product)} className="btn-primary w-full">
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 z-20 px-4">
          <button onClick={() => navigate('/cart')} className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl active:scale-[0.98] transition-transform">
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
