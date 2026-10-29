'use client';

import { useState, useEffect } from 'react';
import { Users, Download, Trash2, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';
import { LeadSubscriber } from '@/types';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = () => {
    fetch('/api/admin/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleToggleOptOut = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_opted_out: !currentVal }),
      });
      if (res.ok) {
        setLeads(prev =>
          prev.map(l => (l.id === id ? { ...l, is_opted_out: !currentVal } : l))
        );
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this lead? (DPDP compliance action)')) return;
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
      }
    } catch {}
  };

  const exportCsv = () => {
    const rows = [
      ['Name', 'Phone', 'Source', 'Event Interest', 'Consent Given', 'Opted Out', 'Date Subscribed'],
      ...leads.map(l => [
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.phone}"`,
        l.source,
        `"${(l.event_title || '').replace(/"/g, '""')}"`,
        l.consent_given ? 'YES' : 'NO',
        l.is_opted_out ? 'YES' : 'NO',
        l.created_at,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tarot_Leads_VIP_Subscribers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.name.toLowerCase().includes(term) ||
      l.phone.includes(term) ||
      l.source.toLowerCase().includes(term) ||
      (l.event_title && l.event_title.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Audience & Future Event Leads</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Leads & Subscribers</h2>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Visitors who opted in for future event stalls, festival notifications, or booked a reading.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={leads.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export All CSV</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by subscriber name, phone number, event title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/60 border border-purple-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#120824] border border-purple-800/80 text-gray-400">
          No leads or subscribers found.
        </div>
      ) : (
        <div className="rounded-3xl bg-[#120824]/90 border border-purple-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1c0c38] text-purple-200 border-b border-purple-800/80 font-mono text-[11px]">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">WhatsApp Phone</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Specific Event Interest</th>
                  <th className="p-3.5">Consent</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Subscribed Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40 text-purple-100">
                {filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-purple-950/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">{l.name}</td>
                    <td className="p-3.5 font-mono text-amber-300">{l.phone}</td>
                    <td className="p-3.5 uppercase font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-700">
                        {l.source}
                      </span>
                    </td>
                    <td className="p-3.5 text-purple-200">
                      {l.event_title || '—'}
                    </td>
                    <td className="p-3.5">
                      {l.consent_given ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Consented
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {l.is_opted_out ? (
                        <span className="text-red-400 bg-red-950/40 px-2 py-0.5 rounded-full border border-red-800/60 text-[10px]">
                          Opted Out
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/60 text-[10px]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-gray-400 text-[11px]">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleOptOut(l.id, l.is_opted_out)}
                        className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 text-[11px]"
                      >
                        {l.is_opted_out ? 'Reactivate' : 'Opt Out'}
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="p-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                        title="Delete data (DPDP)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
