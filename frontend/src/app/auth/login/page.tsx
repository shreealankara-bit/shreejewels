'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn } = useAuth();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const redirect = searchParams.get('redirect') || '/';
  const isAdminLogin = redirect.startsWith('/admin');

  useEffect(() => { if (isLoggedIn) router.push(redirect); }, [isLoggedIn]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(credentialResponse.credential);
      login(res.data.user);
      toast.success(`Welcome, ${res.data.user.name}! 💍`);
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Google login failed');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (tab === 'login') {
        res = isAdminLogin
          ? await authAPI.adminLogin(form.email, form.password)
          : await authAPI.login(form.email, form.password);
      } else {
        res = await authAPI.register(form.name, form.email, form.password);
      }
      login(res.data.user);
      toast.success(`Welcome${tab === 'register' ? ' to ShreeJewels' : ' back'}! 💍`);
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally { setLoading(false); }
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white shadow-card p-8 md:p-10"
      >
        {/* Logo */}
        <div className="text-center mb-8 flex justify-center">
          <Link href="/">
            <Image src="/Logo_Main.png" alt="Shree Alankara" width={220} height={110} className="h-24 w-auto object-contain" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border border-charcoal-200 mb-6">
          {[['login', 'Sign In'], ['register', 'Register']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'bg-gold-500 text-white' : 'text-charcoal-600 hover:bg-cream-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Google login */}
        <div className="mb-5">
          {clientId ? (
            <GoogleOAuthProvider clientId={clientId}>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google login failed')}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text={tab === 'register' ? 'signup_with' : 'signin_with'}
                />
              </div>
            </GoogleOAuthProvider>
          ) : (
            <button
              onClick={() => toast.error('Google Client ID not configured')}
              className="w-full border border-charcoal-200 py-3 text-sm text-charcoal-700 flex items-center justify-center gap-3 hover:bg-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span className="flex-1 h-px bg-charcoal-200" />
          <span className="text-xs text-charcoal-400 uppercase tracking-wider">or</span>
          <span className="flex-1 h-px bg-charcoal-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs text-charcoal-600 font-medium mb-1.5 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                className="input-field"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-charcoal-600 font-medium mb-1.5 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-charcoal-600 font-medium mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="input-field pr-10"
                minLength={6}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="btn-gold w-full py-3.5 mt-2"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-charcoal-500 text-center mt-5">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-gold-500 hover:underline">Terms</Link> and{' '}
          <Link href="/privacy" className="text-gold-500 hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center"><div className="text-gold-500">Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
