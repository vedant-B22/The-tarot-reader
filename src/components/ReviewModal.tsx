'use client';

import { useState } from 'react';
import { Star, MessageSquare, X, Check, Loader2 } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const [name, setName] = useState('');
  const [service, setService] = useState('Personal Tarot Reading');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          service_name: service,
          rating,
          feedback_text: feedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit review.');
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
            <h4 className="text-xl font-black text-white">Review Submitted!</h4>
            <p className="text-xs text-purple-200/80 mt-2">
              Thank you for sharing your experience with Vedant. Your review will be published upon moderation.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-5">
              <h4 className="text-xl font-black text-white">Share Your Experience</h4>
              <p className="text-xs text-purple-200/80 mt-1">
                How was your reading with Vedant? Your honest feedback helps others find clarity.
              </p>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Star Selector */}
              <div className="flex items-center justify-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-purple-800 fill-transparent'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Riya K."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Reading Type</label>
                <input
                  type="text"
                  placeholder="e.g. Destiny Card, Love Specific, or Duo Reading"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Your Review *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="How did the reading resonate with you? Was it insightful or accurate?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
