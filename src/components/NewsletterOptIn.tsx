'use client';

import { useState } from 'react';
import { Mail, Phone, Check, BellRing, Sparkles, Loader2 } from 'lucide-react';

export default function NewsletterOptIn() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please check the box to consent to receiving updates.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, consent }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to opt in.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network communication failed.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-lg mx-auto rounded-3xl bg-[#140827]/90 border border-purple-800/80 p-6 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-white">You&apos;re On the VIP List!</h4>
        <p className="text-xs text-purple-200/80 mt-1">
          Thank you! You will be the first to know about future college pop-up stalls, astrology specials, and booking discounts.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-b from-[#180933]/90 to-[#0e041e]/90 border border-purple-800/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
      <div className="text-center mb-5">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
          <BellRing className="w-5 h-5" />
        </div>
        <h4 className="text-xl font-black text-white">Stay in the Cosmic Loop</h4>
        <p className="text-xs text-purple-200/80 mt-1">
          Get notified when we set up live stalls at SSPU fests, pop-ups, and offer exclusive discount codes.
        </p>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            required
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
          />
          <input
            type="tel"
            required
            placeholder="10-digit WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="newsletter-consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 rounded border-purple-800 text-amber-500 focus:ring-amber-400 bg-black/60"
          />
          <label htmlFor="newsletter-consent" className="text-[10px] text-purple-300/80 leading-tight cursor-pointer">
            I agree to receive occasional updates about future tarot events and festival stalls. (No spam, opt-out anytime).
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-600 text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Subscribe for Future Event Alerts</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
