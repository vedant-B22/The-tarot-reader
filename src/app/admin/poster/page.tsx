'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, Moon, Sparkles, Compass, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPosterPage() {
  const [liveUrl, setLiveUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [stallName, setStallName] = useState('The Mystical Tarot');
  const [subtext, setSubtext] = useState('Step past the veil. Uncover love, destiny, and the unseen.');

  useEffect(() => {
    // Determine live URL
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://sspu-tarot.vercel.app';
    setLiveUrl(url);

    // Fetch settings for stall name
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setStallName(data.settings.stall_name);
          setThemeSubtext(data.settings.theme_subtext);
        }
      })
      .catch(() => {});

    // Generate high resolution QR code for crisp A4 paper print
    QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then(uri => setQrDataUrl(uri))
      .catch(err => console.error(err));
  }, []);

  const setThemeSubtext = (text: string) => {
    if (text) setSubtext(text);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print flex items-center justify-between pb-3 border-b border-purple-900/50">
        <div>
          <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Printable A4 Stall QR Poster</span>
          </h3>
          <p className="text-xs text-purple-300/80">Print and display this sheet at the live stall entrance and reading tables</p>
        </div>

        <button
          onClick={handlePrint}
          className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT POSTER (A4)</span>
        </button>
      </div>

      {/* Poster Canvas Preview */}
      <div className="flex justify-center p-2 sm:p-6">
        <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-12 rounded-3xl shadow-2xl flex flex-col items-center justify-between text-center border-8 border-[#1a0c2c]">
          {/* Header */}
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-[#1a0c2c] text-amber-400 flex items-center justify-center mb-3 shadow-md">
              <Moon className="w-9 h-9 fill-amber-400" />
            </div>

            <div className="text-xs font-black tracking-widest uppercase text-purple-900 mb-1">
              🎃 SSPU PUNE • HALLOWEEN 2026 LIVE EVENT
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight uppercase font-serif mb-2">
              {stallName}
            </h1>

            <p className="text-sm sm:text-base text-gray-700 max-w-md font-medium leading-snug">
              {subtext}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="my-6 p-4 sm:p-6 bg-purple-50 rounded-3xl border-4 border-[#1a0c2c] shadow-xl flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Scan to join live queue"
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-2xl"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-2xl flex items-center justify-center">
                Generating QR...
              </div>
            )}

            <div className="mt-3 font-mono text-xs sm:text-sm font-bold text-gray-900 bg-white px-4 py-1.5 rounded-full border border-gray-300">
              {liveUrl}
            </div>
          </div>

          {/* Customer Instructions */}
          <div className="w-full max-w-lg space-y-3">
            <div className="text-xl sm:text-2xl font-black text-purple-950 uppercase tracking-wide">
              Scan With Your Phone Camera
            </div>

            <div className="grid grid-cols-3 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-purple-100/70 border border-purple-200">
                <div className="font-black text-xs text-purple-900 mb-0.5">1. SCAN & PICK</div>
                <div className="text-[10px] text-gray-600 leading-tight">Choose your tarot reading & focus question</div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-100/70 border border-purple-200">
                <div className="font-black text-xs text-purple-900 mb-0.5">2. PAY UPI/CASH</div>
                <div className="text-[10px] text-gray-600 leading-tight">Pay instantly & secure your token</div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-100/70 border border-purple-200">
                <div className="font-black text-xs text-purple-900 mb-0.5">3. LIVE QUEUE</div>
                <div className="text-[10px] text-gray-600 leading-tight">Track live wait time on your phone</div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-200">
              For entertainment and guidance purposes • Symbiosis Skills & Professional University
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
