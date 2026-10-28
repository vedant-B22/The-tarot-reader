'use client';

import { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit2, 
  Sparkles, 
  Users, 
  Clock, 
  Share2, 
  Check, 
  Loader2 
} from 'lucide-react';
import { formatInr } from '@/lib/utils';
import { DiscountCode, StallSettings } from '@/types';

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [settings, setSettings] = useState<StallSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState(20);
  const [minOrderInr, setMinOrderInr] = useState(0);
  const [maxDiscountInr, setMaxDiscountInr] = useState<number | ''>('');
  const [maxTotalUses, setMaxTotalUses] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  // Settings automatic discounts form fields
  const [firstTimerDiscount, setFirstTimerDiscount] = useState(0);
  const [groupDiscount, setGroupDiscount] = useState(20);
  const [happyHourEnabled, setHappyHourEnabled] = useState(false);
  const [happyHourStart, setHappyHourStart] = useState('17:00');
  const [happyHourEnd, setHappyHourEnd] = useState('19:00');
  const [happyHourPercent, setHappyHourPercent] = useState(15);
  const [referrerReward, setReferrerReward] = useState(25);
  const [refereeDiscount, setRefereeDiscount] = useState(15);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    try {
      const [discRes, setRes] = await Promise.all([
        fetch('/api/admin/discounts').then(r => r.json()),
        fetch('/api/admin/settings').then(r => r.json())
      ]);

      setDiscounts(discRes.discounts || []);
      const s = setRes.settings;
      if (s) {
        setSettings(s);
        setFirstTimerDiscount(s.first_timer_discount_inr || 0);
        setGroupDiscount(s.group_discount_inr || 20);
        setHappyHourEnabled(s.happy_hour_enabled || false);
        setHappyHourStart(s.happy_hour_start || '17:00');
        setHappyHourEnd(s.happy_hour_end || '19:00');
        setHappyHourPercent(s.happy_hour_percent || 15);
        setReferrerReward(s.referrer_reward_inr || 25);
        setRefereeDiscount(s.referee_discount_inr || 15);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCode(null);
    setCode('');
    setDiscountType('flat');
    setDiscountValue(20);
    setMinOrderInr(0);
    setMaxDiscountInr('');
    setMaxTotalUses('');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      min_order_inr: minOrderInr,
      max_discount_inr: maxDiscountInr === '' ? null : Number(maxDiscountInr),
      max_total_uses: maxTotalUses === '' ? null : Number(maxTotalUses),
      is_active: isActive,
    };

    try {
      const res = await fetch('/api/admin/discounts', {
        method: editingCode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCode ? { id: editingCode.id, ...payload } : payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save discount code');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleSaveSettingsRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_timer_discount_inr: firstTimerDiscount,
          group_discount_inr: groupDiscount,
          happy_hour_enabled: happyHourEnabled,
          happy_hour_start: happyHourStart,
          happy_hour_end: happyHourEnd,
          happy_hour_percent: happyHourPercent,
          referrer_reward_inr: referrerReward,
          referee_discount_inr: refereeDiscount,
        }),
      });
      if (res.ok) {
        alert('Rules updated successfully!');
        fetchData();
      }
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-purple-300">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Promo Codes List */}
      <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
          <div>
            <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Coupon & Promo Codes</span>
            </h3>
            <p className="text-xs text-purple-300/80">Active coupon codes redeemable at registration</p>
          </div>

          <button
            onClick={openCreateModal}
            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>

        <div className="grid gap-3">
          {discounts.length === 0 ? (
            <div className="p-6 text-center text-purple-300/60 text-xs font-semibold">
              No discount codes created yet. Click above to add one.
            </div>
          ) : (
            discounts.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl bg-black/40 border border-purple-900/40 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-300 text-sm tracking-wider">{d.code}</span>
                    <span className="text-[10px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded font-bold uppercase">
                      {d.discount_type === 'percent' ? `${d.discount_value}% OFF` : `₹${d.discount_value} FLAT`}
                    </span>
                    {!d.is_active && (
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1 rounded">Inactive</span>
                    )}
                  </div>
                  <div className="text-[11px] text-purple-300/80 mt-1 font-mono">
                    Used: {d.current_uses} {d.max_total_uses ? `/ ${d.max_total_uses} max` : 'times'} • Min Order: {formatInr(d.min_order_inr)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingCode(d);
                    setCode(d.code);
                    setDiscountType(d.discount_type);
                    setDiscountValue(d.discount_value);
                    setMinOrderInr(d.min_order_inr);
                    setMaxDiscountInr(d.max_discount_inr || '');
                    setMaxTotalUses(d.max_total_uses || '');
                    setIsActive(d.is_active);
                    setModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-200 text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Automatic Deals & Referral Rules Form */}
      <form onSubmit={handleSaveSettingsRules} className="bg-[#120824] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-5">
        <div className="pb-3 border-b border-purple-900/50">
          <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Automatic Discounts & Referral Program</span>
          </h3>
          <p className="text-xs text-purple-300/80">Rules applied automatically by the system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Automatic Deals */}
          <div className="space-y-4 p-4 rounded-xl bg-black/40 border border-purple-900/30">
            <div className="font-bold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Automatic Deal Rules</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                Group / Duo Besties Discount (₹ INR)
              </label>
              <input
                type="number"
                min={0}
                value={groupDiscount}
                onChange={(e) => setGroupDiscount(Number(e.target.value))}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-gray-400">Discount deducted automatically when group reading is picked</span>
            </div>

            <div className="pt-2 border-t border-purple-900/30 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-purple-200">
                <input
                  type="checkbox"
                  checked={happyHourEnabled}
                  onChange={(e) => setHappyHourEnabled(e.target.checked)}
                  className="rounded border-purple-800 text-amber-500 w-4 h-4"
                />
                <span>Enable Time-Based "Happy Hour" Deal</span>
              </label>

              {happyHourEnabled && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-purple-300">Start (HH:MM)</label>
                    <input
                      type="text"
                      value={happyHourStart}
                      onChange={(e) => setHappyHourStart(e.target.value)}
                      className="w-full bg-black/60 border border-purple-800 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-300">End (HH:MM)</label>
                    <input
                      type="text"
                      value={happyHourEnd}
                      onChange={(e) => setHappyHourEnd(e.target.value)}
                      className="w-full bg-black/60 border border-purple-800 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-300">Discount %</label>
                    <input
                      type="number"
                      value={happyHourPercent}
                      onChange={(e) => setHappyHourPercent(Number(e.target.value))}
                      className="w-full bg-black/60 border border-purple-800 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Referral System */}
          <div className="space-y-4 p-4 rounded-xl bg-black/40 border border-purple-900/30">
            <div className="font-bold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>Customer Referral System</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                Friend Discount (Referee Benefit in ₹)
              </label>
              <input
                type="number"
                min={0}
                value={refereeDiscount}
                onChange={(e) => setRefereeDiscount(Number(e.target.value))}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-gray-400">Instant discount for friend entering referral code</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                Referrer Reward (Wallet Credits in ₹)
              </label>
              <input
                type="number"
                min={0}
                value={referrerReward}
                onChange={(e) => setReferrerReward(Number(e.target.value))}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-gray-400">Awarded to referring customer when reading is completed</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all"
        >
          {savingSettings ? 'Saving Rules...' : 'Save Discount & Referral Rules'}
        </button>
      </form>

      {/* Modal for Promo Code */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-purple-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-amber-200 mb-3">
              {editingCode ? 'Edit Coupon Code' : 'Create New Coupon Code'}
            </h3>

            <form onSubmit={handleSaveDiscount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSPUMAGIC"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs uppercase font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="flat">Flat ₹ INR</option>
                    <option value="percent">Percent %</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderInr}
                    onChange={(e) => setMinOrderInr(Number(e.target.value))}
                    className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Max Total Uses</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited if blank"
                    value={maxTotalUses}
                    onChange={(e) => setMaxTotalUses(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-200">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-purple-800 text-amber-500 w-4 h-4"
                  />
                  <span>Active & Redeemable</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
