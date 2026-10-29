'use client';

import { useState, useEffect } from 'react';
import { 
  Inbox, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Tag, 
  Search, 
  Check, 
  Trash2, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { BookingRequest, BookingStatus } from '@/types';
import { formatInr } from '@/lib/utils';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = () => {
    fetch(`/api/admin/bookings?status=${statusFilter}`)
      .then(res => res.json())
      .then(data => {
        setBookings(data.bookings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: BookingStatus, notes?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, admin_notes: notes }),
      });
      if (res.ok) {
        setBookings(prev =>
          prev.map(b => (b.id === id ? { ...b, status: newStatus, admin_notes: notes !== undefined ? notes : b.admin_notes } : b))
        );
      }
    } catch {}
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking request?')) return;
    try {
      const res = await fetch(`/api/admin/bookings?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== id));
      }
    } catch {}
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(term) ||
      b.phone.includes(term) ||
      b.service_name.toLowerCase().includes(term) ||
      (b.promo_code && b.promo_code.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'new':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'contacted':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'booked':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Inbox className="w-3.5 h-3.5 text-amber-400" />
            <span>Client Inquiries & Booking Requests</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Bookings Inbox</h2>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Review online reading requests, confirm slots, and reply directly on WhatsApp.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#120824] border border-purple-800/80 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses ({bookings.length})</option>
            <option value="new">New ({bookings.filter(b => b.status === 'new').length})</option>
            <option value="contacted">Contacted</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by client name, phone number, service, promo code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/60 border border-purple-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#120824] border border-purple-800/80 text-gray-400">
          No booking requests found matching this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const cleanPhone = b.phone.replace(/[^0-9]/g, '');
            const replyMsg = `Hi ${b.name}! This is Vedant from The Tarot Reader. I received your reading request for ${b.service_name} on ${b.preferred_date} (${b.preferred_time}). Is this time still good for you?`;
            const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(replyMsg)}`;

            return (
              <div
                key={b.id}
                className="rounded-3xl bg-[#120824]/90 border border-purple-800/70 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-500/40 transition-colors"
              >
                {/* Left: Client & Service Details */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(b.status)}`}>
                      {b.status}
                    </span>
                    <h3 className="font-bold text-white text-base">{b.name}</h3>
                    <span className="text-xs text-purple-300 font-mono">({b.phone})</span>
                    {b.promo_code && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/60 text-amber-300 font-mono border border-purple-700">
                        Promo: {b.promo_code} (-{formatInr(b.discount_inr)})
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-amber-300 mb-1">
                    {b.service_name} • <span className="font-black text-white">{formatInr(b.final_price_inr)}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-purple-300/80 mb-2">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {b.preferred_date}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {b.preferred_time}
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Requested: {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {b.note && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-purple-900/40 text-xs text-purple-200/90 italic mb-2">
                      &ldquo;{b.note}&rdquo;
                    </div>
                  )}

                  {b.admin_notes && (
                    <p className="text-[11px] text-amber-400/90 font-mono">
                      Admin Note: {b.admin_notes}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-2 shrink-0">
                  {/* WhatsApp Quick Reply */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-4 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-black/20" />
                    <span>Reply on WhatsApp</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={b.status}
                      disabled={updatingId === b.id}
                      onChange={(e) => handleUpdateStatus(b.id, e.target.value as BookingStatus)}
                      className="bg-black/60 border border-purple-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="booked">Booked</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => {
                        const notePrompt = prompt('Add/edit internal admin note for this booking:', b.admin_notes || '');
                        if (notePrompt !== null) {
                          handleUpdateStatus(b.id, b.status, notePrompt);
                        }
                      }}
                      className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-300"
                      title="Add note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 hover:text-red-200"
                      title="Delete booking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
