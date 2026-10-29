import Link from 'next/link';
import { 
  getSettings, 
  getAllServices, 
  getActiveQueueTokens, 
  getLiveMetrics, 
  getAllReaders,
  getAllTestimonials,
  getAllUpcomingEvents,
  getAllGalleryImages
} from '@/lib/db';
import { calculateEstimatedWait, formatInr } from '@/lib/utils';
import { Sparkles, Moon, Clock, Users, ArrowRight, ShieldAlert, Compass, Eye, Heart, BookOpen, Flame } from 'lucide-react';
import OfflineBanner from '@/components/OfflineBanner';
import CustomerTokenLookupModal from '@/components/CustomerTokenLookupModal';
import LandingPageClient from '@/components/LandingPageClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = getSettings();
  const services = getAllServices(true);

  // If NOT in live stall event mode, render the rich Post-Event Landing & Booking experience!
  if (!settings.is_event_mode) {
    const testimonials = getAllTestimonials(true);
    const events = getAllUpcomingEvents(true);
    const gallery = getAllGalleryImages();

    return (
      <LandingPageClient
        settings={settings}
        services={services}
        testimonials={testimonials}
        events={events}
        gallery={gallery}
      />
    );
  }

  // --- LIVE EVENT QUEUE MODE (Can be toggled back on anytime in Admin Settings) ---
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
            <p className="text-[11px] text-purple-300/80 font-mono">Live Stall Queue Mode</p>
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
          <span>Live Festival Stall Queue</span>
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
                <div className="text-2xl font-black text-amber-300">
                  {waitEst.label}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {readers.length} {readers.length === 1 ? 'reader active' : 'readers active'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center">
              <div className="inline-flex p-2 rounded-full bg-amber-500/10 text-amber-400 mb-2">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <p className="text-xs text-amber-200 font-semibold mb-1">Queue Is Temporarily Paused</p>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">{settings.queue_paused_message}</p>
            </div>
          )}
        </div>

        {/* Big Action Button */}
        {settings.is_queue_open ? (
          <Link
            href="/register"
            className="w-full max-w-sm py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-base tracking-wide shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>JOIN THE LIVE QUEUE</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <div className="w-full max-w-sm py-3.5 px-4 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs text-center font-medium">
            Queue registrations are on hold. Check back in a few minutes.
          </div>
        )}
      </section>

      {/* Services List */}
      <section className="px-4 py-8 max-w-xl mx-auto w-full">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>Available Tarot Readings</span>
        </h3>
        <p className="text-xs text-purple-300/80 mb-4">Choose your spread and step into the veil.</p>

        <div className="space-y-3">
          {services.map((service) => (
            <div 
              key={service.id}
              className="p-4 rounded-2xl bg-[#140827]/80 border border-purple-900/60 hover:border-amber-500/40 transition-colors shadow-lg flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-white">{service.name}</span>
                  {service.is_group && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-800/60 text-amber-300 font-semibold border border-purple-700">
                      Group (2+)
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-200/70 mb-2 leading-relaxed">{service.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-purple-400/80 font-mono">
                  <span>{service.card_count} {service.card_count === 1 ? 'Card' : 'Cards'}</span>
                  <span>•</span>
                  <span>~{service.duration_minutes} Mins</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-amber-400">{formatInr(service.price_inr)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-purple-900/40 bg-black/60 px-4 py-6 text-center text-xs text-purple-300/60">
        <p className="mb-1">{settings.stall_name} • Live Event</p>
        <p className="text-[10px] max-w-md mx-auto leading-relaxed text-purple-400/50">
          {settings.disclaimer_text}
        </p>
      </footer>
    </div>
  );
}
