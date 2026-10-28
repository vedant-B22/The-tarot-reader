import { getSettings, getAllServices } from '@/lib/db';
import RegisterFormClient from '@/components/RegisterFormClient';
import Link from 'next/link';
import { ChevronLeft, Moon } from 'lucide-react';
import OfflineBanner from '@/components/OfflineBanner';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const settings = getSettings();
  const services = getAllServices(true);

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
