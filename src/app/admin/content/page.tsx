'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { StallSettings, UpcomingEvent, GalleryImage } from '@/types';

export default function AdminContentPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable settings fields
  const [heroTitle, setHeroTitle] = useState('');
  const [heroTagline, setHeroTagline] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappPrefill, setWhatsappPrefill] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tarotHandle, setTarotHandle] = useState('');
  const [bioText, setBioText] = useState('');
  const [bioPhotoUrl, setBioPhotoUrl] = useState('');
  const [announcementBanner, setAnnouncementBanner] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);

  // Events & Gallery
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  // New Event Form Modal/Inputs
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // New Gallery Image Form
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [creatingImage, setCreatingImage] = useState(false);

  const fetchContent = () => {
    fetch('/api/admin/content')
      .then(res => res.json())
      .then(data => {
        const s: StallSettings = data.settings;
        if (s) {
          setHeroTitle(s.hero_title || 'The Tarot Reader');
          setHeroTagline(s.hero_tagline || 'Clarity through the cards');
          setWhatsappNumber(s.whatsapp_number || '+91 92266 34637');
          setWhatsappPrefill(s.whatsapp_prefill_message || "Hi, I'd like a tarot reading");
          setInstagramHandle(s.instagram_handle || 'this.is_vedant_12');
          setTarotHandle(s.tarot_handle || 'the_arcane_diaries');
          setBioText(s.bio_text || '');
          setBioPhotoUrl(s.bio_photo_url || '');
          setAnnouncementBanner(s.announcement_banner || '');
          setAnnouncementActive(s.announcement_banner_active !== false);
        }
        setEvents(data.events || []);
        setGallery(data.gallery || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_title: heroTitle,
          hero_tagline: heroTagline,
          whatsapp_number: whatsappNumber,
          whatsapp_prefill_message: whatsappPrefill,
          instagram_handle: instagramHandle,
          tarot_handle: tarotHandle,
          bio_text: bioText,
          bio_photo_url: bioPhotoUrl,
          announcement_banner: announcementBanner,
          announcement_banner_active: announcementActive,
        }),
      });

      if (!res.ok) throw new Error('Failed to update settings');

      setSuccessMessage('Site content updated and published live!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_event',
          eventData: {
            title: newEventTitle,
            date_text: newEventDate,
            location: newEventLocation,
            description: newEventDesc,
          },
        }),
      });
      const data = await res.json();
      if (data.event) {
        setEvents(prev => [...prev, data.event]);
        setNewEventTitle('');
        setNewEventDate('');
        setNewEventLocation('');
        setNewEventDesc('');
      }
    } catch {}
    setCreatingEvent(false);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this upcoming event?')) return;
    try {
      const res = await fetch(`/api/admin/content?type=event&id=${id}`, { method: 'DELETE' });
      if (res.ok) setEvents(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  const handleCreateGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingImage(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_gallery_image',
          galleryData: {
            image_url: newImageUrl,
            caption: newImageCaption,
          },
        }),
      });
      const data = await res.json();
      if (data.image) {
        setGallery(prev => [data.image, ...prev]);
        setNewImageUrl('');
        setNewImageCaption('');
      }
    } catch {}
    setCreatingImage(false);
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!confirm('Delete this gallery photo?')) return;
    try {
      const res = await fetch(`/api/admin/content?type=gallery&id=${id}`, { method: 'DELETE' });
      if (res.ok) setGallery(prev => prev.filter(g => g.id !== id));
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Website Content Editor</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">Public Site Content</h2>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
          Modify hero titles, about bio, social links, announcement marquee, gallery, and upcoming pop-up events.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-700 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6 rounded-3xl bg-[#120824] border border-purple-800/80 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white border-b border-purple-800/60 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Core Branding & Hero</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Hero Title</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="The Tarot Reader"
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Tagline</label>
            <input
              type="text"
              value={heroTagline}
              onChange={(e) => setHeroTagline(e.target.value)}
              placeholder="Clarity through the cards"
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+91 92266 34637"
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">WhatsApp Prefill Message</label>
            <input
              type="text"
              value={whatsappPrefill}
              onChange={(e) => setWhatsappPrefill(e.target.value)}
              placeholder="Hi, I'd like a tarot reading"
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Personal Instagram Handle</label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="this.is_vedant_12"
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Tarot Brand Handle</label>
            <input
              type="text"
              value={tarotHandle}
              onChange={(e) => setTarotHandle(e.target.value)}
              placeholder="the_arcane_diaries"
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* About Me Section */}
        <div className="pt-4 border-t border-purple-900/60 space-y-4">
          <h4 className="text-sm font-bold text-white">About Me & Bio</h4>
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">About Me Bio Text</label>
            <textarea
              rows={3}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Profile Photo URL (Optional)</label>
            <input
              type="url"
              value={bioPhotoUrl}
              onChange={(e) => setBioPhotoUrl(e.target.value)}
              placeholder="https://... (Leave blank to use default mystic emblem)"
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Announcement Marquee */}
        <div className="pt-4 border-t border-purple-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Top Announcement Banner</h4>
              <p className="text-[11px] text-purple-300/80">Marquee banner displayed at the very top of the website.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-purple-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <input
            type="text"
            value={announcementBanner}
            onChange={(e) => setAnnouncementBanner(e.target.value)}
            placeholder="e.g. ✨ Online 1-on-1 readings now open!"
            className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save & Publish Changes</span>
        </button>
      </form>

      {/* Upcoming Events Manager */}
      <div className="rounded-3xl bg-[#120824] border border-purple-800/80 p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Upcoming Events & Pop-Up Stalls</span>
          </h3>
          <p className="text-xs text-purple-200/80">
            Publish dates for college fests or flea markets where visitors can click &ldquo;I&apos;m Interested&rdquo;.
          </p>
        </div>

        <form onSubmit={handleCreateEvent} className="p-4 rounded-2xl bg-black/40 border border-purple-900/60 space-y-3">
          <h4 className="text-xs font-bold text-amber-300">Add New Upcoming Event</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              placeholder="Event Title (e.g. Winter Carnival)"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              required
              placeholder="Date Text (e.g. Dec 15 • 11 AM)"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              placeholder="Location (e.g. SSPU Quadrangle)"
              value={newEventLocation}
              onChange={(e) => setNewEventLocation(e.target.value)}
              className="bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Short Description (e.g. Walk-ins welcome for quick card draws)"
              value={newEventDesc}
              onChange={(e) => setNewEventDesc(e.target.value)}
              className="flex-1 bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={creatingEvent}
              className="px-4 py-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-amber-300 text-xs font-bold flex items-center gap-1.5"
            >
              {creatingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Add Event</span>
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">
              No upcoming events listed. (Section hides automatically on public home page).
            </p>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-black/40 border border-purple-900/40 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{ev.title}</p>
                  <p className="text-purple-300 text-[11px]">{ev.date_text} • {ev.location}</p>
                  {ev.description && <p className="text-gray-400 text-[10px] mt-0.5">{ev.description}</p>}
                </div>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gallery Photos Manager */}
      <div className="rounded-3xl bg-[#120824] border border-purple-800/80 p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Gallery Photos</span>
          </h3>
          <p className="text-xs text-purple-200/80">
            Showcase real photos from your stalls, card decks, and altar setups. (Hides if empty).
          </p>
        </div>

        <form onSubmit={handleCreateGalleryImage} className="p-4 rounded-2xl bg-black/40 border border-purple-900/60 flex flex-col sm:flex-row gap-2.5">
          <input
            type="url"
            required
            placeholder="Image URL (e.g. /uploads/photo.jpg or cloud link)"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            className="flex-1 bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            placeholder="Caption (e.g. Halloween Stall at SSPU)"
            value={newImageCaption}
            onChange={(e) => setNewImageCaption(e.target.value)}
            className="sm:w-64 bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={creatingImage}
            className="px-4 py-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            {creatingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Image</span>
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gallery.length === 0 ? (
            <p className="col-span-full text-xs text-gray-500 py-3 text-center">
              No gallery images added yet. (Section hides automatically on public home page).
            </p>
          ) : (
            gallery.map((img) => (
              <div key={img.id} className="relative group rounded-2xl overflow-hidden aspect-square border border-purple-900">
                <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeleteGalleryImage(img.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-red-400 hover:text-white"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {img.caption && (
                  <p className="absolute bottom-0 inset-x-0 p-1.5 bg-black/80 text-[10px] text-white truncate">
                    {img.caption}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
