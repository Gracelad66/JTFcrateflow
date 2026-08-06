import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import {
  ChevronDown,
  Banknote,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import type { Order } from '../hooks/useOrders';

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', badge: 'badge-warning', icon: Clock },
  awaiting_payment: { label: 'Awaiting Payment', badge: 'badge-warning', icon: Clock },
  fulfilled: { label: 'Fulfilled', badge: 'badge-info', icon: Truck },
  paid: { label: 'Paid', badge: 'badge-success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', badge: 'badge-danger', icon: XCircle },
};

const STATUS_FILTERS = ['all', 'pending', 'fulfilled', 'cancelled'] as const;

export default function SellerOrders() {
  const { orders, loading, error, fulfillOrder, updateOrderStatus } = useOrders();
  const { products: allProducts } = useProducts({ includeInactive: true });
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const myProductIds = useMemo(
    () => new Set(allProducts.filter((p) => p.company_id === user?.company_id).map((p) => p.id)),
    [allProducts, user?.company_id]
  );

  const myOrders = orders.filter((o) =>
    o.items?.some((item: { product_id: string }) => myProductIds.has(item.product_id))
  );

  const filteredOrders = filter === 'all' ? myOrders : myOrders.filter((o) => o.status === filter);

  const handleAction = async (id: string, status: Order['status']) => {
    setActionLoading(id);
    if (status === 'fulfilled') {
      await fulfillOrder(id);
    } else {
      await updateOrderStatus(id, status);
    }
    setActionLoading(null);
  };

  const counts = STATUS_FILTERS.reduce((acc, f) => {
    if (f === 'all') acc[f] = myOrders.length;
    else acc[f] = myOrders.filter((o) => o.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display">My Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Orders from customers that include your products.</p>
      </div>

      <div className="flex flex-wrap gap-2 no-scrollbar overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
            <span className={`ml-1.5 ${filter === f ? 'text-brand-100' : 'text-slate-400'}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="card p-6 text-center text-danger-600 text-sm">Failed to load orders.</div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-900">No orders yet</h3>
          <p className="text-sm text-slate-500 mt-1">Orders for your products will appear here.</p>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const expanded = expandedId === order.id;
            const Status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const items = (order.items || []).filter((item: { product_id: string }) => myProductIds.has(item.product_id));
            const isActionLoading = actionLoading === order.id;
            const myItemsTotal = items.reduce((s: number, item: { total_price: number }) => s + item.total_price, 0);

            return (
              <div key={order.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {order.customer?.full_name || order.customer?.email || 'Unknown customer'}
                        {' · '}
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-slate-900 font-display">₦{myItemsTotal.toLocaleString()}</p>
                      <span className="badge-neutral">
                        <><Banknote className="w-3 h-3" /> {order.payment_method === 'cash_on_delivery' ? 'POD' : 'Online'}</>
                      </span>
                    </div>
                    <Status.icon className={`w-4 h-4 ${Status.badge === 'badge-success' ? 'text-success-600' : Status.badge === 'badge-danger' ? 'text-danger-600' : Status.badge === 'badge-warning' ? 'text-warning-600' : 'text-brand-600'}`} />
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4 animate-slide-down">
                    {items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Items</p>
                        {items.map((item: { product: { name: string }; quantity: number; unit_price: number }, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1.5">
                            <span className="text-slate-700">
                              {item.quantity}× {item.product?.name || 'Product'}
                            </span>
                            <span className="font-medium text-slate-900">₦{(item.quantity * item.unit_price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="h-px bg-slate-100" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Customer</p>
                        <p className="text-slate-900">{order.customer?.full_name || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs">{order.customer?.email || ''}</p>
                        {order.customer?.phone && <p className="text-slate-500 text-xs">{order.customer.phone}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Payment</p>
                        <p className="text-slate-900 text-sm flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5" /> {order.payment_method === 'cash_on_delivery' ? 'Pay on Delivery' : 'Online'}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                          <Status.icon className="w-3 h-3" /> {Status.label}
                        </p>
                      </div>
                    </div>

                    {order.delivery_location && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-900">{order.delivery_location}</p>
                          {order.delivery_notes && <p className="text-slate-500 text-xs mt-0.5">{order.delivery_notes}</p>}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(order.id, 'fulfilled')}
                            disabled={isActionLoading}
                            className="btn-success"
                          >
                            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark Fulfilled</>}
                          </button>
                          <button onClick={() => handleAction(order.id, 'cancelled')} disabled={isActionLoading} className="btn-ghost text-danger-600 hover:bg-danger-50">
                            <XCircle className="w-4 h-4" /> Cancel
                          </button>
                        </>
                      )}
                      {order.status === 'fulfilled' && (
                        <span className="badge-success py-1.5 px-3"><CheckCircle2 className="w-3.5 h-3.5" /> Order fulfilled</span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="badge-danger py-1.5 px-3"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
