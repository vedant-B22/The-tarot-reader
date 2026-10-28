'use client';

import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Download, 
  Share2, 
  BookOpen, 
  Trash2, 
  Tag, 
  FileEdit, 
  Loader2 
} from 'lucide-react';
import { Customer } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/export?type=customers');
      // For rich customer view, we can also fetch from a direct endpoint or fetch queue/tokens
      // Let's create a quick helper or fetch all
    } finally {
      //
    }
  };

  useEffect(() => {
    fetch('/api/admin/queue')
      .then(res => res.json())
      .then(() => {
        // We will fetch customer list
      });
  }, []);

  return (
    <AdminCustomersClient />
  );
}

function AdminCustomersClient() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/queue')
      .then(res => res.json())
      .then(data => {
        // Derive unique customers from tokens
        const tokenMap: Record<string, any> = {};
        (data.tokens || []).forEach((t: any) => {
          if (!tokenMap[t.customer_id]) {
            tokenMap[t.customer_id] = {
              id: t.customer_id,
              name: t.customer_name,
              phone: t.customer_phone,
              total_tokens: 0,
              last_service: t.service_name,
              last_seen: t.created_at,
            };
          }
          tokenMap[t.customer_id].total_tokens += 1;
        });
        setCustomers(Object.values(tokenMap));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer and all their data under DPDP compliance?')) return;
    try {
      const res = await fetch('/api/admin/delete-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
      } else {
        const d = await res.json();
        alert(d.error || 'Deletion failed');
      }
    } catch {
      alert('Network error');
    }
  };

  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/50">
        <div>
          <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Customer Roster & Reading Records</span>
          </h3>
          <p className="text-xs text-purple-300/80">College visitors, phone numbers, and readings history</p>
        </div>

        <a
          href="/api/admin/export?type=customers"
          className="px-3.5 py-2 rounded-xl bg-purple-900/60 border border-purple-700 hover:bg-purple-800 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors w-fit"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Customers CSV</span>
        </a>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black/60 border border-purple-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-purple-300">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            <span className="text-xs">Loading customer directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-purple-300/60 text-xs font-semibold">
            No customers registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-900/40 text-[11px] uppercase tracking-wider text-purple-300/70 font-semibold">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">WhatsApp Phone</th>
                  <th className="py-2.5 px-3">Readings</th>
                  <th className="py-2.5 px-3">Recent Service</th>
                  <th className="py-2.5 px-3">Last Seen</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-purple-200 whitespace-nowrap">
                      {c.phone}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-300 whitespace-nowrap">
                      {c.total_tokens}
                    </td>
                    <td className="py-3 px-3 text-purple-200">
                      {c.last_service || '--'}
                    </td>
                    <td className="py-3 px-3 text-purple-300/80 text-[11px] whitespace-nowrap">
                      {formatDateTime(c.last_seen)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 text-[10px]"
                        title="DPDP Customer Data Deletion"
                      >
                        Delete Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
