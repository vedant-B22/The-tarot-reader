'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Service, StallSettings } from '@/types';
import { formatInr, generateUpiUrl, compressImage, playMysticalChime } from '@/lib/utils';
import { 
  Heart, 
  Briefcase, 
  Compass, 
  Sparkles, 
  HelpCircle, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  QrCode, 
  Banknote,
  ExternalLink,
  BookOpen,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface Props {
  services: Service[];
  settings: StallSettings;
}

export default function RegisterFormClient({ services, settings }: Props) {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [courseYear, setCourseYear] = useState('');
  const [serviceId, setServiceId] = useState<string>(services[0]?.id || '');
  const [focusTopic, setFocusTopic] = useState<'love' | 'career' | 'life' | 'general' | 'other'>('general');
  const [customFocusText, setCustomFocusText] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi_qr' | 'cash'>('upi_qr');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = services.find(s => s.id === serviceId) || services[0];

  // Dynamic estimated client price for instant feedback (server re-verifies!)
  const basePrice = selectedService?.price_inr || 0;
  let estimatedDiscount = 0;
  if (selectedService?.is_group && settings.group_discount_inr > 0) {
    estimatedDiscount += settings.group_discount_inr;
  }
  let estimatedReferral = 0;
  if (referralCode.trim().length >= 4) {
    estimatedReferral = settings.referee_discount_inr;
  }
  const estimatedFinal = Math.max(0, basePrice - estimatedDiscount - estimatedReferral);

  const upiIntentUrl = generateUpiUrl({
    pa: settings.upi_id,
    pn: settings.stall_name,
    am: estimatedFinal,
    tn: `Tarot-${selectedService?.name || 'Reading'}`,
  });

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    if (!courseYear.trim()) {
      setError('Please enter your college course & year.');
      return;
    }

    if (!consent) {
      setError('Please agree to the entertainment disclaimer and stall guidelines.');
      return;
    }

    if (paymentMethod === 'upi_qr') {
      if (!screenshotFile) {
        setError('Please upload your UPI payment confirmation screenshot.');
        return;
      }
      if (!utrNumber.trim() || utrNumber.trim().length < 6) {
        setError('Please enter your 12-digit UPI UTR / Transaction reference number.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', cleanPhone);
      formData.append('course_year', courseYear.trim());
      formData.append('service_id', serviceId);
      formData.append('focus_topic', focusTopic);
      if (customFocusText) formData.append('custom_focus_text', customFocusText.trim());
      formData.append('payment_method', paymentMethod);
      if (discountCode) formData.append('discount_code', discountCode.trim());
      if (referralCode) formData.append('referral_code', referralCode.trim());
      formData.append('consent', 'true');

      if (paymentMethod === 'upi_qr') {
        if (!screenshotFile) {
          setError('Please upload your UPI payment confirmation screenshot.');
          setSubmitting(false);
          return;
        }

        formData.append('utr_number', utrNumber.trim());

        // Compress image on client to ~80-150KB for fast college 4G upload
        const { blob, hash } = await compressImage(screenshotFile);
        formData.append('screenshot', blob, 'screenshot.jpg');
        formData.append('screenshot_hash', hash);
      }

      const res = await fetch('/api/customer/register', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please check inputs.');
        setSubmitting(false);
        return;
      }

      playMysticalChime('success');
      router.push(`/token/${data.token.id}`);
    } catch (err: any) {
      setError(err.message || 'Network error occurred during registration. Please retry.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Personal Details */}
      <div className="bg-[#130a24] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black inline-flex items-center justify-center">1</span>
          <span>Your Details</span>
        </h3>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-purple-200/90 mb-1">
              Full Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-purple-200/90 mb-1">
                WhatsApp Phone <span className="text-amber-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm tracking-wide"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200/90 mb-1">
                Course & Year <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. B.Tech 3rd Yr / MBA"
                value={courseYear}
                onChange={(e) => setCourseYear(e.target.value)}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Service Selection */}
      <div className="bg-[#130a24] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black inline-flex items-center justify-center">2</span>
          <span>Choose Tarot Reading</span>
        </h3>

        <div className="space-y-2.5">
          {services.map((s) => {
            const isSelected = serviceId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`cursor-pointer rounded-xl p-3.5 transition-all border ${
                  isSelected
                    ? 'tarot-card-selected bg-purple-950/60'
                    : 'bg-black/40 border-purple-900/40 hover:border-purple-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-100">{s.name}</span>
                      {s.is_group && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                          Duo Special
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-purple-300/80 mt-0.5">{s.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-purple-300/60 mt-1.5">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        <span>{s.card_count} {s.card_count === 1 ? 'Card' : 'Cards'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>~{s.duration_minutes} mins</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-base text-amber-300">
                      {formatInr(s.price_inr)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Focus Topic */}
      <div className="bg-[#130a24] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black inline-flex items-center justify-center">3</span>
          <span>Focus Area (Optional)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {[
            { id: 'love', label: 'Love & Crush', icon: Heart, color: 'text-rose-400' },
            { id: 'career', label: 'Career & Exams', icon: Briefcase, color: 'text-blue-400' },
            { id: 'life', label: 'Destiny & Life', icon: Compass, color: 'text-emerald-400' },
            { id: 'general', label: 'General / Aura', icon: Sparkles, color: 'text-amber-400' },
            { id: 'other', label: 'Specific Question', icon: HelpCircle, color: 'text-purple-400' },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = focusTopic === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setFocusTopic(item.id as any)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                  isSel
                    ? 'border-amber-400 bg-amber-400/10 text-amber-200 shadow-sm'
                    : 'border-purple-900/50 bg-black/40 text-purple-300 hover:border-purple-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Optional: Write a specific question for the reader..."
          value={customFocusText}
          onChange={(e) => setCustomFocusText(e.target.value)}
          className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-xs"
        />
      </div>

      {/* Step 4: Discounts & Referrals */}
      <div className="bg-[#130a24] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black inline-flex items-center justify-center">4</span>
          <span>Codes & Offers</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-purple-200/90 mb-1">
              Discount Promo Code
            </label>
            <input
              type="text"
              placeholder="e.g. HALLOWEEN20"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-xs uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-purple-200/90 mb-1">
              Friend's Referral Code
            </label>
            <input
              type="text"
              placeholder="e.g. TAROT-XXXX"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-xs uppercase"
            />
          </div>
        </div>

        {/* Live Calculated Price Breakdown */}
        <div className="mt-4 p-3 rounded-xl bg-black/50 border border-purple-900/40 text-xs space-y-1.5">
          <div className="flex justify-between text-purple-300">
            <span>Base Service Price:</span>
            <span>{formatInr(basePrice)}</span>
          </div>

          {estimatedDiscount > 0 && (
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Automatic Deal / Group Discount:</span>
              <span>- {formatInr(estimatedDiscount)}</span>
            </div>
          )}

          {estimatedReferral > 0 && (
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Referral Code Discount:</span>
              <span>- {formatInr(estimatedReferral)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-extrabold text-amber-300 pt-2 border-t border-purple-900/40">
            <span>Final Payable Amount:</span>
            <span>{formatInr(estimatedFinal)}</span>
          </div>
        </div>
      </div>

      {/* Step 5: Payment Choice */}
      <div className="bg-[#130a24] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black inline-flex items-center justify-center">5</span>
          <span>Payment Method</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('upi_qr')}
            className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all min-h-[50px] ${
              paymentMethod === 'upi_qr'
                ? 'border-amber-400 bg-amber-400/15 text-amber-200 shadow-md'
                : 'border-purple-900/60 bg-black/40 text-purple-300 hover:border-purple-700'
            }`}
          >
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>Pay via UPI QR</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-all min-h-[50px] ${
              paymentMethod === 'cash'
                ? 'border-amber-400 bg-amber-400/15 text-amber-200 shadow-md'
                : 'border-purple-900/60 bg-black/40 text-purple-300 hover:border-purple-700'
            }`}
          >
            <Banknote className="w-5 h-5 text-amber-400" />
            <span>Pay Cash at Stall</span>
          </button>
        </div>

        {paymentMethod === 'upi_qr' ? (
          <div className="space-y-4 pt-2 border-t border-purple-900/40">
            <div className="text-center">
              <p className="text-xs text-purple-200/90 mb-2">
                Scan using any UPI App (PhonePe, GPay, Paytm) & pay exactly{' '}
                <strong className="text-amber-300">{formatInr(estimatedFinal)}</strong>
              </p>

              {/* UPI QR Display */}
              <div className="inline-block p-2 bg-white rounded-2xl shadow-xl border-2 border-amber-500/40">
                <img
                  src={settings.upi_qr_url}
                  alt="Stall UPI QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                />
              </div>

              <div className="mt-2">
                <a
                  href={upiIntentUrl}
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline font-medium py-1 px-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tap to open in UPI App directly (PhonePe / GPay)</span>
                </a>
              </div>
            </div>

            {/* UTR Input */}
            <div>
              <label className="block text-xs font-medium text-purple-200/90 mb-1">
                UPI Reference / UTR Number <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="12-digit UTR (from payment receipt)"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\s/g, ''))}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm tracking-wider font-mono"
              />
            </div>

            {/* Screenshot Upload with client-side compression */}
            <div>
              <label className="block text-xs font-medium text-purple-200/90 mb-1">
                Upload Payment Screenshot <span className="text-amber-400">*</span>
              </label>
              <label className="border-2 border-dashed border-purple-800/80 hover:border-amber-400/80 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-black/40 transition-colors">
                {screenshotPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={screenshotPreview}
                      alt="Payment Preview"
                      className="max-h-32 rounded-lg object-contain border border-purple-700/50"
                    />
                    <span className="text-xs text-amber-300 font-medium">Click to change screenshot</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center py-2">
                    <Upload className="w-6 h-6 text-amber-400" />
                    <span className="text-xs text-purple-200 font-semibold">Select screenshot from phone</span>
                    <span className="text-[10px] text-gray-400">Compressed automatically for fast 4G upload</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200/90 space-y-2">
            <p className="font-semibold text-amber-300 flex items-center gap-1">
              <Banknote className="w-4 h-4" />
              <span>Offline Cash Payment at Stall</span>
            </p>
            <p>
              Your token will be generated as <strong className="text-white">"Cash Pending"</strong>. Hand over{' '}
              <strong className="text-amber-300">{formatInr(estimatedFinal)}</strong> to the stall admin to activate your position in the line.
            </p>
          </div>
        )}
      </div>

      {/* Step 6: Disclaimer Consent */}
      <div className="p-3 rounded-xl bg-black/40 border border-purple-900/50">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 rounded border-purple-700 text-amber-500 focus:ring-amber-400 w-4 h-4 shrink-0"
          />
          <span className="text-[11px] text-purple-200/80 leading-snug">
            I agree that tarot card readings are for guidance and entertainment purposes only, and not professional legal, financial or medical advice.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black font-extrabold text-base tracking-wide shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[52px]"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>SECURING YOUR TOKEN & UPLOADING...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5" />
            <span>CONFIRM & GET QUEUE TOKEN ({formatInr(estimatedFinal)})</span>
          </>
        )}
      </button>
    </form>
  );
}
