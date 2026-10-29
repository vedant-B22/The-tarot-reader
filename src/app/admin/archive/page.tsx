'use client';

import { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Download, 
  CreditCard, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Star,
  FileSpreadsheet,
  Loader2,
  Calendar
} from 'lucide-react';
import { formatInr } from '@/lib/utils';

export default function EventArchivePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tokens' | 'payments' | 'feedback'>('tokens');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/export')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-purple-300">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const tokens = data?.tokens || [];
  const payments = data?.payments || [];
  const customers = data?.customers || [];

  const completedTokens = tokens.filter((t: any) => t.status === 'completed');
  const totalRevenue = payments
    .filter((p: any) => p.status === 'verified')
    .reduce((acc: number, p: any) => acc + (p.final_amount_inr || 0), 0);
  const cashRevenue = payments
    .filter((p: any) => p.status === 'verified' && p.payment_method === 'cash')
    .reduce((acc: number, p: any) => acc + (p.final_amount_inr || 0), 0);
  const onlineRevenue = payments
    .filter((p: any) => p.status === 'verified' && p.payment_method === 'upi_qr')
    .reduce((acc: number, p: any) => acc + (p.final_amount_inr || 0), 0);

  const feedbackItems = tokens.filter((t: any) => t.customer_feedback_stars !== null);

  // Filter tokens
  const filteredTokens = tokens.filter((t: any) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.token_display?.toLowerCase().includes(term) ||
      t.customer_name?.toLowerCase().includes(term) ||
      t.customer_phone?.includes(term) ||
      t.service_name?.toLowerCase().includes(term)
    );
  });

  // Filter payments
  const filteredPayments = payments.filter((p: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.token_display?.toLowerCase().includes(term) ||
      p.customer_name?.toLowerCase().includes(term) ||
      p.customer_phone?.includes(term) ||
      p.utr_number?.toLowerCase().includes(term)
    );
  });

  const exportCsv = (type: 'tokens' | 'payments') => {
    let rows: string[][] = [];
    let filename = '';

    if (type === 'tokens') {
      filename = `SSPU_Halloween_Tokens_Archive.csv`;
      rows.push(['Token Number', 'Customer Name', 'Phone', 'Service', 'Status', 'Duration (Seconds)', 'Cards Drawn', 'Feedback Stars', 'Comment', 'Timestamp']);
      tokens.forEach((t: any) => {
        rows.push([
          t.token_display,
          t.customer_name,
          t.customer_phone,
          t.service_name,
          t.status,
          String(t.actual_duration_seconds || 0),
          `"${(t.cards_drawn || []).map((c: any) => c.card_name).join(', ')}"`,
          String(t.customer_feedback_stars || ''),
          `"${(t.customer_feedback_comment || '').replace(/"/g, '""')}"`,
          t.created_at,
        ]);
      });
    } else {
      filename = `SSPU_Halloween_Payments_Archive.csv`;
      rows.push(['Payment ID', 'Token', 'Customer', 'Method', 'Status', 'Amount (INR)', 'UTR', 'Bank Matched', 'Timestamp']);
      payments.forEach((p: any) => {
        rows.push([
          p.id,
          p.token_display,
          p.customer_name,
          p.payment_method,
          p.status,
          String(p.final_amount_inr),
          p.utr_number || '',
          p.matched_with_bank_statement ? 'YES' : 'NO',
          p.created_at,
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Archive Header Banner */}
      <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#1a0a33] to-purple-950/80 border border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>Read-Only Historical Records</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">SSPU Halloween Event Archive</h2>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Complete, immutable record of all stall queue tokens, verified UPI & cash payments, and client feedback.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => exportCsv('tokens')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-purple-200 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Tokens CSV</span>
          </button>
          <button
            onClick={() => exportCsv('payments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-purple-200 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Payments CSV</span>
          </button>
        </div>
      </div>

      {/* Snapshot Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-[#120824] border border-purple-800/60">
          <p className="text-[11px] text-purple-300/80">Total Revenue</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatInr(totalRevenue)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">UPI: {formatInr(onlineRevenue)} • Cash: {formatInr(cashRevenue)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120824] border border-purple-800/60">
          <p className="text-[11px] text-purple-300/80">Readings Completed</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{completedTokens.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Out of {tokens.length} total tokens issued</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120824] border border-purple-800/60">
          <p className="text-[11px] text-purple-300/80">Unique Customers</p>
          <p className="text-2xl font-black text-white mt-1">{customers.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">With phone & referral codes</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120824] border border-purple-800/60">
          <p className="text-[11px] text-purple-300/80">Stall Feedback Given</p>
          <p className="text-2xl font-black text-amber-300 mt-1">{feedbackItems.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Ratings & testimonials logged</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900/60 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all ${
            activeTab === 'tokens'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-purple-300/70 hover:text-white'
          }`}
        >
          Queue Tokens ({tokens.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-purple-300/70 hover:text-white'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all ${
            activeTab === 'feedback'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-purple-300/70 hover:text-white'
          }`}
        >
          Event Feedback ({feedbackItems.length})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, token #, service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-purple-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {activeTab === 'tokens' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#120824] border border-purple-800/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Token Statuses</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
            <option value="waiting">Waiting</option>
            <option value="in_session">In Session</option>
          </select>
        )}
      </div>

      {/* Tab 1: Tokens Table */}
      {activeTab === 'tokens' && (
        <div className="rounded-3xl bg-[#120824]/90 border border-purple-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1c0c38] text-purple-200 border-b border-purple-800/80 font-mono text-[11px]">
                <tr>
                  <th className="p-3.5">Token #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Service</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Cards Drawn</th>
                  <th className="p-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40 text-purple-100">
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No archived tokens found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((t: any) => (
                    <tr key={t.id} className="hover:bg-purple-950/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-300">
                        {t.token_display}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{t.customer_name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{t.customer_phone}</p>
                      </td>
                      <td className="p-3.5 text-purple-200">
                        {t.service_name}
                      </td>
                      <td className="p-3.5 font-mono">
                        {t.actual_duration_seconds ? `${Math.round(t.actual_duration_seconds / 60)} mins` : '—'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : t.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : t.status === 'no_show'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px] max-w-xs truncate text-purple-300/80">
                        {t.cards_drawn && t.cards_drawn.length > 0
                          ? t.cards_drawn.map((c: any) => c.card_name).join(', ')
                          : '—'}
                      </td>
                      <td className="p-3.5 text-[11px] text-gray-400">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments Table */}
      {activeTab === 'payments' && (
        <div className="rounded-3xl bg-[#120824]/90 border border-purple-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1c0c38] text-purple-200 border-b border-purple-800/80 font-mono text-[11px]">
                <tr>
                  <th className="p-3.5">Token</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">UTR / Reference</th>
                  <th className="p-3.5">Bank Matched</th>
                  <th className="p-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40 text-purple-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No archived payment transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-purple-950/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-300">
                        {p.token_display}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{p.customer_name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{p.customer_phone}</p>
                      </td>
                      <td className="p-3.5 uppercase font-mono text-xs">
                        {p.payment_method === 'cash' ? '💵 Cash' : '📱 UPI QR'}
                      </td>
                      <td className="p-3.5 font-black text-amber-400 text-sm">
                        {formatInr(p.final_amount_inr)}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-purple-300">
                        {p.utr_number || '—'}
                      </td>
                      <td className="p-3.5 font-bold">
                        {p.matched_with_bank_statement ? (
                          <span className="text-emerald-400 flex items-center gap-1">✓ Matched</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-[11px] text-gray-400">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Feedback Table */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedbackItems.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500 rounded-3xl bg-[#120824] border border-purple-800/80">
              No feedback ratings submitted during the event stall.
            </div>
          ) : (
            feedbackItems.map((f: any) => (
              <div key={f.id} className="p-5 rounded-3xl bg-[#120824] border border-purple-800/80 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: f.customer_feedback_stars || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-amber-300 font-bold">{f.token_display}</span>
                </div>

                <p className="text-xs text-purple-100 font-serif italic mb-4 leading-relaxed">
                  &ldquo;{f.customer_feedback_comment || 'No comment provided.'}&rdquo;
                </p>

                <div className="pt-2 border-t border-purple-900/50 flex justify-between items-center text-[11px] text-purple-300/70">
                  <span className="font-bold text-white">{f.customer_name}</span>
                  <span>{new Date(f.feedback_submitted_at || f.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
