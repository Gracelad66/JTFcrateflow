import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationsBell from './NotificationsBell';
import HelpMenu from './HelpMenu';
import { SIDEBAR_BLURB } from '../config/content';
import {
  Package,
  ShoppingCart,
  ClipboardList,
  LayoutDashboard,
  Boxes,
  LogOut,
  Menu,
  X,
  Truck,
  Home as HomeIcon,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    return location.pathname.startsWith(path) && path !== '/';
  };

  const customerLinks = [
    { path: '/catalog', label: 'Catalog', icon: Package },
    { path: '/cart', label: 'Cart', icon: ShoppingCart },
    { path: '/orders', label: 'My Orders', icon: ClipboardList },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: Boxes },
    { path: '/admin/orders', label: 'Orders', icon: ClipboardList },
  ];

  const navLinks = isAdmin ? adminLinks : customerLinks;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="glass border-b border-slate-200/70 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md shadow-brand-600/25 group-hover:shadow-lg group-hover:shadow-brand-600/40 transition-all group-active:scale-95">
                <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="font-display font-bold text-slate-900 text-lg leading-none block">CrateFlow</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase hidden sm:block leading-none mt-0.5">Wholesale Drinks</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/catalog')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 px-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-xs font-semibold text-slate-700">
                    {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-medium text-slate-800 text-xs truncate max-w-[120px]">{user.full_name || user.email}</span>
                    {isAdmin && <span className="text-[10px] text-brand-600 font-semibold mt-0.5">Admin</span>}
                  </div>
                </div>
                <NotificationsBell />
                <button
                  onClick={signOut}
                  className="p-2 text-slate-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary px-4 py-2"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl p-5 animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-slate-900 text-lg">CrateFlow</span>
            </div>
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-brand-50 text-brand-700 border border-brand-100'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 px-3">
                <span>Signed in as</span>
                <span className="font-medium text-slate-700 truncate">{user?.email}</span>
              </div>
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar + Content */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 sticky top-16 h-[calc(100vh-4rem)] py-5 px-3">
          <nav className="space-y-1 flex-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-brand-50 text-brand-700 border border-brand-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
              <Truck className="w-4 h-4 text-success-600 shrink-0" />
              <div className="text-xs leading-tight">
                <p className="font-medium text-slate-700">{SIDEBAR_BLURB.title}</p>
                <p className="text-slate-500">{SIDEBAR_BLURB.subtitle}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 py-6 md:px-6 md:py-8 pb-24 lg:pb-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 glass border-t border-slate-200/70 z-30 px-2 py-1.5">
          <div className="flex items-center justify-around">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive(link.path) ? 'text-brand-600' : 'text-slate-500'
                }`}
              >
                <link.icon className={`w-5 h-5 ${isActive(link.path) ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
      <HelpMenu />
    </div>
  );
}
