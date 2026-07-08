import { useOrders } from '../hooks/useOrders';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  MapPin,
  Loader2,
  Truck,
} from 'lucide-react';
import type { Order } from '../hooks/useOrders';

const STATUS_STEPS: { key: Order['status']; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'fulfilled', label: 'Fulfilled', icon: Truck },
];

function StatusTimeline({ status }: { status: Order['status'] }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-danger-600 text-xs font-medium">
        <XCircle className="w-4 h-4" />
        Order cancelled
      </div>
    );
  }
  const activeIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, i) => {
        const done = i < activeIndex || status === 'fulfilled';
        const active = i === activeIndex;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  done ? 'bg-success-500 text-white' : active ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[9px] font-medium ${done || active ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-success-400' : 'bg-slate-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const { orders, loading, error } = useOrders();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center text-danger-600 text-sm">
        Failed to load orders. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-1 font-display">My Orders</h1>
      <p className="text-sm text-slate-500 mb-6">Track your orders and delivery status.</p>

      {orders.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-900">No orders yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Browse the catalog and place your first order.</p>
          <button onClick={() => navigate('/catalog')} className="btn-primary">
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 font-display">₦{order.total_amount.toLocaleString()}</p>
                  <span className="badge-neutral mt-0.5">
                    <Banknote className="w-3 h-3" /> Pay on Delivery
                  </span>
                </div>
              </div>

              <div className="py-3 border-y border-slate-100">
                <StatusTimeline status={order.status} />
              </div>

              {(order.delivery_location || order.delivery_notes) && (
                <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
                  <div>
                    {order.delivery_location && <p>{order.delivery_location}</p>}
                    {order.delivery_notes && <p className="text-slate-500 mt-0.5">{order.delivery_notes}</p>}
                  </div>
                </div>
              )}

              {order.items && order.items.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    {order.items.map((item: { product: { name: string }; quantity: number }) => `${item.quantity}× ${item.product?.name || 'Product'}`).join(', ')}
                  </span>
                </div>
              )}

              {order.empty_crates_returned > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  Returning <span className="font-medium text-slate-700">{order.empty_crates_returned}</span> empty crate{order.empty_crates_returned !== 1 ? 's' : ''}
                </div>
              )}

              <button
                onClick={() => navigate('/catalog')}
                className="mt-4 flex items-center justify-between w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-600 transition-colors"
              >
                <span>Need more drinks? Order again</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
