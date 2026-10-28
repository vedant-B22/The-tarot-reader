'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Clock, 
  Users, 
  Moon, 
  MessageCircle, 
  Star, 
  Share2, 
  CheckCircle, 
  AlertTriangle, 
  BellRing, 
  XCircle, 
  Compass, 
  BookmarkCheck,
  Loader2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { formatInr, playMysticalChime } from '@/lib/utils';

export default function CustomerTokenLive({ initialTokenId }: { initialTokenId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  // Post session feedback state
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Poll / fetch data
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/customer/token/${initialTokenId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // Sound alert & vibration if transitioned to called
        if (prevStatusRef.current && prevStatusRef.current !== 'called' && json.token.status === 'called') {
          playMysticalChime('alert');
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🔮 Your Tarot Turn Is Up!', {
              body: `Please proceed immediately to ${json.token.assigned_reader_name || 'the stall table'}.`,
            });
          }
        }
        prevStatusRef.current = json.token.status;
      }
    } catch (err) {
      console.warn('Token sync warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 1. Server-Sent Events for instant live update
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');
      eventSource.addEventListener('queue_update', () => fetchData());
      eventSource.addEventListener('token_called', () => fetchData());
      eventSource.addEventListener('payment_verified', () => fetchData());
    } catch (e) {
      console.warn('SSE not supported, falling back to polling');
    }

    // 2. Resilient Polling Fallback every 6 seconds for weak college Wi-Fi
    const interval = setInterval(fetchData, 6000);

    // Request notification permission if supported
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [initialTokenId]);

  const handleCancelToken = async () => {
    if (!confirm('Are you sure you want to cancel your queue token?')) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/customer/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: initialTokenId }),
      });
      if (res.ok) {
        fetchData();
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/customer/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: initialTokenId, stars, comment }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        playMysticalChime('success');
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm text-purple-200">Connecting to live stall queue...</p>
      </div>
    );
  }

  const { token, wait_estimate, stall } = data || {};
  if (!token) return null;

  const isCalled = token.status === 'called';
  const isInSession = token.status === 'in_session';
  const isCompleted = token.status === 'completed';
  const isWaiting = token.status === 'waiting';
  const isCancelled = token.status === 'cancelled' || token.status === 'noshow';

  const whatsappShareText = encodeURIComponent(
    `🔮 I just experienced an amazing Tarot reading at the SSPU Halloween stall! Join the live queue here: ${typeof window !== 'undefined' ? window.location.origin : ''}`
  );

  return (
    <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col space-y-5">
      {/* Top Banner Alert when Called */}
      {isCalled && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-2xl animate-pulse flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BellRing className="w-7 h-7 text-black shrink-0 animate-bounce" />
            <div>
              <div className="font-black text-base uppercase tracking-wider">It's Your Turn Now!</div>
              <div className="text-xs font-semibold">
                Please proceed immediately to <span className="underline font-black">{token.assigned_reader_name || 'Table 1'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Token Badge Card */}
      <div className="tarot-card rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="text-xs uppercase tracking-widest text-purple-300 font-semibold mb-1 flex items-center justify-center gap-1.5">
          <Moon className="w-3.5 h-3.5 text-amber-400" />
          <span>{stall?.name || 'Tarot Reading Stall'}</span>
        </div>

        {/* Large Sequential Token Number */}
        <div className="py-2">
          <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 tracking-tight font-mono">
            {token.token_display}
          </div>
          <div className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider">
            {token.service_name}
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-inner">
          {isWaiting && (
            <span className="bg-purple-900/60 text-purple-200 border border-purple-600/50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>In Line: Position #{token.position}</span>
            </span>
          )}
          {isCalled && (
            <span className="bg-amber-500 text-black px-4 py-1.5 rounded-full flex items-center gap-1.5 font-black animate-bounce">
              <BellRing className="w-3.5 h-3.5" />
              <span>CALLED TO {token.assigned_reader_name || 'TABLE'}</span>
            </span>
          )}
          {isInSession && (
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reading In Session</span>
            </span>
          )}
          {isCompleted && (
            <span className="bg-purple-800 text-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Completed</span>
            </span>
          )}
          {isCancelled && (
            <span className="bg-red-950 text-red-300 border border-red-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{token.status === 'noshow' ? 'Marked No-Show' : 'Cancelled'}</span>
            </span>
          )}
        </div>

        {/* Real-Data Wait Time & Payment Info */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-purple-900/40 text-left">
          <div className="p-3 rounded-2xl bg-black/40 border border-purple-900/40">
            <div className="text-[10px] text-purple-300/80 uppercase font-semibold flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Est. Wait Time</span>
            </div>
            <div className="text-sm font-bold text-amber-100">
              {isWaiting ? wait_estimate?.label || 'Calculating...' : isCompleted ? 'Completed' : 'Now Serving'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-purple-900/40">
            <div className="text-[10px] text-purple-300/80 uppercase font-semibold flex items-center gap-1 mb-1">
              <BookmarkCheck className="w-3 h-3 text-amber-400" />
              <span>Payment</span>
            </div>
            <div className="text-sm font-bold text-amber-100 flex items-center gap-1">
              <span>{formatInr(token.final_amount_inr || 0)}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                token.payment_status === 'verified'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {token.payment_status || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Summary Card (Published by Reader) */}
      {isCompleted && token.reading_summary_published && (
        <div className="tarot-card rounded-2xl p-5 border-amber-500/40">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-3">
            <BookOpen className="w-4 h-4" />
            <span>Your Reading Summary & Cards Drawn</span>
          </div>

          {token.cards_drawn && token.cards_drawn.length > 0 && (
            <div className="space-y-2 mb-4">
              {token.cards_drawn.map((card: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-black/50 border border-purple-900/50">
                  <div className="font-bold text-xs text-amber-200">{card.card}</div>
                  <div className="text-[11px] text-purple-300/80 font-mono">{card.position}</div>
                  {card.interpretation && (
                    <div className="text-xs text-purple-100 mt-1 italic leading-relaxed">
                      "{card.interpretation}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {token.notes && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 leading-relaxed">
              <span className="font-semibold text-amber-300">Reader Notes: </span>
              {token.notes}
            </div>
          )}
        </div>
      )}

      {/* Post Session Feedback Review Card */}
      {isCompleted && !token.customer_feedback_stars && !feedbackSubmitted && (
        <div className="tarot-card rounded-2xl p-5">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm mb-2">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>Rate Your Tarot Reading Experience</span>
          </div>

          <p className="text-xs text-purple-200/80 mb-4">
            How accurate and insightful was your session with our reader?
          </p>

          <form onSubmit={handleFeedbackSubmit} className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((starVal) => (
                <button
                  type="button"
                  key={starVal}
                  onClick={() => setStars(starVal)}
                  className="p-1.5 text-amber-400 hover:scale-125 transition-transform"
                >
                  <Star className={`w-7 h-7 ${starVal <= stars ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Leave a short comment or testimonial..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-xs"
            />

            <button
              type="submit"
              disabled={submittingFeedback}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SUBMIT REVIEWS & FEEDBACK'}
            </button>
          </form>
        </div>
      )}

      {/* Share With Friends CTA */}
      {isCompleted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-amber-950 border border-amber-600/30 text-center">
          <h4 className="text-sm font-bold text-amber-200 mb-1 flex items-center justify-center gap-1.5">
            <Share2 className="w-4 h-4" />
            <span>Share With College Friends</span>
          </h4>
          <p className="text-xs text-purple-200/80 mb-3">
            Recommend the Tarot stall to your friends on WhatsApp!
          </p>

          <a
            href={`https://wa.me/?text=${whatsappShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] text-black font-bold text-xs hover:bg-[#20ba59] transition-colors shadow-lg"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>Share Stall Link on WhatsApp</span>
          </a>
        </div>
      )}

      {/* Helpful Quick Actions */}
      <div className="space-y-2 pt-2">
        {stall?.whatsapp && (
          <a
            href={`https://wa.me/${stall.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm at the Tarot Stall holding Token ${token.token_display}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-200 hover:text-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Need Help? WhatsApp Stall Organizer</span>
          </a>
        )}

        {isWaiting && (
          <button
            onClick={handleCancelToken}
            disabled={cancelling}
            className="w-full py-2.5 text-xs text-red-400/80 hover:text-red-300 transition-colors"
          >
            {cancelling ? 'Cancelling...' : 'Cancel my queue token'}
          </button>
        )}
      </div>

      <div className="text-center pt-2">
        <Link href="/" className="text-xs text-purple-400/60 hover:text-amber-300">
          ← Return to Stall Home
        </Link>
      </div>
    </div>
  );
}
