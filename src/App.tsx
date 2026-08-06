import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import SellerDashboard from './pages/SellerDashboard';
import SellerProducts from './pages/SellerProducts';
import SellerOrders from './pages/SellerOrders';
import Sellers from './pages/Sellers';
import SellerStorefront from './pages/SellerStorefront';
import AdminSellers from './pages/AdminSellers';
import { Package } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-glow">
            <Package className="w-6 h-6 text-white animate-pulse" strokeWidth={2.5} />
          </div>
          <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route element={<Layout />}>
          <Route path="/" element={user?.role === 'admin' ? <AdminDashboard /> : user?.role === 'seller' ? <SellerDashboard /> : <Catalog />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/cart" element={user ? <Cart /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <MyOrders /> : <Navigate to="/login" />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/sellers/:slug" element={<SellerStorefront />} />
          {/* Seller routes */}
          <Route path="/seller" element={user?.role === 'seller' || user?.role === 'admin' ? <SellerDashboard /> : <Navigate to="/" />} />
          <Route path="/seller/products" element={user?.role === 'seller' || user?.role === 'admin' ? <SellerProducts /> : <Navigate to="/" />} />
          <Route path="/seller/orders" element={user?.role === 'seller' || user?.role === 'admin' ? <SellerOrders /> : <Navigate to="/" />} />
          {/* Admin routes */}
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/admin/products" element={user?.role === 'admin' ? <AdminProducts /> : <Navigate to="/" />} />
          <Route path="/admin/orders" element={user?.role === 'admin' ? <AdminOrders /> : <Navigate to="/" />} />
          <Route path="/admin/sellers" element={user?.role === 'admin' ? <AdminSellers /> : <Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
