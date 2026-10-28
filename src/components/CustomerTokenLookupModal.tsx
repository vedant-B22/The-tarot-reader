'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Sparkles } from 'lucide-react';

export default function CustomerTokenLookupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/customer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.found) {
        setError(data.message || 'No registered reading found for this number.');
        setLoading(false);
        return;
      }

      if (data.activeToken) {
        setIsOpen(false);
        router.push(`/token/${data.activeToken.id}`);
      } else {
        setError(`Welcome back ${data.customer.name}! You do not have an active waiting token right now.`);
        setLoading(false);
      }
    } catch {
      setError('Unable to reach server. Please check your network.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/60 text-amber-200 hover:bg-purple-800/50 transition-colors flex items-center gap-1.5"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Find My Token</span>
        <span className="sm:hidden">My Token</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120a22] border border-purple-700/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-base">
              <Sparkles className="w-4 h-4" />
              <span>Find Your Active Token</span>
            </div>

            <p className="text-xs text-purple-200/80 mb-4">
              Enter the WhatsApp phone number you registered with at the stall.
            </p>

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm tracking-wider"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look Up My Token'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
