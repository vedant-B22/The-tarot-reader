'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  Moon, 
  MessageCircle, 
  Compass, 
  Star, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Heart, 
  Flame, 
  Eye, 
  Check, 
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import InstagramIcon from '@/components/icons/InstagramIcon';
import { StallSettings, Service, Testimonial, UpcomingEvent, GalleryImage } from '@/types';
import { formatInr } from '@/lib/utils';
import ContactCard from '@/components/ContactCard';
import BookingForm from '@/components/BookingForm';
import CardOfTheDay from '@/components/CardOfTheDay';
import NewsletterOptIn from '@/components/NewsletterOptIn';
import ReviewModal from '@/components/ReviewModal';
import EventLeadModal from '@/components/EventLeadModal';

interface LandingPageClientProps {
  settings: StallSettings;
  services: Service[];
  testimonials: Testimonial[];
  events: UpcomingEvent[];
  gallery: GalleryImage[];
}

export default function LandingPageClient({
  settings,
  services,
  testimonials,
  events,
  gallery,
}: LandingPageClientProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedEventForLead, setSelectedEventForLead] = useState<UpcomingEvent | null>(null);

  const cleanPhone = (settings.whatsapp_number || '+919226634637').replace(/[^0-9]/g, '');
  const instaPersonal = (settings.instagram_handle || 'this.is_vedant_12').replace('@', '');
  const instaTarot = (settings.tarot_handle || 'the_arcane_diaries').replace('@', '');

  const trackClick = async (eventKey: string) => {
    try {
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_key: eventKey }),
      });
    } catch {}
  };

  const handleSelectServiceAndScroll = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    trackClick(`select_service_${serviceId}`);
    const elem = document.getElementById('booking-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-100 bg-[#070210] selection:bg-amber-500 selection:text-black">
      {/* 11. Announcement Banner (Admin Editable, On/Off) */}
      {settings.announcement_banner_active && settings.announcement_banner && (
        <div className="bg-gradient-to-r from-purple-950 via-amber-950/80 to-purple-950 border-b border-amber-500/30 text-amber-200 text-xs sm:text-sm px-4 py-2.5 text-center font-medium shadow-inner flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '8s' }} />
          <span>{settings.announcement_banner}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="px-4 py-3 sm:py-4 border-b border-purple-900/40 bg-black/40 backdrop-blur-md sticky top-[41px] z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-600 to-purple-600 p-0.5 shadow-lg shadow-purple-900/50">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400/20" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base tracking-wide text-amber-100">
                {settings.hero_title || 'The Tarot Reader'}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-purple-300/80 font-mono">
                @{instaTarot}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const elem = document.getElementById('booking-section');
                elem?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-md hover:from-amber-400 transition-all active:scale-95"
            >
              Book a Reading
            </button>

            <Link
              href="/admin/login"
              className="text-[11px] px-2.5 py-1.5 rounded-xl border border-purple-800/60 text-purple-300 hover:text-amber-200 hover:border-amber-500/50 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative px-4 pt-10 sm:pt-16 pb-12 sm:pb-20 text-center max-w-4xl mx-auto flex flex-col items-center overflow-hidden">
        {/* Celestial background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/50 text-amber-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>The Arcane Diaries • Online Readings</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
          {settings.hero_title || 'The Tarot Reader'}
        </h2>

        <p className="text-lg sm:text-2xl font-serif text-amber-200/90 italic mb-4 max-w-xl">
          &ldquo;{settings.hero_tagline || 'Clarity through the cards'}&rdquo;
        </p>

        <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed mb-8 max-w-md">
          {settings.theme_subtext || 'Uncover patterns in love, career, and personal destiny through the ancient symbolism of the cards. Personalized 1-on-1 readings with Vedant.'}
        </p>

        {/* Primary & Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-8">
          {/* Primary: WhatsApp CTA */}
          <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(settings.whatsapp_prefill_message || "Hi, I'd like a tarot reading")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('hero_whatsapp_primary')}
            className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 active:scale-95 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-black/20" />
            <span>Message me on WhatsApp</span>
          </a>

          {/* Book Jump Button */}
          <button
            onClick={() => {
              const elem = document.getElementById('booking-section');
              elem?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-[#1b0933] hover:bg-[#250d44] border border-purple-700/60 text-amber-200 font-bold text-sm tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>View Spreads & Prices</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Secondary Social Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <a
            href={`https://instagram.com/${instaPersonal}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('hero_instagram_personal')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-950/40 hover:bg-pink-900/50 border border-pink-700/40 text-pink-200 transition-colors"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>@{instaPersonal}</span>
          </a>

          <a
            href={`https://instagram.com/${instaTarot}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('hero_tarot_handle')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-950/40 hover:bg-purple-900/50 border border-purple-600/40 text-purple-200 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>@{instaTarot}</span>
          </a>
        </div>
      </section>

      {/* 2. CONTACT CARD SECTION */}
      <section className="px-4 py-8 max-w-4xl mx-auto w-full">
        <ContactCard
          whatsappNumber={settings.whatsapp_number || '+91 92266 34637'}
          instagramHandle={instaPersonal}
          tarotHandle={instaTarot}
        />
      </section>

      {/* 7. FREE "CARD OF THE DAY" INTERACTIVE */}
      <section className="px-4 py-8">
        <CardOfTheDay />
      </section>

      {/* 3. ABOUT ME SECTION */}
      <section className="px-4 py-12 max-w-4xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-b from-[#130726]/90 to-[#0a0314]/90 border border-purple-800/60 p-6 sm:p-10 shadow-xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Bio Photo or Celestial Avatar */}
            <div className="shrink-0 relative">
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-1 shadow-2xl shadow-purple-950">
                <div className="w-full h-full bg-[#10051e] rounded-[22px] flex items-center justify-center overflow-hidden relative">
                  {settings.bio_photo_url ? (
                    <img
                      src={settings.bio_photo_url}
                      alt="Vedant Baviskar - Tarot Reader"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <Moon className="w-12 h-12 text-amber-400 mb-1" />
                      <span className="text-[11px] font-bold text-amber-200">Vedant Baviskar</span>
                      <span className="text-[9px] text-purple-300/80 font-mono">Tarot Master</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black tracking-wider uppercase shadow-md">
                Reader & Guide
              </div>
            </div>

            {/* Bio Content */}
            <div className="text-center md:text-left flex-1">
              <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
                About the Reader
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Vedant Baviskar
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-serif text-[15px] mb-6">
                {settings.bio_text ||
                  'Intuitive Tarot Reader & Guide with The Arcane Diaries. Uncovering patterns in love, career, and personal destiny through the sacred symbolism of the cards.'}
              </p>

              {/* Guiding Principles Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
                  <p className="font-bold text-amber-300">Intuitive</p>
                  <p className="text-[10px] text-purple-300/70">Heart-centered</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
                  <p className="font-bold text-amber-300">No Sugarcoating</p>
                  <p className="text-[10px] text-purple-300/70">Honest guidance</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
                  <p className="font-bold text-amber-300">Confidential</p>
                  <p className="text-[10px] text-purple-300/70">100% private</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
                  <p className="font-bold text-amber-300">Empowering</p>
                  <p className="text-[10px] text-purple-300/70">Clear action steps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICES & PRICES SECTION */}
      <section id="services-section" className="px-4 py-12 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
            Curated Spreads
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-white">Tarot Services & Pricing</h3>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-md mx-auto">
            Each reading is conducted personally by Vedant with sacred card pulls and actionable insights.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service, index) => {
            const isFeatured = index === 1; // Highlight the 3-card Destiny Card
            const lowerName = service.name.toLowerCase();
            const badgeText = lowerName.includes('duo') || lowerName.includes('couple')
              ? `${service.card_count} Questions • 2 People`
              : lowerName.includes('love specific')
              ? `${service.card_count} Questions • Love Life`
              : lowerName.includes('destiny')
              ? '3 Cards • Life, Love & Career'
              : lowerName.includes('question specific')
              ? '1 Question • 1 Card'
              : `${service.card_count} ${service.card_count === 1 ? 'Card' : 'Cards'}`;

            return (
              <div
                key={service.id}
                className={`rounded-3xl p-5 flex flex-col justify-between transition-all relative ${
                  isFeatured
                    ? 'bg-gradient-to-b from-[#240e48] to-[#14062a] border-2 border-amber-400 shadow-2xl shadow-amber-500/10 scale-100 sm:scale-105 z-10'
                    : 'bg-[#120524]/80 hover:bg-[#180830] border border-purple-800/60 shadow-lg'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black tracking-wider uppercase shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between text-[11px] text-purple-300/80 mb-2 font-mono">
                    <span>{badgeText}</span>
                    <span>~{service.duration_minutes} Mins</span>
                  </div>

                  <h4 className="text-lg font-black text-white mb-2 leading-snug">
                    {service.name}
                  </h4>

                  <p className="text-xs text-purple-200/80 leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>

                <div>
                  <div className="pt-3 border-t border-purple-800/50 mb-3 flex items-baseline justify-between">
                    <span className="text-xs text-purple-300">Reading Fee</span>
                    <span className="text-2xl font-black text-amber-400">
                      {formatInr(service.price_inr)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectServiceAndScroll(service.id)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                      isFeatured
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold shadow-md'
                        : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 hover:text-white'
                    }`}
                  >
                    <span>Book this</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. BOOKING REQUEST FORM SECTION */}
      <section className="px-4 py-12 max-w-4xl mx-auto w-full">
        <BookingForm
          services={services}
          preselectedServiceId={selectedServiceId}
          whatsappNumber={settings.whatsapp_number || '+91 92266 34637'}
        />
      </section>

      {/* 8. TESTIMONIALS & REVIEWS SECTION */}
      {testimonials.length > 0 && (
        <section className="px-4 py-12 max-w-5xl mx-auto w-full">
          <div className="text-center mb-8">
            <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
              Verified Client Experiences
            </span>
            <h3 className="text-3xl font-black text-white">What Seekers Say</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              Real reflections and reviews from live stall visitors and private sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl bg-[#130726]/80 border border-purple-800/60 p-5 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-2">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-purple-100/90 italic font-serif leading-relaxed mb-4">
                    &ldquo;{t.feedback_text}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-purple-900/50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{t.customer_name}</p>
                    <p className="text-[10px] text-purple-400/80">{t.service_name || 'Tarot Reading'}</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-xs font-semibold transition-all active:scale-95"
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Leave a Review</span>
            </button>
          </div>
        </section>
      )}

      {/* If testimonials is empty, show a subtle Leave Review prompt */}
      {testimonials.length === 0 && (
        <section className="px-4 py-8 text-center">
          <p className="text-xs text-purple-300/60 mb-2">Had a reading with Vedant?</p>
          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-200 text-xs font-medium"
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Share Your Experience</span>
          </button>
        </section>
      )}

      {/* 9. GALLERY (Admin Uploaded Photos Only; Hides if Empty) */}
      {gallery.length > 0 && (
        <section className="px-4 py-12 max-w-5xl mx-auto w-full">
          <div className="text-center mb-8">
            <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
              Visual Journey
            </span>
            <h3 className="text-3xl font-black text-white">Stall & Card Gallery</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              Moments from our live stalls, decks, and altar setups.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-2xl overflow-hidden aspect-square bg-purple-950/40 border border-purple-800/50 shadow-md"
              >
                <img
                  src={img.image_url}
                  alt={img.caption || 'Tarot stall gallery image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-[11px] text-white">
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. UPCOMING EVENTS (Admin Editable; Hides if Empty) */}
      {events.length > 0 && (
        <section className="px-4 py-12 max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
              Pop-ups & Festivals
            </span>
            <h3 className="text-3xl font-black text-white">Upcoming Events</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              Catch Vedant live at college fests and pop-up markets.
            </p>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="rounded-3xl bg-[#140827]/80 border border-purple-800/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-amber-500/40 transition-colors"
              >
                <div>
                  <h4 className="text-lg font-black text-white mb-1">{evt.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-purple-300/80 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {evt.date_text}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" />
                      {evt.location}
                    </span>
                  </div>
                  {evt.description && (
                    <p className="text-xs text-purple-200/70">{evt.description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEventForLead(evt)}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700/60 text-amber-300 text-xs font-bold transition-all active:scale-95"
                >
                  I&apos;m Interested ✦
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. NEWSLETTER / UPDATES OPT-IN */}
      <section className="px-4 py-12 max-w-4xl mx-auto w-full">
        <NewsletterOptIn />
      </section>

      {/* 12. FOOTER */}
      <footer className="mt-auto border-t border-purple-900/40 bg-[#090214] px-4 py-10 text-xs text-purple-300/70">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h5 className="font-bold text-sm text-amber-200 mb-1">
              {settings.hero_title || 'The Tarot Reader'} • The Arcane Diaries
            </h5>
            <p className="text-[11px] text-purple-300/60 max-w-md">
              {settings.disclaimer_text ||
                'Tarot readings are for personal guidance, self-reflection, and entertainment, not a substitute for professional, medical, legal, or financial advice.'}
            </p>
            <p className="text-[10px] text-purple-400/50 mt-2">
              DPDP Compliance: Your personal details are never sold. To request complete deletion of your booking or lead data, contact us via WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center">
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 transition-colors"
            >
              WhatsApp Support
            </a>
            <a
              href={`https://instagram.com/${instaPersonal}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 transition-colors"
            >
              @{instaPersonal}
            </a>
            <a
              href={`https://instagram.com/${instaTarot}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 transition-colors"
            >
              @{instaTarot}
            </a>
            <Link href="/admin/login" className="hover:text-white transition-colors underline">
              Admin Portal
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center mt-8 pt-4 border-t border-purple-950 text-[10px] text-purple-400/40">
          © {new Date().getFullYear()} The Tarot Reader. Crafted for clarity and intuitive alignment. All rights reserved.
        </div>
      </footer>

      {/* Interactive Modals */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />

      <EventLeadModal
        event={selectedEventForLead}
        onClose={() => setSelectedEventForLead(null)}
      />
    </div>
  );
}
