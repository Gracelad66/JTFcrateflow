import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Banknote,
  Package,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Loader2,
} from 'lucide-react';

interface CartItem {
  product: {
    id: string;
    name: string;
    image_url: string | null;
    retail_price: number;
    wholesale_price: number;
    wholesale_threshold: number;
    filled_stock: number;
  };
  quantity: number;
}

export default function Cart() {
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const { refresh } = useProducts();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [emptyCrates, setEmptyCrates] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const updateCart = (items: CartItem[]) => {
    setCart(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const getPrice = (item: CartItem) => {
    return item.quantity >= item.product.wholesale_threshold
      ? item.product.wholesale_price
      : item.product.retail_price;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * getPrice(item), 0);
  const totalCrates = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart
      .map((item) => {
        if (item.product.id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: Math.min(newQty, item.product.filled_stock) };
      })
      .filter(Boolean) as CartItem[];
    updateCart(newCart);
  };

  const removeItem = (productId: string) => {
    updateCart(cart.filter((item) => item.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!deliveryLocation.trim()) {
      setError('Please enter a delivery location so we know where to bring your crates.');
      return;
    }
    setError('');
    setLoading(true);

    const items = cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: getPrice(item),
    }));

    const { data, error: err } = await createOrder(items, 'cash_on_delivery', emptyCrates, deliveryLocation, deliveryNotes);

    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to place order');
      return;
    }

    setOrderId(data?.id || '');
    setSuccess(true);
    updateCart([]);
    refresh();
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-scale-in">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-glow">
          <CheckCircle2 className="w-10 h-10 text-success-600" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Order Placed!</h2>
        <p className="text-sm text-slate-600 mb-1">
          Your order has been received and is being processed.
        </p>
        {emptyCrates > 0 && (
          <p className="text-sm text-slate-500 mb-1">
            Bring <span className="font-semibold text-slate-700">{emptyCrates}</span> empty crate{emptyCrates !== 1 ? 's' : ''} to exchange.
          </p>
        )}
        <p className="text-xs text-slate-400 mb-6 font-mono mt-3">Order ID: {orderId.slice(0, 8)}</p>
        <div className="space-y-2">
          <button onClick={() => navigate('/orders')} className="btn-primary w-full">
            View My Orders
          </button>
          <button onClick={() => navigate('/catalog')} className="btn-secondary w-full">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-semibold text-slate-900">Your cart is empty</h3>
        <p className="text-slate-500 text-sm mt-1 mb-4">Browse the catalog to add drinks.</p>
        <button onClick={() => navigate('/catalog')} className="btn-primary">
          Browse Catalog
        </button>
      </div>
    );
  }

  const netCrates = Math.max(0, totalCrates - emptyCrates);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/catalog')}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-5 font-display">Shopping Cart</h1>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-3">
          {/* Cart items */}
          {cart.map((item) => {
            const price = getPrice(item);
            const isWholesale = item.quantity >= item.product.wholesale_threshold;
            return (
              <div key={item.product.id} className="card p-4 flex gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{item.product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-slate-900">₦{price.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">/crate</span>
                        {isWholesale && <span className="badge-success">Wholesale</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.product.filled_stock <= item.quantity}
                      className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-medium text-slate-500 ml-auto">₦{(item.quantity * price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Crate Exchange */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Crate Exchange</h3>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm text-slate-700">Empty crates you're returning?</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEmptyCrates(Math.max(0, emptyCrates - 1))}
                  className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-semibold w-8 text-center">{emptyCrates}</span>
                <button
                  onClick={() => setEmptyCrates(emptyCrates + 1)}
                  className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Return empty crates to refill our inventory. You only pay for the drinks.
            </p>
          </div>

          {/* Payment Method */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Payment Method</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-200 bg-brand-50 text-sm">
              <Banknote className="w-5 h-5 text-brand-600" />
              <div className="text-left flex-1">
                <p className="font-medium text-slate-900">Pay on Delivery</p>
                <p className="text-xs text-slate-500">Pay in cash when your crates are delivered</p>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-brand-600 bg-brand-600" />
            </div>
          </div>

          {/* Delivery Location */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Delivery Location</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">Where should we deliver your crates?</p>
            <input
              type="text"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              placeholder="e.g. 12 Adeola Odeku St, Victoria Island, Lagos"
              className="input"
            />
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Optional: landmark, contact, delivery instructions"
              rows={2}
              className="input mt-2 resize-none"
            />
          </div>
        </div>

        {/* Sticky summary */}
        <div className="lg:sticky lg:top-20 self-start">
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-slate-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Crates</span>
                <span className="font-medium text-slate-900">{totalCrates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Empty Crates Returning</span>
                <span className="font-medium text-slate-900">{emptyCrates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Net Crates to Pay</span>
                <span className="font-medium text-slate-900">{netCrates}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-slate-900 text-xl font-display">₦{cartTotal.toLocaleString()}</span>
              </div>
            </div>
            {emptyCrates > totalCrates && (
              <div className="flex items-center gap-2 text-xs text-warning-700 bg-warning-50 p-2.5 rounded-lg border border-warning-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You can only exchange up to {totalCrates} empty crates for this order.</span>
              </div>
            )}
            {error && (
              <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg border border-danger-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button onClick={handleCheckout} disabled={loading} className="btn-primary w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Place Order'}
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              By placing this order you agree to CrateFlow's terms of service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
