'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Check, 
  X, 
  KeyRound, 
  Loader2, 
  Lock 
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { AdminUser } from '@/types';

export default function AdminTeamPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [canEditPrices, setCanEditPrices] = useState(false);
  const [canCreateDiscounts, setCanCreateDiscounts] = useState(false);
  const [canIssueRefunds, setCanIssueRefunds] = useState(false);
  const [canOverrideQueue, setCanOverrideQueue] = useState(true);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const json = await res.json();
        setAdmins(json.admins || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          can_edit_prices: canEditPrices,
          can_create_discounts: canCreateDiscounts,
          can_issue_refunds: canIssueRefunds,
          can_override_queue: canOverrideQueue,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        fetchAdmins();
      } else {
        alert(data.error || 'Failed to create admin');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleTogglePermission = async (adminId: string, permission: string, currentValue: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminId,
          [permission]: !currentValue,
        }),
      });
      if (res.ok) {
        fetchAdmins();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update permission');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdmins();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete');
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

  const regularAdmins = admins.filter(a => a.role === 'admin');

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
        <div>
          <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Admin Team & Role-Based Permissions</span>
          </h3>
          <p className="text-xs text-purple-300/80">
            Super Admin controls which of the regular admins (up to 5) can edit prices, discounts, or refunds
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={regularAdmins.length >= 5}
          className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin ({regularAdmins.length}/5)</span>
        </button>
      </div>

      <div className="grid gap-4">
        {admins.map((adm) => (
          <div
            key={adm.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#120824] border border-purple-900/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{adm.name}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  adm.role === 'super_admin' ? 'bg-amber-500 text-black' : 'bg-purple-900 text-purple-200 border border-purple-700'
                }`}>
                  {adm.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
                {!adm.is_active && (
                  <span className="text-[10px] bg-red-950 text-red-300 px-1 rounded">Deactivated</span>
                )}
              </div>
              <div className="text-xs text-purple-300/80 font-mono mt-0.5">{adm.email}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                Last active: {adm.last_active_at ? formatDateTime(adm.last_active_at) : 'Never'}
              </div>
            </div>

            {/* Permission Toggles for regular admins */}
            {adm.role === 'admin' ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => handleTogglePermission(adm.id, 'can_edit_prices', adm.can_edit_prices)}
                  className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                    adm.can_edit_prices
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/60'
                      : 'bg-black/40 text-gray-500 border-purple-900/40'
                  }`}
                >
                  Prices: {adm.can_edit_prices ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={() => handleTogglePermission(adm.id, 'can_create_discounts', adm.can_create_discounts)}
                  className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                    adm.can_create_discounts
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/60'
                      : 'bg-black/40 text-gray-500 border-purple-900/40'
                  }`}
                >
                  Discounts: {adm.can_create_discounts ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={() => handleTogglePermission(adm.id, 'can_issue_refunds', adm.can_issue_refunds)}
                  className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                    adm.can_issue_refunds
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/60'
                      : 'bg-black/40 text-gray-500 border-purple-900/40'
                  }`}
                >
                  Refunds: {adm.can_issue_refunds ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={() => handleDeleteAdmin(adm.id)}
                  className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800"
                  title="Remove Admin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xs font-semibold text-amber-300/80 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-xl">
                Master Super Admin (Unrestricted Full Control)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-purple-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-amber-200 mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <span>Create Stall Admin Account</span>
            </h3>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Reader"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="maya@sspu-tarot.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              {/* Permissions Checklist */}
              <div className="pt-2 border-t border-purple-900/40 space-y-2">
                <div className="text-xs font-bold text-amber-300">Grant Edit Permissions:</div>

                <label className="flex items-center gap-2 text-xs text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canEditPrices}
                    onChange={(e) => setCanEditPrices(e.target.checked)}
                    className="rounded border-purple-800 text-amber-500 w-4 h-4"
                  />
                  <span>Can edit services & pricing</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canCreateDiscounts}
                    onChange={(e) => setCanCreateDiscounts(e.target.checked)}
                    className="rounded border-purple-800 text-amber-500 w-4 h-4"
                  />
                  <span>Can create discount promo codes</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canIssueRefunds}
                    onChange={(e) => setCanIssueRefunds(e.target.checked)}
                    className="rounded border-purple-800 text-amber-500 w-4 h-4"
                  />
                  <span>Can issue cash/UPI refunds</span>
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
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
