'use client';

import { useState, useEffect } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, Plus, Loader2, Sparkles } from 'lucide-react';
import { Testimonial } from '@/types';

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Add Review
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newService, setNewService] = useState('Past, Present & Future');
  const [newRating, setNewRating] = useState(5);
  const [newFeedback, setNewFeedback] = useState('');
  const [savingNew, setSavingNew] = useState(false);

  const fetchTestimonials = () => {
    fetch('/api/admin/testimonials')
      .then(res => res.json())
      .then(data => {
        setTestimonials(data.testimonials || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleToggleApproval = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: !currentVal }),
      });
      if (res.ok) {
        setTestimonials(prev =>
          prev.map(t => (t.id === id ? { ...t, is_approved: !currentVal } : t))
        );
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTestimonials(prev => prev.filter(t => t.id !== id));
      }
    } catch {}
  };

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNew(true);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: newName,
          service_name: newService,
          rating: newRating,
          feedback_text: newFeedback,
          is_approved: true,
        }),
      });
      const data = await res.json();
      if (data.testimonial) {
        setTestimonials(prev => [data.testimonial, ...prev]);
        setNewName('');
        setNewFeedback('');
        setShowAddForm(false);
      }
    } catch {}
    setSavingNew(false);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Client Feedback & Testimonial Moderation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Testimonials Moderation</h2>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Only approved reviews appear on the public landing page. Real reviews only.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-amber-300 text-xs font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Add Client Review'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateTestimonial} className="mb-6 p-6 rounded-3xl bg-[#120824] border border-purple-800/80 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Add Genuine Client Review (e.g. from WhatsApp chat)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-purple-300 mb-1">Client Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Tanvi P."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs text-purple-300 mb-1">Reading Service</label>
              <input
                type="text"
                placeholder="e.g. Love & Romance Spread"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs text-purple-300 mb-1">Star Rating (1-5)</label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value={5}>5 Stars ★★★★★</option>
                <option value={4}>4 Stars ★★★★☆</option>
                <option value={3}>3 Stars ★★★☆☆</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-purple-300 mb-1">Feedback Text *</label>
            <textarea
              rows={3}
              required
              placeholder="What did the client say about their reading?"
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={savingNew}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs tracking-wide"
          >
            {savingNew ? 'Saving...' : 'Publish Approved Review'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#120824] border border-purple-800/80 text-gray-400">
          No testimonials yet. Use &ldquo;Add Client Review&rdquo; or let visitors submit reviews from the public site.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between transition-colors shadow-lg ${
                t.is_approved
                  ? 'bg-[#120824]/90 border-purple-800/80'
                  : 'bg-black/40 border-amber-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.is_approved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {t.is_approved ? 'APPROVED (PUBLIC)' : 'PENDING REVIEW'}
                  </span>
                </div>

                <p className="text-xs text-purple-100 font-serif italic mb-4 leading-relaxed">
                  &ldquo;{t.feedback_text}&rdquo;
                </p>
              </div>

              <div>
                <div className="pt-2 border-t border-purple-900/50 flex justify-between items-center text-xs mb-3">
                  <span className="font-bold text-white">{t.customer_name}</span>
                  <span className="text-purple-400 text-[11px]">{t.service_name}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleApproval(t.id, t.is_approved)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      t.is_approved
                        ? 'bg-purple-950 hover:bg-purple-900 text-purple-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold'
                    }`}
                  >
                    {t.is_approved ? 'Unpublish' : 'Approve & Publish'}
                  </button>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
