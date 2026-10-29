'use client';

import { useState } from 'react';
import { Sparkles, X, Check, Loader2, Calendar, MapPin } from 'lucide-react';
import { UpcomingEvent } from '@/types';

interface EventLeadModalProps {
  event: UpcomingEvent | null;
  onClose: () => void;
}

export default function EventLeadModal({ event, onClose }: EventLeadModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/event-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          event_id: event.id,
          event_title: event.title,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit interest.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Communication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#140826] border border-purple-800/80 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-black text-white">Interest Recorded!</h4>
            <p className="text-xs text-purple-200/80 mt-2">
              We&apos;ve added you to the guestlist alerts for <span className="text-amber-300 font-bold">{event.title}</span>. You&apos;ll receive location and timing updates via WhatsApp.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-4">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-1">
                Event Guestlist Alert
              </span>
              <h4 className="text-xl font-black text-white">{event.title}</h4>
              <div className="flex items-center justify-center gap-3 text-xs text-purple-300/80 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-amber-400" />{event.date_text}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-purple-400" />{event.location}</span>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <p className="text-[10px] text-purple-300/70">
                You will only be contacted regarding details and schedule for this event.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm My Interest'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
