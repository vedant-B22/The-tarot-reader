'use client';

import { useState, useEffect } from 'react';
import { 
  Compass, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatInr } from '@/lib/utils';
import { Service } from '@/types';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cardCount, setCardCount] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [priceInr, setPriceInr] = useState(99);
  const [isGroup, setIsGroup] = useState(false);
  const [groupSize, setGroupSize] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const json = await res.json();
        setServices(json.services || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setCardCount(1);
    setDurationMinutes(10);
    setPriceInr(99);
    setIsGroup(false);
    setGroupSize(1);
    setIsActive(true);
    setSortOrder(services.length + 1);
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setCardCount(service.card_count);
    setDurationMinutes(service.duration_minutes);
    setPriceInr(service.price_inr);
    setIsGroup(service.is_group);
    setGroupSize(service.group_size);
    setIsActive(service.is_active);
    setSortOrder(service.sort_order);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      description,
      card_count: cardCount,
      duration_minutes: durationMinutes,
      price_inr: priceInr,
      is_group: isGroup,
      group_size: groupSize,
      is_active: isActive,
      sort_order: sortOrder,
    };

    try {
      const res = await fetch('/api/admin/services', {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService ? { id: editingService.id, ...payload } : payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchServices();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save service');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete service');
      }
    } catch {
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-purple-300">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
        <div>
          <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Tarot Service Menu & Pricing</span>
          </h3>
          <p className="text-xs text-purple-300/80">Configure live services, durations, card spreads and bundle deals</p>
        </div>

        <button
          onClick={openCreateModal}
          className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="grid gap-3.5">
        {services.map((service) => (
          <div
            key={service.id}
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              service.is_active
                ? 'bg-[#120824] border-purple-900/60'
                : 'bg-black/30 border-gray-800 opacity-60'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-amber-200">{service.name}</span>
                {service.is_group && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase font-bold">
                    Group Duo ({service.group_size} people)
                  </span>
                )}
                {!service.is_active && (
                  <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">{service.description}</p>
              <div className="flex items-center gap-4 text-xs text-purple-300 mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>{service.card_count} {service.card_count === 1 ? 'Card' : 'Cards'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>~{service.duration_minutes} mins</span>
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
              <span className="text-xl font-black text-amber-300">
                {formatInr(service.price_inr)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(service)}
                  className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-purple-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-base font-black text-amber-200 mb-3">
              {editingService ? 'Edit Tarot Service' : 'Create New Tarot Service'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Short Description *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Card Count *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={cardCount}
                    onChange={(e) => setCardCount(Number(e.target.value))}
                    className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    min={3}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-200">
                  <input
                    type="checkbox"
                    checked={isGroup}
                    onChange={(e) => setIsGroup(e.target.checked)}
                    className="rounded border-purple-800 text-amber-500 w-4 h-4"
                  />
                  <span>Is Group / Duo Reading</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-200">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-purple-800 text-amber-500 w-4 h-4"
                  />
                  <span>Active in Stall Menu</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
