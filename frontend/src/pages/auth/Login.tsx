import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Truck,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  UserPlus,
  Building2,
  Phone,
  MapPin,
  User,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(3, 'Please enter a valid email address or phone number'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to dashboard immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // New Registration form states
  const [regCompany, setRegCompany] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('Golden Chokdi, Vadodara (GJ)');
  const [regGstin, setRegGstin] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({
        identity: values.email,
        password: values.password,
      });

      const token = response.token;
      const user = response.user || {
        id: 1,
        name: values.email.split('@')[0],
        email: values.email,
        role: response.type || 'dispatcher',
      };
      const company = response.company || {
        uuid: 'company_techofay_01',
        name: 'TECHOFAY GLOBAL VENTURES',
      };

      setAuth(token, user, company);
      toast.success('Welcome back to Techofay Transport Operations!');
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Invalid credentials. Please verify.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword) {
      toast.error('Please provide email and password for registration.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.signUp({
        name: regName || 'Transport Manager',
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        company_name: regCompany || 'Techofay Global Logistics',
      });

      const token = response.token;
      const user = response.user || {
        id: 1,
        name: regName || 'Transport Manager',
        email: regEmail,
        role: response.type || 'admin',
        phone: regPhone,
      };
      const company = response.company || {
        uuid: 'comp_' + Date.now(),
        name: regCompany || 'Techofay Global Logistics',
        currency: 'INR',
        gstin: regGstin,
        address: regCity,
      };

      setAuth(token, user, company);
      toast.success(`Registration successful! Welcome, ${regName || 'Manager'}. Your transport console is ready.`);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setValue('email', 'dispatch.admin@techofay.com');
    setValue('password', 'fleet2026');
    onSubmit({ email: 'dispatch.admin@techofay.com', password: 'fleet2026' });
  };

  return (
    <div className="min-h-screen bg-navy-950 flex relative overflow-hidden">
      {/* 3 Slow Moving Ambient Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-navy-700/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* LEFT PANEL: Split Layout for screens >= lg */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F2D56] via-[#163866] to-[#0A1F3B] p-12 flex-col justify-between relative border-r border-white/10 z-10">
        {/* Top Branding */}
        <div>
          <div className="inline-flex items-center gap-3 p-2.5 rounded-2xl bg-black/40 border border-white/10 shadow-lg mb-6 backdrop-blur-md">
            <img
              src="/techofay-logo.png"
              alt="Techofay Logo"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-sm font-black tracking-wider text-amber-300">
              TECHOFAY GLOBAL VENTURES
            </span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight mt-4">
            India's Smart Road Freight & Logistics Console
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-md">
            Consignment admissions, statutory 4-copy bilties, live vehicle permits, driver compliance & financial ledgers in one seamless terminal.
          </p>
        </div>

        {/* Central Transport Graphic / Illustration */}
        <div className="my-8 p-6 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-sm max-w-md">
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-400">
              <Truck className="w-4 h-4" />
              Live Operations Corridor
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              24/7 Active
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-400">Origin / Yard:</span>
              <span className="text-white font-bold">Vadodara GIDC (GJ)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-400">Destination:</span>
              <span className="text-white font-bold">JNPT Port, Mumbai (MH)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-400">Statutory Format:</span>
              <span className="text-amber-300 font-bold">GST SAC 9965 Carriage</span>
            </div>
          </div>
        </div>

        {/* Bottom Stats Pills */}
        <div>
          <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white tracking-wide backdrop-blur-md">
            <span>500+ Fleets</span>
            <span className="text-saffron-400">•</span>
            <span>10,000+ LRs</span>
            <span className="text-saffron-400">•</span>
            <span>₹50Cr+ Freight</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Golden Chokdi, Vadodara, Gujarat 390024 • +91 93593 39000
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 overflow-y-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          {/* Logo Badge (h-14 with saffron glow per Prompt 5) */}
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-black/70 border border-white/20 shadow-[0_0_20px_rgba(249,115,22,0.3)] mb-4 transition-transform hover:scale-105">
            <img
              src="/techofay-logo.png"
              alt="Techofay Global Ventures"
              className="h-14 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            TECHOFAY GLOBAL VENTURES
          </h2>
          <p className="mt-1 text-xs text-amber-300 font-semibold tracking-wide">
            FLEET & TRANSPORT OPERATIONS CONSOLE
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Vadodara, Gujarat • +91 93593 39000 • admin.techofay@gmail.com
          </p>
        </div>

        <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
          {/* Glass Form Card per Prompt 5 */}
          <div className="shadow-2xl shadow-black/30 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 py-7 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-8 space-y-5 transition-all">
            {/* Dual Tab Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-navy-950 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  authMode === 'register'
                    ? 'bg-saffron-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                New Registration
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operator / Dispatcher Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                      placeholder="dispatch.admin@techofay.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      id="remember-me"
                      type="checkbox"
                      defaultChecked
                      className="h-3.5 w-3.5 rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                    />
                    <label htmlFor="remember-me" className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Remember session
                    </label>
                  </div>
                  <a href="#" className="font-semibold text-saffron-600 hover:text-saffron-500 text-[11px]">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-navy-950/30 transition active:scale-95"
                >
                  <span>{isLoading ? 'Signing In...' : 'Sign In to Dispatch Console'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* New Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transporter / Agency Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                      placeholder="e.g. Techofay Global Ventures"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Person *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                        placeholder="Manager Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                        placeholder="+91 93593 39000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operator Login Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                      placeholder="dispatch@techofay.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Yard / Hub Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                        placeholder="Golden Chokdi, Vadodara"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN / PAN
                    </label>
                    <input
                      type="text"
                      value={regGstin}
                      onChange={(e) => setRegGstin(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 transition"
                      placeholder="24AOGPP3611Q1Z4"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-saffron-500/20 transition active:scale-95 mt-2"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Complete Registration & Access Console'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Demo Access Button (Styled with Play icon per Prompt 5) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-2 font-medium">
                Want to evaluate immediately?
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-saffron-400 dark:border-saffron-700 bg-saffron-50/60 dark:bg-saffron-950/20 hover:bg-saffron-100 dark:hover:bg-saffron-950/40 text-saffron-700 dark:text-saffron-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
              >
                <div className="w-5 h-5 rounded-full bg-saffron-500 text-white flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Launch 1-Click Interactive Demo (Dispatch Officer)</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>GST SAC 9965 & Indian Logistics Standard Certified</span>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400 space-y-1">
            <p>
              Design and developed by{' '}
              <a
                href="https://techofay-global-ventures.vercel.app/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-300 hover:text-amber-200 underline"
              >
                Techofay Global Ventures
              </a>
            </p>
            <p>
              <a
                href="https://techofay-global-ventures.vercel.app/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-slate-400 hover:text-amber-300 underline"
              >
                https://techofay-global-ventures.vercel.app/contact
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
