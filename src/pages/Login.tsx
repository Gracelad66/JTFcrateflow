import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Package, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { LOGIN_PAGE } from '../config/content';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to sign in');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single();
    navigate(profile?.role === 'admin' ? '/admin' : '/catalog');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Brand panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 relative overflow-hidden p-12 flex-col justify-between text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -right-32 top-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl">CrateFlow NG</span>
          </div>
          <div className="relative">
            <h2 className="font-display text-4xl font-extrabold leading-tight mb-3 text-balance">
              {LOGIN_PAGE.brandHeadline}
            </h2>
            <p className="text-brand-100 text-lg leading-relaxed max-w-md">
              {LOGIN_PAGE.brandSubheadline}
            </p>
          </div>
          <div className="relative flex items-center gap-6 text-sm text-brand-100">
            {LOGIN_PAGE.brandBullets.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success-300 rounded-full" />
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm animate-slide-up">
            <Link to="/catalog" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back home
            </Link>
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-lg text-slate-900">CrateFlow NG</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">{LOGIN_PAGE.formTitle}</h1>
            <p className="text-sm text-slate-500 mb-6">{LOGIN_PAGE.formSubtitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg border border-danger-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {LOGIN_PAGE.ctaLoadingLabel}</> : LOGIN_PAGE.ctaLabel}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              {LOGIN_PAGE.registerPrompt}{' '}
              <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">
                {LOGIN_PAGE.registerLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
