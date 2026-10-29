import { getSettings, getAllServices } from '@/lib/db';
import RegisterFormClient from '@/components/RegisterFormClient';
import Link from 'next/link';
import { ChevronLeft, Moon } from 'lucide-react';
import OfflineBanner from '@/components/OfflineBanner';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const settings = getSettings();
  const services = getAllServices(true);

  if (!settings.is_event_mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <OfflineBanner />
        <div className="w-full max-w-md rounded-3xl bg-[#140827] border border-purple-800/80 p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Moon className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
            Event Concluded
          </span>
          <h2 className="text-2xl font-black text-white">Halloween Live Stall is Over</h2>
          <p className="text-xs text-purple-200/80 mt-2 leading-relaxed">
            Thank you to everyone who visited our stall! The live queue registration has closed, but personal 1-on-1 tarot readings and spreads are now open for online booking.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href="/"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Go to Online Booking Page</span>
            </Link>
            <Link
              href="/#contact-section"
              className="block text-xs text-purple-300 hover:text-white underline underline-offset-4"
            >
              Contact Vedant on WhatsApp
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OfflineBanner />

      {/* Top Navbar */}
      <header className="px-4 py-3.5 border-b border-purple-900/40 bg-black/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-amber-300 transition-colors py-1 px-2 -ml-2 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Stall</span>
        </Link>

        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-200">Join Live Queue</span>
        </div>

        <div className="w-16" />
      </header>

      {/* Main Registration Form Container */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Tarot Reading Registration
          </h2>
          <p className="text-xs text-purple-200/80 mt-1">
            Pick your reading, pay via UPI QR or Cash, and get your live queue token.
          </p>
        </div>

        <RegisterFormClient 
          services={services} 
          settings={settings} 
        />
      </main>
    </div>
  );
}
