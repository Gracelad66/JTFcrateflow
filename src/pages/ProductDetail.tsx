import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProducts, type ProductWithCompany } from '../hooks/useProducts';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Store,
  Star,
  Truck,
  ShieldCheck,
  Repeat,
  Loader2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface CartItem {
  product: ProductWithCompany;
  quantity: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { reviews, loading: reviewsLoading, addReview, deleteReview } = useReviews(id || null);

  const [product, setProduct] = useState<ProductWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [userReview, setUserReview] = useState<{ id: string; rating: number; comment: string | null } | null>(null);

  // Load product
  useState(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('products')
      .select('*, company:companies(id, name, slug), category:categories(id, name, slug)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProduct(data as unknown as ProductWithCompany);
        setLoading(false);
      });
  });

  // Check if current user already has a review
  useState(() => {
    if (!user || !id) return;
    supabase
      .from('reviews')
      .select('id, rating, comment')
      .eq('product_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserReview(data as { id: string; rating: number; comment: string | null });
      });
  });

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.company_id === product.company_id && p.active)
      .slice(0, 3);
  }, [product, products]);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const getPrice = (product: ProductWithCompany, quantity: number) =>
    quantity >= product.wholesale_threshold ? product.wholesale_price : product.retail_price;

  const addToCart = () => {
    if (!product) return;
    const saved = localStorage.getItem('cart');
    const cart: CartItem[] = saved ? JSON.parse(saved) : [];
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      const updated = cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + qty, product.filled_stock) }
          : item
      );
      localStorage.setItem('cart', JSON.stringify(updated));
    } else {
      localStorage.setItem('cart', JSON.stringify([...cart, { product, quantity: Math.min(qty, product.filled_stock) }]));
    }
    navigate('/cart');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    const { error } = await addReview(reviewRating, reviewComment);
    setSubmittingReview(false);
    if (error) {
      setReviewError(error.message);
      return;
    }
    setReviewComment('');
    setReviewRating(5);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await deleteReview(reviewId);
    if (!error) setUserReview(null);
  };

  if (loading || productsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card py-16 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900">Product not found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">This product may no longer be available.</p>
        <Link to="/catalog" className="btn-primary">Browse Catalog</Link>
      </div>
    );
  }

  const price = getPrice(product, qty);
  const isWholesale = qty >= product.wholesale_threshold;
  const outOfStock = product.filled_stock === 0;
  const lowStock = product.filled_stock > 0 && product.filled_stock <= 10;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* Product image */}
        <div className="card overflow-hidden">
          <div className="relative h-72 md:h-96 bg-gradient-to-br from-slate-50 to-slate-100">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-slate-300" />
              </div>
            )}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
              {outOfStock ? (
                <span className="badge-danger">Out of stock</span>
              ) : (
                <>
                  <span className="badge-success">{product.filled_stock} in stock</span>
                  {lowStock && <span className="badge-warning">Low stock</span>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-4">
          <div>
            {product.company && (
              <Link
                to={`/sellers/${product.company.slug}`}
                className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                <Store className="w-4 h-4" /> {product.company.name}
              </Link>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mt-1">{product.name}</h1>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-500">{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
          )}

          <div className="card p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-display">₦{price.toLocaleString()}</span>
              <span className="text-sm text-slate-500">/crate</span>
              {isWholesale && <span className="badge-info ml-2">Wholesale</span>}
            </div>
            {!isWholesale && (
              <p className="text-xs text-slate-500 mt-1">
                Buy {product.wholesale_threshold}+ for ₦{product.wholesale_price.toLocaleString()} per crate (wholesale)
              </p>
            )}
            {qty > 0 && !isWholesale && (
              <p className="mt-2 text-xs text-brand-600 font-medium">
                Add {product.wholesale_threshold - qty} more to unlock wholesale price
              </p>
            )}

            {/* Quantity selector */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-semibold w-12 text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.filled_stock, qty + 1))}
                  disabled={product.filled_stock <= qty}
                  className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-slate-500">Total: ₦{(qty * price).toLocaleString()}</span>
            </div>

            {/* Add to cart */}
            <div className="mt-4">
              {outOfStock ? (
                <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                  Out of Stock
                </button>
              ) : !user ? (
                <button onClick={() => navigate('/login')} className="btn-primary w-full">
                  Sign in to Order
                </button>
              ) : (
                <button onClick={addToCart} className="btn-primary w-full">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-slate-50">
              <Truck className="w-5 h-5 text-brand-600" />
              <span className="text-[11px] font-medium text-slate-600">24h Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-slate-50">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span className="text-[11px] font-medium text-slate-600">Secure Pay</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-slate-50">
              <Repeat className="w-5 h-5 text-brand-600" />
              <span className="text-[11px] font-medium text-slate-600">Crate Exchange</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900">Reviews & Ratings</h2>

        {/* Review summary */}
        {reviews.length > 0 && (
          <div className="card p-5 flex items-center gap-6">
            <div className="text-center shrink-0">
              <div className="font-display text-4xl font-extrabold text-slate-900">{avgRating.toFixed(1)}</div>
              <div className="flex items-center gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                  />
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = (count / reviews.length) * 100;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-slate-500">{star}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Write a review */}
        {user && user.role === 'customer' && !userReview && (
          <form onSubmit={handleSubmitReview} className="card p-5 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Write a review</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-slate-300'}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={3}
              className="input resize-none"
            />
            {reviewError && (
              <div className="flex items-center gap-2 text-xs text-danger-600">
                <AlertCircle className="w-4 h-4" /> {reviewError}
              </div>
            )}
            <button type="submit" disabled={submittingReview} className="btn-primary">
              {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Your review */}
        {userReview && (
          <div className="card p-4 border-brand-200 bg-brand-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-brand-700">Your review</span>
              <button
                onClick={() => handleDeleteReview(userReview.id)}
                className="text-xs text-danger-600 hover:text-danger-700 font-medium"
              >
                Delete
              </button>
            </div>
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= userReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                />
              ))}
            </div>
            {userReview.comment && <p className="text-sm text-slate-600">{userReview.comment}</p>}
          </div>
        )}

        {/* Reviews list */}
        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="card py-10 text-center">
            <Star className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center text-xs font-semibold text-brand-700">
                      {(review.user?.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {review.user?.full_name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(review.created_at || '').toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-slate-900 mb-4">More from this seller</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedProducts.map((p) => {
              const pPrice = getPrice(p, 1);
              return (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="card overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-slate-900 text-xs line-clamp-1">{p.name}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-base font-bold text-slate-900 font-display">₦{pPrice.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500">/crate</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
