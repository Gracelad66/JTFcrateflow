import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Boxes,
  ArrowRight,
  Clock,
  Wallet,
  AlertTriangle,
  Store,
} from 'lucide-react';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { products: allProducts } = useProducts({ includeInactive: true });
  const { user } = useAuth();
  const [company, setCompany] = useState<{ id: string; name: string; slug: string } | null>(null);

  useEffect(() => {
    if (!user?.company_id) return;
    supabase
      .from('companies')
      .select('id, name, slug')
      .eq('id', user.company_id)
      .maybeSingle()
      .then(({ data }) => setCompany(data));
  }, [user?.company_id]);

  const products = allProducts.filter((p) => p.company_id === user?.company_id);

  const myProductIds = new Set(products.map((p) => p.id));
  const myOrders = orders.filter((o) =>
    o.items?.some((item: { product_id: string }) => myProductIds.has(item.product_id))
  );

  const totalRevenue = myOrders
    .filter((o) => o.status === 'fulfilled' || o.status === 'paid')
    .reduce((sum, o) => {
      const myItems = o.items?.filter((item: { product_id: string }) => myProductIds.has(item.product_id)) || [];
      return sum + myItems.reduce((s, item: { total_price: number }) => s + item.total_price, 0);
    }, 0);

  const totalOrders = myOrders.length;
  const pendingOrders = myOrders.filter((o) => o.status === 'pending').length;
  const totalFilledStock = products.reduce((sum, p) => sum + p.filled_stock, 0);
  const totalEmptyStock = products.reduce((sum, p) => sum + p.empty_stock, 0);
  const lowStockProducts = products.filter((p) => p.filled_stock > 0 && p.filled_stock <= 10);
  const outOfStockProducts = products.filter((p) => p.filled_stock === 0);
  const recentOrders = myOrders.slice(0, 6);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'fulfilled': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const stats = [
    { label: 'My Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-success-50 text-success-600' },
    { label: 'My Orders', value: totalOrders, sub: `${pendingOrders} pending`, icon: ShoppingCart, color: 'bg-brand-50 text-brand-600' },
    { label: 'Filled Stock', value: `${totalFilledStock}`, sub: 'crates', icon: Package, color: 'bg-accent-50 text-accent-700' },
    { label: 'Empty Crates', value: `${totalEmptyStock}`, sub: 'crates', icon: Boxes, color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900 font-display">{company?.name || 'Seller Dashboard'}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Manage your products, stock, and orders.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-display">{stat.value}</p>
            {stat.sub && <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="card p-4 border-warning-200 bg-warning-50/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Stock Alerts</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            {outOfStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-slate-700">{p.name}</span>
                <span className="badge-danger">Out of stock</span>
              </div>
            ))}
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-slate-700">{p.name}</span>
                <span className="badge-warning">{p.filled_stock} left</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/seller/products')}
            className="mt-3 flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700"
          >
            Manage inventory <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inventory + Recent Orders grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Inventory */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">My Products</h2>
            <button onClick={() => navigate('/seller/products')} className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700">
              Manage <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 mb-3">No products yet</p>
                <button onClick={() => navigate('/seller/products')} className="btn-primary">
                  <Package className="w-4 h-4" /> Add Product
                </button>
              </div>
            ) : (
              products.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">₦{product.retail_price.toLocaleString()} retail</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{product.filled_stock}</p>
                      <p className="text-[10px] text-success-600 uppercase">filled</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{product.empty_stock}</p>
                      <p className="text-[10px] text-slate-400 uppercase">empty</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Orders</h2>
            <button onClick={() => navigate('/seller/orders')} className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500">{order.customer?.full_name || order.customer?.email || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={getStatusColor(order.status)}>{order.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
