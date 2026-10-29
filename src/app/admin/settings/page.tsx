'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Upload, 
  Save, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  Check, 
  QrCode, 
  Flame 
} from 'lucide-react';
import { StallSettings } from '@/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StallSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [isEventMode, setIsEventMode] = useState(false);
  const [stallName, setStallName] = useState('');
  const [themeSubtext, setThemeSubtext] = useState('');
  const [banner, setBanner] = useState('');
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [pausedMessage, setPausedMessage] = useState('');
  const [maxQueueCap, setMaxQueueCap] = useState(60);
  const [autoNoshowMinutes, setAutoNoshowMinutes] = useState(5);
  const [upiId, setUpiId] = useState('');
  const [upiQrFile, setUpiQrFile] = useState<File | null>(null);
  const [currentQrUrl, setCurrentQrUrl] = useState('');
  const [allowPayLater, setAllowPayLater] = useState(false);
  const [whatsappHelpline, setWhatsappHelpline] = useState('');
  const [disclaimerText, setDisclaimerText] = useState('');

  // Danger zone
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const json = await res.json();
        const s = json.settings;
        setSettings(s);
        setIsEventMode(Boolean(s.is_event_mode));
        setStallName(s.stall_name);
        setThemeSubtext(s.theme_subtext);
        setBanner(s.announcement_banner);
        setIsQueueOpen(s.is_queue_open);
        setPausedMessage(s.queue_paused_message);
        setMaxQueueCap(s.max_queue_cap);
        setAutoNoshowMinutes(s.auto_noshow_minutes);
        setUpiId(s.upi_id);
        setCurrentQrUrl(s.upi_qr_url);
        setAllowPayLater(s.allow_pay_later);
        setWhatsappHelpline(s.whatsapp_helpline);
        setDisclaimerText(s.disclaimer_text);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('is_event_mode', String(isEventMode));
      formData.append('stall_name', stallName);
      formData.append('theme_subtext', themeSubtext);
      formData.append('announcement_banner', banner);
      formData.append('is_queue_open', String(isQueueOpen));
      formData.append('queue_paused_message', pausedMessage);
      formData.append('max_queue_cap', String(maxQueueCap));
      formData.append('auto_noshow_minutes', String(autoNoshowMinutes));
      formData.append('upi_id', upiId);
      formData.append('allow_pay_later', String(allowPayLater));
      formData.append('whatsapp_helpline', whatsappHelpline);
      formData.append('disclaimer_text', disclaimerText);

      if (upiQrFile) {
        formData.append('upi_qr_file', upiQrFile);
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Stall settings saved successfully!');
        fetchSettings();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save settings');
      }
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmation !== 'RESET-EVENT-SSPU-CONFIRM') {
      alert('You must type the confirmation phrase exactly.');
      return;
    }

    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: resetConfirmation }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Live event queue and payments reset clean!');
        setResetConfirmation('');
      } else {
        alert(data.error || 'Reset failed');
      }
    } finally {
      setResetting(false);
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
    <div className="space-y-8 max-w-4xl">
      <div className="pb-3 border-b border-purple-900/50">
        <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-amber-400" />
          <span>Stall Settings & Branding</span>
        </h3>
        <p className="text-xs text-purple-300/80">Everything business-related is editable live from here</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Master Operating Mode Switch */}
        <div className="bg-gradient-to-r from-purple-950/80 via-[#190933] to-purple-950/80 border-2 border-amber-500/50 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-1">
              Website Operating Mode
            </span>
            <h4 className="text-sm font-black text-white">
              {isEventMode ? 'Live Event Stall Mode (Active)' : 'Post-Event Landing & Online Booking Mode (Active)'}
            </h4>
            <p className="text-xs text-purple-200/80 mt-0.5 max-w-lg">
              {isEventMode
                ? 'Public home page is showing the Live Stall Queue Board and Walk-in registrations.'
                : 'Public home page is showing the new Post-Event Landing Site with Online Bookings, Card of the Day, and Contact options.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isEventMode}
              onChange={(e) => setIsEventMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-purple-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Stall Identity */}
        <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Stall Identity & Theming</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Stall Name *</label>
              <input
                type="text"
                required
                value={stallName}
                onChange={(e) => setStallName(e.target.value)}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">WhatsApp Helpline Number</label>
              <input
                type="text"
                value={whatsappHelpline}
                onChange={(e) => setWhatsappHelpline(e.target.value)}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Theme Subtitle</label>
            <input
              type="text"
              value={themeSubtext}
              onChange={(e) => setThemeSubtext(e.target.value)}
              className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Live Announcement Banner Text</label>
            <input
              type="text"
              placeholder="e.g. 🎃 Halloween Stall Special: Group reading gets instant ₹20 discount!"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs"
            />
          </div>
        </div>

        {/* UPI Payments Configuration */}
        <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>UPI Payments & Stall QR Image</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Merchant UPI ID (VPA) *</label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Current Active QR Image</label>
              <div className="flex items-center gap-3">
                <img
                  src={currentQrUrl}
                  alt="Current UPI QR"
                  className="w-12 h-12 rounded-lg object-contain bg-white p-0.5 border border-purple-700"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUpiQrFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-purple-300"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-200">
              <input
                type="checkbox"
                checked={allowPayLater}
                onChange={(e) => setAllowPayLater(e.target.checked)}
                className="rounded border-purple-800 text-amber-500 w-4 h-4"
              />
              <span>Allow "Pay-Later with Admin Approval" mode</span>
            </label>
          </div>
        </div>

        {/* Queue Rules */}
        <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Queue Rules & Timing</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Max Queue Capacity</label>
              <input
                type="number"
                min={10}
                max={200}
                value={maxQueueCap}
                onChange={(e) => setMaxQueueCap(Number(e.target.value))}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Auto No-show Timer (Minutes)</label>
              <input
                type="number"
                min={2}
                max={15}
                value={autoNoshowMinutes}
                onChange={(e) => setAutoNoshowMinutes(Number(e.target.value))}
                className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Queue Paused Message</label>
            <input
              type="text"
              value={pausedMessage}
              onChange={(e) => setPausedMessage(e.target.value)}
              className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Legal Entertainment Disclaimer</label>
            <textarea
              rows={2}
              value={disclaimerText}
              onChange={(e) => setDisclaimerText(e.target.value)}
              className="w-full bg-black/60 border border-purple-800 rounded-xl p-2.5 text-white text-xs leading-relaxed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-3 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>SAVE ALL SETTINGS LIVE</span>
        </button>
      </form>

      {/* Danger Zone Event Reset */}
      <div className="bg-red-950/30 border border-red-900/60 rounded-2xl p-5 shadow-lg space-y-4">
        <h4 className="text-xs font-black text-red-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>Danger Zone: Clear Event & Queue</span>
        </h4>
        <p className="text-xs text-red-200/80 leading-relaxed">
          Resetting the live event will clear all waiting tokens and payment transactions for a fresh event start, while preserving your services menu and settings.
        </p>

        <form onSubmit={handleResetEvent} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-red-200 mb-1">
              Type <strong className="text-white font-mono">RESET-EVENT-SSPU-CONFIRM</strong> to authorize:
            </label>
            <input
              type="text"
              placeholder="RESET-EVENT-SSPU-CONFIRM"
              value={resetConfirmation}
              onChange={(e) => setResetConfirmation(e.target.value)}
              className="w-full max-w-sm bg-black/80 border border-red-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={resetting || resetConfirmation !== 'RESET-EVENT-SSPU-CONFIRM'}
            className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-bold text-xs"
          >
            {resetting ? 'Resetting Event...' : 'CLEAR QUEUE & RESET EVENT'}
          </button>
        </form>
      </div>
    </div>
  );
}
