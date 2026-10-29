'use client';

import { useState, useEffect } from 'react';
import { BarChart3, MousePointerClick, MessageCircle, UserCheck, Sparkles, Share2, Loader2 } from 'lucide-react';
import InstagramIcon from '@/components/icons/InstagramIcon';
import { ClickStat } from '@/types';

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totalClicks: number;
    clicks: ClickStat[];
    totalBookings: number;
    newBookings: number;
    totalLeads: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const clicks = data?.clicks || [];
  const totalClicks = data?.totalClicks || 0;

  const getEventName = (key: string) => {
    switch (key) {
      case 'hero_whatsapp_primary':
        return 'WhatsApp Hero CTA ("Message me on WhatsApp")';
      case 'whatsapp_contact_card':
        return 'WhatsApp Contact Card Button';
      case 'hero_instagram_personal':
      case 'instagram_personal':
        return 'Instagram Profile (@this.is_vedant_12)';
      case 'hero_tarot_handle':
      case 'instagram_tarot_page':
        return 'Tarot Handle Page (@the_arcane_diaries)';
      case 'vcard_download':
        return 'Save Contact (vCard .vcf Download)';
      case 'copy_phone':
        return 'Copy Phone Number to Clipboard';
      case 'card_of_the_day_reveal':
        return 'Card of the Day Reveal (3D Flip)';
      case 'instagram_story_share':
        return 'Instagram Story Graphic Generated';
      default:
        if (key.startsWith('select_service_')) {
          return `Service Selected ("Book This")`;
        }
        return key.replace(/_/g, ' ');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span>First-Party Privacy-Friendly Aggregate Tracking</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">Click Tracking & Analytics</h2>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
          Real aggregate interactions from visitors: WhatsApp chats started, profile visits, vCard downloads, and card draws. Zero cookies.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-[#120824] border border-purple-800/80 shadow-lg">
          <p className="text-xs text-purple-300/80">Total Tracked Clicks</p>
          <p className="text-3xl font-black text-amber-400 mt-1">{totalClicks}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Across all CTAs and links</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#120824] border border-purple-800/80 shadow-lg">
          <p className="text-xs text-purple-300/80">Online Booking Requests</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{data?.totalBookings || 0}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{data?.newBookings || 0} awaiting confirmation</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#120824] border border-purple-800/80 shadow-lg">
          <p className="text-xs text-purple-300/80">VIP Leads / Subscribers</p>
          <p className="text-3xl font-black text-white mt-1">{data?.totalLeads || 0}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Future event alert opt-ins</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#120824] border border-purple-800/80 shadow-lg">
          <p className="text-xs text-purple-300/80">Lead Conversion Rate</p>
          <p className="text-3xl font-black text-purple-300 mt-1">
            {totalClicks > 0
              ? `${Math.round(((data?.totalBookings || 0) / totalClicks) * 100)}%`
              : '0%'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Bookings per tracked click</p>
        </div>
      </div>

      {/* Click Distribution List */}
      <div className="rounded-3xl bg-[#120824] border border-purple-800/80 p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-amber-400" />
          <span>Click Breakdown by Action</span>
        </h3>

        {clicks.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">
            No clicks tracked yet. As visitors tap WhatsApp, Instagram, or Card of the Day, data will populate here.
          </p>
        ) : (
          <div className="space-y-3">
            {clicks.map((c) => {
              const percent = totalClicks > 0 ? Math.round((c.click_count / totalClicks) * 100) : 0;
              return (
                <div key={c.event_key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-white">{getEventName(c.event_key)}</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {c.click_count} clicks ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Last active: {new Date(c.last_clicked_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
