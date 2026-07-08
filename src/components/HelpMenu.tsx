import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
import {
  HelpCircle,
  X,
  Package,
  ShoppingCart,
  ClipboardList,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  Banknote,
  MapPin,
} from 'lucide-react';
import type { Product } from '../hooks/useProducts';
import type { OrderWithItems } from '../hooks/useOrders';

type Panel = 'menu' | 'stock' | 'order' | 'track';

export default function HelpMenu() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('menu');
  const navigate = useNavigate();
  const { user } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const close = () => {
    setOpen(false);
    setPanel('menu');
  };

  const go = (path: string) => {
    close();
    navigate(path);
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="card w-80 max-h-[70vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-sm text-slate-900">
              {panel === 'menu' && 'How can we help?'}
              {panel === 'stock' && 'Check Stock'}
              {panel === 'order' && 'Quick Order'}
              {panel === 'track' && 'Track Deliveries'}
            </h3>
            <button onClick={close} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {panel === 'menu' && <MenuPanel setPanel={setPanel} go={go} user={user} />}
            {panel === 'stock' && <StockPanel />}
            {panel === 'order' && <OrderPanel go={go} />}
            {panel === 'track' && <TrackPanel />}
          </div>
        </div>
      )}

      <button
        onClick={() => { setOpen(!open); setPanel('menu'); }}
        className="w-12 h-12 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40 transition-all active:scale-95 flex items-center justify-center"
        aria-label="Help menu"
      >
        {open ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </button>
    </div>
  );
}

function MenuPanel({ setPanel, go, user }: { setPanel: (p: Panel) => void; go: (p: string) => void; user: { email: string } | null }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">Quick actions to get things done faster.</p>

      <button onClick={() => setPanel('order')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-left group">
        <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-200 transition-colors">
          <ShoppingCart className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">Place an Order</p>
          <p className="text-xs text-slate-500">Browse drinks and add crates to cart</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
      </button>

      <button onClick={() => setPanel('stock')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-left group">
        <div className="w-9 h-9 rounded-lg bg-success-100 text-success-600 flex items-center justify-center shrink-0 group-hover:bg-success-200 transition-colors">
          <Package className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">Check Stock</p>
          <p className="text-xs text-slate-500">See what's available right now</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
      </button>

      <button onClick={() => setPanel('track')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-left group">
        <div className="w-9 h-9 rounded-lg bg-warning-100 text-warning-600 flex items-center justify-center shrink-0 group-hover:bg-warning-200 transition-colors">
          <Truck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">Track Deliveries</p>
          <p className="text-xs text-slate-500">Check status of your orders</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
      </button>

      {user && (
        <button onClick={() => go('/my-orders')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-left group">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">My Orders</p>
            <p className="text-xs text-slate-500">View all your past orders</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
        </button>
      )}
    </div>
  );
}

function StockPanel() {
  const { products, loading } = useProducts();
  const [search, setSearch] = useState('');
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No products found.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filtered.map((p) => (
            <StockRow key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function StockRow({ product }: { product: Product }) {
  const low = product.filled_stock <= 10;
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-medium ${low ? 'text-danger-600' : 'text-success-600'}`}>
            {low ? <TrendingDown className="w-3 h-3 inline mr-0.5" /> : <TrendingUp className="w-3 h-3 inline mr-0.5" />}
            {product.filled_stock} filled
          </span>
          <span className="text-xs text-slate-400">{product.empty_stock} empty</span>
        </div>
      </div>
    </div>
  );
}

function OrderPanel({ go }: { go: (p: string) => void }) {
  const { products, loading } = useProducts();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const adjust = (id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[id] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) delete next[id];
      else next[id] = updated;
      return next;
    });
  };

  const totalCrates = Object.values(cart).reduce((s, q) => s + q, 0);

  const addToCart = () => {
    const items = Object.entries(cart).map(([productId, quantity]) => {
      const p = products.find((x) => x.id === productId)!;
      const price = quantity >= p.wholesale_threshold ? p.wholesale_price : p.retail_price;
      return { product_id: productId, quantity, unit_price: price };
    });
    localStorage.setItem('cart', JSON.stringify(items.map((i) => {
      const p = products.find((x) => x.id === i.product_id)!;
      return { product: p, quantity: i.quantity };
    })));
    go('/cart');
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search drinks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No products found.</p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.filled_stock} in stock
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => adjust(p.id, -1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <Minus className="w-3 h-3 text-slate-600" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{cart[p.id] || 0}</span>
                <button onClick={() => adjust(p.id, 1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <Plus className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalCrates > 0 && (
        <button onClick={addToCart} className="btn-primary w-full mt-2">
          <ShoppingCart className="w-4 h-4" /> Add {totalCrates} crate{totalCrates > 1 ? 's' : ''} to Cart
        </button>
      )}
    </div>
  );
}

function TrackPanel() {
  const { user } = useAuth();
  const { orders, loading } = useOrders();
  const myOrders = orders.filter((o) => o.customer_id === user?.id).slice(0, 5);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }

  if (!user) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-sm text-slate-500">Sign in to see your orders.</p>
      </div>
    );
  }

  if (myOrders.length === 0) {
    return (
      <div className="text-center py-6 space-y-3">
        <Package className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm text-slate-500">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {myOrders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const statusConfig: Record<string, { icon: typeof Clock; badge: string; label: string }> = {
    pending: { icon: Clock, badge: 'badge-warning', label: 'Pending' },
    fulfilled: { icon: CheckCircle2, badge: 'badge-info', label: 'Fulfilled' },
    cancelled: { icon: XCircle, badge: 'badge-danger', label: 'Cancelled' },
  };
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">#{order.id.slice(0, 8)}</span>
        <span className={`badge ${cfg.badge}`}><Icon className="w-3 h-3" /> {cfg.label}</span>
      </div>
      <div className="space-y-1">
        {order.items.slice(0, 2).map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            {item.product.image_url ? (
              <img src={item.product.image_url} alt={item.product.name} className="w-6 h-6 rounded object-cover" />
            ) : (
              <Package className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-xs text-slate-700 truncate flex-1">{item.quantity}× {item.product.name}</span>
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="text-xs text-slate-400">+{order.items.length - 2} more</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> Pay on Delivery</span>
        {order.delivery_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.delivery_location}</span>}
      </div>
    </div>
  );
}
