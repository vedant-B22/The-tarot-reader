'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, ShieldCheck, KeyRound, Mail, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isBootstrap, setIsBootstrap] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/bootstrap')
      .then(res => res.json())
      .then(data => {
        setIsBootstrap(data.needsBootstrap);
      })
      .catch(() => {})
      .finally(() => setCheckingBootstrap(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isBootstrap ? '/api/auth/bootstrap' : '/api/auth/login';
      const body = isBootstrap
        ? { email, password, name }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Authentication failed';
        if (errorMsg.toLowerCase().includes('already initialized')) {
          setIsBootstrap(false);
          setError('System is already initialized with an admin. Please sign in below.');
        } else {
          setError(errorMsg);
        }
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch {
      setError('Network communication failed');
      setLoading(false);
    }
  };

  if (checkingBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#120824] border border-purple-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-purple-600 p-0.5 mx-auto mb-3 shadow-lg">
            <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
              <Moon className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <h2 className="text-xl font-black text-white tracking-wide">
            {isBootstrap ? 'Setup Super Admin Account' : 'Tarot Stall Admin Portal'}
          </h2>

          <p className="text-xs text-purple-200/80 mt-1">
            {isBootstrap
              ? 'First-run detected: Create the master Super Admin account with full control.'
              : 'Sign in to manage live queue, verify payments, and handle sessions.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isBootstrap && (
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Master Reader Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="admin@sspu-tarot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isBootstrap ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>INITIALIZE SUPER ADMIN</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>SIGN IN TO ADMIN CONSOLE</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            {isBootstrap ? (
              <button
                type="button"
                onClick={() => {
                  setIsBootstrap(false);
                  setError(null);
                }}
                className="text-xs text-amber-400/90 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Already initialized? Sign in with existing credentials
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsBootstrap(true);
                  setError(null);
                }}
                className="text-xs text-purple-400/80 hover:text-purple-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                First time? Setup Super Admin account
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
