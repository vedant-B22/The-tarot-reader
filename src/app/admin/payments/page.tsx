'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ZoomIn, 
  FileCheck, 
  Banknote, 
  RotateCcw, 
  Download, 
  Loader2, 
  X, 
  Check, 
  ShieldAlert,
  Search
} from 'lucide-react';
import { formatInr, formatDateTime } from '@/lib/utils';
import { Payment } from '@/types';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'cash'>('pending');
  const [search, setSearch] = useState('');

  // Modals
  const [zoomScreenshotUrl, setZoomScreenshotUrl] = useState<string | null>(null);
  const [rejectModalPayment, setRejectModalPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cashModalPayment, setCashModalPayment] = useState<Payment | null>(null);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [refundModalPayment, setRefundModalPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const json = await res.json();
        setPayments(json.payments || []);
      }
    } catch (e) {
      console.warn('Payment fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, paymentId: string, extra?: any) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, paymentId, ...extra }),
      });
      if (res.ok) {
        fetchPayments();
      } else {
        const d = await res.json();
        alert(d.error || 'Action failed');
      }
    } catch {
      alert('Error updating payment');
    }
  };

  const handleCashReceivedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashModalPayment) return;
    try {
      const res = await fetch('/api/admin/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_cash',
          paymentId: cashModalPayment.id,
          cashAmountGiven: cashGiven,
        }),
      });
      if (res.ok) {
        setCashModalPayment(null);
        fetchPayments();
      } else {
        const d = await res.json();
        alert(d.error || 'Cash recording failed');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalPayment) return;
    try {
      const res = await fetch('/api/admin/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_refund',
          paymentId: refundModalPayment.id,
          refundReason,
        }),
      });
      if (res.ok) {
        setRefundModalPayment(null);
        setRefundReason('');
        fetchPayments();
      } else {
        const d = await res.json();
        alert(d.error || 'Refund failed');
      }
    } catch {
      alert('Network error');
    }
  };

  // Reconciliation summary
  const verifiedOnline = payments.filter(p => p.status === 'verified' && p.payment_method === 'upi_qr');
  const verifiedCash = payments.filter(p => p.status === 'verified' && p.payment_method === 'cash');
  const matchedBank = payments.filter(p => p.matched_with_bank_statement);

  const totalOnlineRev = verifiedOnline.reduce((sum, p) => sum + p.final_amount_inr, 0);
  const totalCashRev = verifiedCash.reduce((sum, p) => sum + p.final_amount_inr, 0);
  const totalMatchedRev = matchedBank.reduce((sum, p) => sum + p.final_amount_inr, 0);

  const filteredPayments = payments.filter(p => {
    if (filter === 'pending') {
      if (p.status !== 'pending') return false;
    } else if (filter === 'verified') {
      if (p.status !== 'verified') return false;
    } else if (filter === 'cash') {
      if (p.payment_method !== 'cash') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.customer_name?.toLowerCase().includes(q);
      const matchPhone = p.customer_phone?.toLowerCase().includes(q);
      const matchUtr = p.utr_number?.toLowerCase().includes(q);
      const matchToken = p.token_display?.toLowerCase().includes(q);
      return matchName || matchPhone || matchUtr || matchToken;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">UPI Online Verified</div>
          <div className="text-2xl font-black text-amber-300 mt-1">{formatInr(totalOnlineRev)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{verifiedOnline.length} payments approved</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Cash Collected at Stall</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatInr(totalCashRev)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{verifiedCash.length} cash collections</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Matched With Bank Statement</div>
          <div className="text-2xl font-black text-purple-300 mt-1">{formatInr(totalMatchedRev)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{matchedBank.length} verified against bank feed</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Total Stall Revenue</div>
          <div className="text-2xl font-black text-amber-200 mt-1">{formatInr(totalOnlineRev + totalCashRev)}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">End-of-day gross</div>
        </div>
      </div>

      {/* Main Verification Roster */}
      <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/50">
          <div>
            <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payments Verification & Audit Roster</span>
            </h3>
            <p className="text-xs text-purple-300/80">Inspect screenshot, verify UTR, detect duplicates & mark statement match</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/admin/export?type=payments"
              className="px-3 py-2 rounded-xl bg-purple-900/60 border border-purple-700 text-amber-200 hover:bg-purple-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-purple-900/60 text-xs w-full sm:w-auto">
            {(['pending', 'verified', 'cash', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] transition-colors ${
                  filter === mode ? 'bg-amber-400 text-black' : 'text-purple-300 hover:text-white'
                }`}
              >
                {mode === 'pending' ? `Pending (${payments.filter(p => p.status === 'pending').length})` : mode}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, phone, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/60 border border-purple-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-purple-300/60 text-xs font-semibold">
              No payments matching filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-900/40 text-[11px] uppercase tracking-wider text-purple-300/70 font-semibold">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method & Proof</th>
                  <th className="py-2.5 px-3">UTR / Transaction</th>
                  <th className="py-2.5 px-3">Bank Match</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60">
                {filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-amber-300 text-sm whitespace-nowrap">
                      {payment.token_display || '--'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-white">{payment.customer_name}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{payment.customer_phone}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-extrabold text-amber-300 text-sm">
                        {formatInr(payment.final_amount_inr)}
                      </div>
                      {payment.discount_amount_inr > 0 && (
                        <div className="text-[10px] text-emerald-400">
                          - {formatInr(payment.discount_amount_inr)} off
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {payment.payment_method === 'upi_qr' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-purple-200">UPI QR</span>
                          {payment.screenshot_path ? (
                            <button
                              onClick={() => setZoomScreenshotUrl(payment.screenshot_path)}
                              className="p-1 rounded bg-purple-900/60 hover:bg-purple-800 text-amber-300 border border-purple-700 text-[10px] flex items-center gap-1"
                              title="Zoom Screenshot"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>View Proof</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-red-400">No Screenshot</span>
                          )}

                          {payment.has_duplicate_hash && (
                            <span className="text-[10px] bg-red-950 text-red-300 border border-red-700 px-1 rounded flex items-center gap-0.5 font-bold" title="Identical screenshot image uploaded previously!">
                              <ShieldAlert className="w-3 h-3 text-red-400" />
                              <span>DUP IMAGE</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Cash at Stall</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {payment.utr_number ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-purple-200 tracking-wider text-xs">
                            {payment.utr_number}
                          </span>
                          {payment.has_duplicate_utr && (
                            <span className="text-[10px] bg-red-950 text-red-300 border border-red-700 px-1 rounded font-bold" title="Duplicate UTR Number detected!">
                              DUP UTR
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[11px]">--</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payment.matched_with_bank_statement}
                          onChange={() => handleAction('toggle_matched', payment.id)}
                          className="rounded border-purple-800 text-amber-500 w-4 h-4"
                        />
                        <span className={`text-[10px] font-bold ${
                          payment.matched_with_bank_statement ? 'text-emerald-400' : 'text-gray-500'
                        }`}>
                          {payment.matched_with_bank_statement ? 'Matched' : 'Unmatched'}
                        </span>
                      </label>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        payment.status === 'verified'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : payment.status === 'pending'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : payment.status === 'refunded'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {payment.status === 'pending' && payment.payment_method === 'upi_qr' && (
                          <>
                            <button
                              onClick={() => handleAction('verify', payment.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModalPayment(payment)}
                              className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px]"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAction('request_reupload', payment.id)}
                              className="px-1.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[10px]"
                              title="Request Re-upload"
                            >
                              Re-upload
                            </button>
                          </>
                        )}

                        {payment.status === 'pending' && payment.payment_method === 'cash' && (
                          <button
                            onClick={() => {
                              setCashModalPayment(payment);
                              setCashGiven(payment.final_amount_inr);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px]"
                          >
                            Mark Cash Received
                          </button>
                        )}

                        {payment.status === 'verified' && (
                          <button
                            onClick={() => setRefundModalPayment(payment)}
                            className="px-2 py-1 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-[10px]"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Screenshot Zoom Modal */}
      {zoomScreenshotUrl && (
        <div 
          onClick={() => setZoomScreenshotUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomScreenshotUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomScreenshotUrl}
              alt="Payment Screenshot Verification"
              className="max-h-[80vh] w-auto rounded-2xl border-2 border-purple-700 shadow-2xl object-contain bg-black"
            />
            <p className="text-xs text-purple-300 mt-2">Click anywhere to close</p>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-red-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-red-200 mb-1 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Reject Payment for {rejectModalPayment.token_display}</span>
            </h3>
            <p className="text-xs text-purple-300/80 mb-4">
              Enter a clear reason why this payment screenshot was rejected.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAction('reject', rejectModalPayment.id, { reason: rejectReason });
              setRejectModalPayment(null);
              setRejectReason('');
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Mismatched UTR / fake screenshot / unreadable amount"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl p-3 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Received Handling Modal */}
      {cashModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-amber-600 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-amber-200 mb-1 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-400" />
              <span>Cash Payment Calculator</span>
            </h3>
            <p className="text-xs text-purple-300/80 mb-4">
              {cashModalPayment.customer_name} • Token {cashModalPayment.token_display}
            </p>

            <form onSubmit={handleCashReceivedSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-black/40 border border-purple-900/50 flex justify-between items-center text-xs">
                <span className="text-purple-300">Exact Due Amount:</span>
                <span className="font-extrabold text-amber-300 text-base">{formatInr(cashModalPayment.final_amount_inr)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Cash Note Handed Over by Customer
                </label>
                <input
                  type="number"
                  min={cashModalPayment.final_amount_inr}
                  step="10"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-base font-bold"
                />
              </div>

              {cashGiven >= cashModalPayment.final_amount_inr && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 flex justify-between items-center text-xs">
                  <span className="text-emerald-300 font-bold">Change to Return to Customer:</span>
                  <span className="font-black text-emerald-300 text-base">
                    {formatInr(Math.max(0, cashGiven - cashModalPayment.final_amount_inr))}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCashModalPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Confirm Cash Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-blue-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-blue-200 mb-1 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-400" />
              <span>Issue Refund for {refundModalPayment.token_display}</span>
            </h3>
            <p className="text-xs text-purple-300/80 mb-4">
              Amount: <strong className="text-white">{formatInr(refundModalPayment.final_amount_inr)}</strong>
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Mandatory Refund Reason (Logged in Audit Trail) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Customer had emergency / reader table unavailable / double payment"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl p-3 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
