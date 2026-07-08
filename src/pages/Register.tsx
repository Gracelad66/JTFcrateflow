import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Package, Mail, Lock, User, Phone, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { REGISTER_PAGE } from '../config/content';

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    return score;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (signUpErr || !data.user) {
      setLoading(false);
      setError(signUpErr?.message || 'Registration failed');
      return;
    }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      phone,
      role: 'customer',
    });

    const { error: signInErr } = await signIn(email, password);
    setLoading(false);
    if (signInErr) {
      navigate('/login');
      return;
    }
    navigate('/catalog');
  };

  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthBar = ['bg-slate-200', 'bg-danger-500', 'bg-warning-500', 'bg-brand-500', 'bg-success-500'][passwordStrength];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Brand panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 relative overflow-hidden p-12 flex-col justify-between text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -left-32 bottom-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl">CrateFlow</span>
          </div>
          <div className="relative">
            <h2 className="font-display text-4xl font-extrabold leading-tight mb-3 text-balance">
              {REGISTER_PAGE.brandHeadline}
            </h2>
            <p className="text-brand-100 text-lg leading-relaxed max-w-md">
              {REGISTER_PAGE.brandSubheadline}
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-4 text-sm">
            {REGISTER_PAGE.brandHighlights.map(({ heading, description }) => (
              <div key={heading}>
                <p className="font-semibold text-white">{heading}</p>
                <p className="text-brand-100 text-xs">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm animate-slide-up">
            <Link to="/catalog" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back home
            </Link>
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-lg text-slate-900">CrateFlow</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">{REGISTER_PAGE.formTitle}</h1>
            <p className="text-sm text-slate-500 mb-6">{REGISTER_PAGE.formSubtitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="input pl-10"
                    autoComplete="name"
                  />
                </div>
              </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="input pl-10"
                    autoComplete="tel"
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
                    placeholder="At least 6 characters"
                    className="input pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${strengthBar} transition-all`} style={{ width: `${(passwordStrength / 4) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-16">{strengthLabel}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg border border-danger-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {REGISTER_PAGE.ctaLoadingLabel}</> : <><CheckCircle2 className="w-4 h-4" /> {REGISTER_PAGE.ctaLabel}</>}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              {REGISTER_PAGE.loginPrompt}{' '}
              <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
                {REGISTER_PAGE.loginLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
