'use client';

import { useState } from 'react';
import { MessageCircle, Phone, Copy, Check, UserCheck, Sparkles, Compass } from 'lucide-react';
import InstagramIcon from '@/components/icons/InstagramIcon';

interface ContactCardProps {
  whatsappNumber: string;
  instagramHandle: string;
  tarotHandle: string;
}

export default function ContactCard({ whatsappNumber, instagramHandle, tarotHandle }: ContactCardProps) {
  const [copied, setCopied] = useState(false);

  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '');

  const trackClick = async (eventKey: string) => {
    try {
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_key: eventKey }),
      });
    } catch {}
  };

  const handleCopyPhone = () => {
    trackClick('copy_phone');
    navigator.clipboard.writeText(whatsappNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-[#180a32]/90 to-[#0e051e]/90 border border-purple-800/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Glow orb */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center mb-6">
        <span className="text-[11px] uppercase tracking-widest text-amber-300/80 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
          Direct Inquiries & Bookings
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-white">Connect with Vedant</h3>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
          Have a question about a spread or private reading? Reach out anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent("Hi Vedant, I'd like to ask about a tarot reading")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick('whatsapp_contact_card')}
          className="flex items-center justify-between sm:flex-col sm:justify-center p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-600/40 hover:border-emerald-500 text-emerald-200 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 sm:flex-col sm:text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5 fill-emerald-500/20" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-400/90 font-medium">WhatsApp</p>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">{whatsappNumber}</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 sm:mt-2">
            Tap to Chat ↗
          </span>
        </a>

        {/* Instagram Personal */}
        <a
          href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick('instagram_personal')}
          className="flex items-center justify-between sm:flex-col sm:justify-center p-4 rounded-2xl bg-pink-950/30 hover:bg-pink-900/30 border border-pink-700/40 hover:border-pink-500 text-pink-200 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 sm:flex-col sm:text-center">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-pink-400/90 font-medium">Instagram (Personal)</p>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">@{instagramHandle.replace('@', '')}</p>
            </div>
          </div>
          <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-1 rounded-full border border-pink-500/20 sm:mt-2">
            Follow ↗
          </span>
        </a>

        {/* Tarot Brand Handle */}
        <a
          href={`https://instagram.com/${tarotHandle.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick('instagram_tarot_page')}
          className="flex items-center justify-between sm:flex-col sm:justify-center p-4 rounded-2xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-600/40 hover:border-purple-500 text-purple-200 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 sm:flex-col sm:text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-purple-400/90 font-medium">Tarot Page</p>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">@{tarotHandle.replace('@', '')}</p>
            </div>
          </div>
          <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20 sm:mt-2">
            Explore ↗
          </span>
        </a>
      </div>

      {/* Utility Action Buttons: Copy & vCard */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-purple-900/50">
        <button
          type="button"
          onClick={handleCopyPhone}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/60 text-purple-200 text-xs font-semibold transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-bold">Number Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Copy Phone Number</span>
            </>
          )}
        </button>

        <a
          href="/api/vcard"
          onClick={() => trackClick('vcard_download')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all active:scale-95 shadow-md"
        >
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>Save Contact (vCard)</span>
        </a>
      </div>
    </div>
  );
}
