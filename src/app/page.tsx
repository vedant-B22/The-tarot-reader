import Link from 'next/link';
import { 
  getSettings, 
  getAllServices, 
  getActiveQueueTokens, 
  getLiveMetrics, 
  getAllReaders 
} from '@/lib/db';
import { calculateEstimatedWait, formatInr } from '@/lib/utils';
import { Sparkles, Moon, Clock, Users, ArrowRight, ShieldAlert, Compass, Eye, Heart, BookOpen, Flame } from 'lucide-react';
import OfflineBanner from '@/components/OfflineBanner';
import CustomerTokenLookupModal from '@/components/CustomerTokenLookupModal';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = getSettings();
  const services = getAllServices(true);
  const activeTokens = getActiveQueueTokens();
  const waitingTokens = activeTokens.filter(t => t.status === 'waiting');
  const inSessionTokens = activeTokens.filter(t => t.status === 'in_session');
  const metrics = getLiveMetrics();
  const readers = getAllReaders().filter(r => r.is_active);

  const waitEst = calculateEstimatedWait(
    waitingTokens.length + 1,
    metrics.avgSessionMinutes,
    readers.length
  );

  return (
    <div className="flex flex-col min-h-screen">
      <OfflineBanner />

      {/* Live Announcement Banner */}
      {settings.announcement_banner && (
        <div className="bg-gradient-to-r from-purple-950 via-amber-950 to-purple-950 border-b border-amber-600/30 text-amber-200 text-xs sm:text-sm px-4 py-2.5 text-center font-medium shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{settings.announcement_banner}</span>
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-4 border-b border-purple-900/40 bg-black/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-purple-600 p-0.5 shadow-lg shadow-purple-900/50">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Moon className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg tracking-wide text-amber-100 flex items-center gap-1.5">
              <span>{settings.stall_name}</span>
            </h1>
            <p className="text-[11px] text-purple-300/80 font-mono">SSPU Pune • Live Stall</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CustomerTokenLookupModal />
          <Link 
            href="/admin/login" 
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-purple-800/60 text-purple-300 hover:text-amber-200 hover:border-amber-500/50 transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-8 pb-6 text-center max-w-xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/50 text-amber-300 text-xs font-semibold mb-4">
          <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          <span>Halloween Mystic Event 2026</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          What Do The Cards <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-500">Reveal</span> About You?
        </h2>

        <p className="text-sm text-purple-200/90 leading-relaxed mb-6 max-w-md">
          {settings.theme_subtext}
        </p>

        {/* Live Queue Status Pill */}
        <div className="w-full max-w-sm rounded-2xl bg-black/50 border border-purple-800/50 p-4 shadow-xl backdrop-blur-sm mb-6">
          {settings.is_queue_open ? (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30">
                <div className="flex items-center justify-center gap-1 text-purple-300 text-xs mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>In Queue</span>
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {waitingTokens.length}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {waitingTokens.length === 0 ? 'No waiting line' : waitingTokens.length === 1 ? '1 person waiting' : `${waitingTokens.length} people waiting`}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30">
                <div className="flex items-center justify-center gap-1 text-purple-300 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Est. Wait</span>
                </div>
                <div className="text-xl font-black text-amber-300 truncate">
                  {waitEst.label}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {readers.length} {readers.length === 1 ? 'reader active' : 'readers active'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center">
              <div className="inline-flex items-center gap-1 text-amber-400 font-semibold text-sm mb-1">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                <span>Queue Temporarily Paused</span>
              </div>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                {settings.queue_paused_message}
              </p>
            </div>
          )}
        </div>

        {/* Join Queue CTA */}
        {settings.is_queue_open ? (
          <Link
            href="/register"
            className="w-full max-w-sm py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black font-extrabold text-base tracking-wide shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group min-h-[52px]"
          >
            <span>JOIN THE QUEUE & PAY</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <button
            disabled
            className="w-full max-w-sm py-3.5 px-6 rounded-2xl bg-gray-800 text-gray-400 font-semibold text-sm cursor-not-allowed border border-gray-700"
          >
            Queue Paused By Reader
          </button>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-purple-300/70">
          <Link href="/display" className="underline hover:text-amber-300 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>View Stall Live Display TV</span>
          </Link>
        </div>
      </section>

      {/* Service Menu Section */}
      <section className="px-4 py-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Available Tarot Readings</span>
            </h3>
            <p className="text-xs text-purple-300/80">Prices and durations set live by the stall readers</p>
          </div>
        </div>

        <div className="grid gap-3.5">
          {services.map((service) => (
            <div
              key={service.id}
              className="tarot-card rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
            >
              {service.is_group && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-600 to-purple-600 text-[10px] font-extrabold text-white px-3 py-0.5 rounded-bl-xl uppercase tracking-wider shadow-md">
                  Best Value Duo
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-bold text-base text-amber-100 flex items-center gap-1.5">
                    {service.name}
                  </h4>
                  <p className="text-xs text-purple-200/80 leading-relaxed mt-1">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-purple-900/30 text-xs">
                <div className="flex items-center gap-3 text-purple-300">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>{service.card_count} {service.card_count === 1 ? 'Card' : 'Cards'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>~{service.duration_minutes} mins</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-amber-300">
                    {formatInr(service.price_inr)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer and Info Footer */}
      <footer className="mt-auto px-4 py-8 border-t border-purple-950 bg-black/60 text-center text-xs text-purple-300/60 max-w-xl mx-auto">
        <p className="leading-relaxed mb-3">
          {settings.disclaimer_text}
        </p>
        <p className="text-[11px] text-purple-400/50">
          Symbiosis Skills & Professional University (SSPU), Pune • Halloween 2026 Live Event
        </p>
      </footer>
    </div>
  );
}
