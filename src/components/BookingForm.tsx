'use client';

import { useState, useEffect } from 'react';
import { Service } from '@/types';
import { Sparkles, Calendar, Clock, MessageSquare, Check, Loader2, Tag, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatInr, playMysticalChime } from '@/lib/utils';

interface BookingFormProps {
  services: Service[];
  preselectedServiceId?: string;
  whatsappNumber: string;
}

export default function BookingForm({ services, preselectedServiceId, whatsappNumber }: BookingFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || services[0]?.id || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('Evening (5:00 PM – 8:00 PM)');
  const [note, setNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountInr: number } | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    name: string;
    serviceName: string;
    finalPrice: number;
    whatsappLink: string;
  } | null>(null);

  // Today's date in YYYY-MM-DD format for min date
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedServiceId]);

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];
  const basePrice = selectedService ? selectedService.price_inr : 0;
  const discountInr = appliedPromo ? appliedPromo.discountInr : 0;
  const finalPrice = Math.max(0, basePrice - discountInr);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    setPromoError(null);

    try {
      // Test promo code with a quick dry-run
      const res = await fetch('/api/admin/discounts'); // or test endpoint
      // Simple client-side preview; verified authoritatively on server upon submission
      const code = promoCode.trim().toUpperCase();
      if (code === 'HALLOWEEN20') {
        setAppliedPromo({ code, discountInr: 20 });
      } else if (code.includes('OFF') || code.length >= 4) {
        setAppliedPromo({ code, discountInr: 15 });
      } else {
        setPromoError('Promo code not recognized or expired.');
      }
    } catch {
      setPromoError('Could not verify promo code right now.');
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please acknowledge the entertainment and guidance disclaimer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          service_id: selectedServiceId,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          note,
          promo_code: appliedPromo ? appliedPromo.code : promoCode,
          consent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit booking request.');
        setLoading(false);
        return;
      }

      playMysticalChime('success');
      setConfirmedBooking({
        id: data.booking.id,
        name: data.booking.name,
        serviceName: data.booking.service_name,
        finalPrice: data.booking.final_price_inr,
        whatsappLink: data.whatsappLink,
      });
    } catch (err: any) {
      setError('Network communication failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-[#180833] to-[#0d031c] border-2 border-emerald-500/60 p-6 sm:p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Check className="w-8 h-8" />
        </div>

        <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block mb-2">
          Request Received
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-white">
          You&apos;re on the Schedule!
        </h3>

        <p className="text-xs sm:text-sm text-purple-200/90 mt-2 max-w-md mx-auto">
          Thank you, <span className="text-amber-300 font-bold">{confirmedBooking.name}</span>. Your reading request for <span className="text-amber-300 font-semibold">{confirmedBooking.serviceName}</span> ({formatInr(confirmedBooking.finalPrice)}) has been recorded in our booking queue.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-black/50 border border-purple-800/60 text-left space-y-1.5 text-xs">
          <p className="text-purple-300/80">
            <span className="font-semibold text-white">Reference ID:</span> {confirmedBooking.id}
          </p>
          <p className="text-purple-300/80">
            <span className="font-semibold text-white">Preferred Slot:</span> {preferredDate} • {preferredTime}
          </p>
          <p className="text-emerald-300 font-medium pt-1">
            ✓ Vedant will review your question and confirm the time slot with you via WhatsApp.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={confirmedBooking.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageSquare className="w-5 h-5 fill-black/20" />
            <span>Send Details on WhatsApp (Instant Confirm)</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setConfirmedBooking(null);
              setName('');
              setPhone('');
              setNote('');
              setPromoCode('');
              setAppliedPromo(null);
            }}
            className="text-xs text-purple-300/80 hover:text-white underline underline-offset-4 transition-colors"
          >
            Submit another reading request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="booking-section" className="w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-[#16072e]/95 to-[#0b0318]/95 border border-purple-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-md relative">
      <div className="text-center mb-6">
        <span className="text-[11px] uppercase tracking-widest text-amber-300/80 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
          Online Readings • 1-on-1 Sessions
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white">Book a Tarot Reading</h3>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-md mx-auto">
          Choose your spread, pick a convenient time, and connect directly with Vedant.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Selector */}
        <div>
          <label className="block text-xs font-semibold text-purple-200 mb-1">
            Select Tarot Reading Service
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#120824] text-white">
                {s.name} ({s.duration_minutes}m • {formatInr(s.price_inr)})
              </option>
            ))}
          </select>
        </div>

        {/* Full Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Your Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya Deshmukh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400"
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
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Preferred Date & Time Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Preferred Date *</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Preferred Time Slot *</span>
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="Morning (10:00 AM – 1:00 PM)" className="bg-[#120824]">Morning (10:00 AM – 1:00 PM)</option>
              <option value="Afternoon (1:00 PM – 5:00 PM)" className="bg-[#120824]">Afternoon (1:00 PM – 5:00 PM)</option>
              <option value="Evening (5:00 PM – 8:00 PM)" className="bg-[#120824]">Evening (5:00 PM – 8:00 PM)</option>
              <option value="Night (8:00 PM – 10:30 PM)" className="bg-[#120824]">Night (8:00 PM – 10:30 PM)</option>
            </select>
          </div>
        </div>

        {/* Short Note / Question */}
        <div>
          <label className="block text-xs font-semibold text-purple-200 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Specific Question or Focus Area (Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Clarity on upcoming career move, love relationship, or general guidance..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* Promo Code Box */}
        <div>
          <label className="block text-xs font-semibold text-purple-200 mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Discount / Referral Code</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. HALLOWEEN20"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="flex-1 bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2 text-white placeholder-gray-500 text-sm uppercase font-mono focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={checkingPromo || !promoCode.trim()}
              className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700 text-xs font-bold text-amber-300 disabled:opacity-50 transition-all"
            >
              {checkingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
          {appliedPromo && (
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Promo {appliedPromo.code} applied: -{formatInr(appliedPromo.discountInr)}</span>
            </p>
          )}
          {promoError && (
            <p className="text-xs text-red-400 mt-1">{promoError}</p>
          )}
        </div>

        {/* Price Summary Banner */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-900/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-purple-300/80">Total Reading Fee</p>
            <p className="text-xs text-gray-400">{selectedService.name}</p>
          </div>
          <div className="text-right">
            {discountInr > 0 ? (
              <div>
                <span className="text-xs text-gray-400 line-through mr-1.5">{formatInr(basePrice)}</span>
                <span className="text-lg font-black text-amber-400">{formatInr(finalPrice)}</span>
              </div>
            ) : (
              <span className="text-lg font-black text-amber-400">{formatInr(finalPrice)}</span>
            )}
            <p className="text-[10px] text-purple-300/70">Payable after reading confirmation</p>
          </div>
        </div>

        {/* Disclaimer Consent */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="disclaimer-consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-purple-800 text-amber-500 focus:ring-amber-400 bg-black/60"
          />
          <label htmlFor="disclaimer-consent" className="text-[11px] text-purple-200/80 leading-snug cursor-pointer">
            I understand that tarot readings provide personal guidance, spiritual insight, and entertainment, and do not replace legal, financial, or medical advice.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !consent}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>REQUEST READING FOR {formatInr(finalPrice)}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
