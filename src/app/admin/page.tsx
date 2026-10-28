'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  PhoneCall, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Pause, 
  Play, 
  Sparkles, 
  Star, 
  Flame, 
  BookOpen, 
  AlertCircle, 
  RefreshCw, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  Send
} from 'lucide-react';
import { formatInr, formatDateTime, playMysticalChime } from '@/lib/utils';
import { QueueToken, Reader, StallSettings, QueueLiveMetrics } from '@/types';

export default function AdminQueueDashboard() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [activeTokens, setActiveTokens] = useState<QueueToken[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [settings, setSettings] = useState<StallSettings | null>(null);
  const [metrics, setMetrics] = useState<QueueLiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filter, setFilter] = useState<'active' | 'waiting' | 'in_session' | 'all'>('active');

  // Modal States
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [completeModalToken, setCompleteModalToken] = useState<QueueToken | null>(null);
  const [selectedReaderId, setSelectedReaderId] = useState<string>('');

  // Complete session modal fields
  const [readerNotes, setReaderNotes] = useState('');
  const [cardsDrawnInput, setCardsDrawnInput] = useState<{ card: string; position: string; interpretation: string }[]>([
    { card: 'The Fool', position: 'Present State', interpretation: 'A leap of faith into new adventures' }
  ]);
  const [publishSummary, setPublishSummary] = useState(true);

  // Walk-in modal fields
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServiceId, setWalkinServiceId] = useState('');
  const [walkinServices, setWalkinServices] = useState<any[]>([]);

  const fetchQueueData = async () => {
    try {
      const res = await fetch('/api/admin/queue');
      if (res.ok) {
        const json = await res.json();
        setTokens(json.tokens || []);
        setActiveTokens(json.activeTokens || []);
        setReaders(json.readers || []);
        setSettings(json.settings || null);
        setMetrics(json.metrics || null);
        if (!selectedReaderId && json.readers?.length > 0) {
          setSelectedReaderId(json.readers[0].id);
        }
      }
    } catch (e) {
      console.warn('Queue fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Fetch services for walkin registration
    fetch('/api/admin/services?activeOnly=true')
      .then(res => res.json())
      .then(data => {
        setWalkinServices(data.services || []);
        if (data.services?.length > 0) setWalkinServiceId(data.services[0].id);
      })
      .catch(() => {});

    // SSE Realtime listener
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');
      eventSource.addEventListener('queue_update', () => fetchQueueData());
      eventSource.addEventListener('payment_verified', () => {
        playMysticalChime('bell');
        fetchQueueData();
      });
      eventSource.addEventListener('token_called', () => fetchQueueData());
    } catch {
      // Fallback
    }

    const interval = setInterval(fetchQueueData, 5000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleCallNext = async () => {
    try {
      const res = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'call_next', readerId: selectedReaderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to call next token');
        return;
      }
      playMysticalChime('alert');
      fetchQueueData();
    } catch {
      alert('Network error');
    }
  };

  const handleTokenAction = async (action: string, tokenId: string, extra?: any) => {
    try {
      const res = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tokenId, ...extra }),
      });
      if (res.ok) {
        fetchQueueData();
      } else {
        const d = await res.json();
        alert(d.error || 'Action failed');
      }
    } catch {
      alert('Error updating token');
    }
  };

  const handleToggleQueuePause = async () => {
    if (!settings) return;
    const newStatus = !settings.is_queue_open;
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_queue_open: newStatus }),
      });
      fetchQueueData();
    } catch {
      alert('Failed to toggle queue pause');
    }
  };

  const handleCompleteSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalToken) return;

    await handleTokenAction('complete_session', completeModalToken.id, {
      notes: readerNotes,
      cardsDrawn: cardsDrawnInput,
      publishSummary,
    });

    setCompleteModalToken(null);
    setReaderNotes('');
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: walkinName,
          phone: walkinPhone,
          service_id: walkinServiceId,
          payment_method: 'cash',
        }),
      });
      if (res.ok) {
        setWalkinModalOpen(false);
        setWalkinName('');
        setWalkinPhone('');
        fetchQueueData();
      } else {
        const d = await res.json();
        alert(d.error || 'Walk-in failed');
      }
    } catch {
      alert('Network error');
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center p-12 text-purple-300">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const displayedTokens = filter === 'active'
    ? activeTokens
    : filter === 'waiting'
    ? tokens.filter(t => t.status === 'waiting')
    : filter === 'in_session'
    ? tokens.filter(t => t.status === 'in_session' || t.status === 'called')
    : tokens;

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Waiting in Line</div>
          <div className="text-2xl font-black text-amber-300 mt-1">{metrics?.totalWaiting || 0}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">In Session</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{metrics?.totalInSession || 0}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Completed Readings</div>
          <div className="text-2xl font-black text-purple-300 mt-1">{metrics?.totalCompleted || 0}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Pending UPI Verify</div>
          <div className="text-2xl font-black text-orange-400 mt-1">{metrics?.pendingVerificationCount || 0}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Total Revenue</div>
          <div className="text-2xl font-black text-amber-200 mt-1">{formatInr(metrics?.totalRevenueInr || 0)}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#140a28] border border-purple-900/50">
          <div className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Avg Session Time</div>
          <div className="text-xl font-black text-amber-300 mt-1">
            {metrics?.avgSessionMinutes ? `${metrics.avgSessionMinutes} mins` : 'Calculating...'}
          </div>
        </div>
      </div>

      {/* Reader Tables & Session Status */}
      <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Reader Tables & Live Sessions</span>
            </h3>
            <p className="text-xs text-purple-300/80">Current tarot readers at the stall</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setWalkinModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-purple-900/60 border border-purple-700 hover:bg-purple-800 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Walk-In</span>
            </button>

            <button
              onClick={handleToggleQueuePause}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                settings?.is_queue_open
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/80'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/80'
              }`}
            >
              {settings?.is_queue_open ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Queue</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Queue</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reader Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {readers.map((reader) => {
            const currentToken = activeTokens.find(t => t.assigned_reader_id === reader.id && (t.status === 'in_session' || t.status === 'called'));

            return (
              <div key={reader.id} className="p-3.5 rounded-xl bg-black/40 border border-purple-900/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-amber-200">{reader.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      currentToken?.status === 'in_session'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : currentToken?.status === 'called'
                        ? 'bg-amber-500 text-black font-black animate-pulse'
                        : 'bg-gray-900 text-gray-400'
                    }`}>
                      {currentToken?.status === 'in_session' ? 'In Session' : currentToken?.status === 'called' ? 'Calling...' : 'Ready'}
                    </span>
                  </div>

                  {currentToken ? (
                    <div className="bg-purple-950/30 p-2.5 rounded-xl border border-purple-900/30 text-xs">
                      <div className="font-mono font-bold text-amber-300 text-base">{currentToken.token_display}</div>
                      <div className="text-gray-300 font-semibold">{currentToken.customer_name} ({currentToken.service_name})</div>
                      <div className="text-[11px] text-purple-300/80 mt-1">Topic: {currentToken.focus_topic}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-purple-300/40 py-4 text-center">
                      No active reading session
                    </div>
                  )}
                </div>

                {currentToken && (
                  <div className="mt-3 pt-2 border-t border-purple-900/30 flex gap-2">
                    {currentToken.status === 'called' && (
                      <button
                        onClick={() => handleTokenAction('mark_in_session', currentToken.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Start Session
                      </button>
                    )}
                    {currentToken.status === 'in_session' && (
                      <button
                        onClick={() => setCompleteModalToken(currentToken)}
                        className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Queue Table & Call Next Controls */}
      <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/50">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Live Queue Roster</span>
            </h3>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-purple-900/60 text-xs">
              {(['active', 'waiting', 'in_session', 'all'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] transition-colors ${
                    filter === mode ? 'bg-amber-400 text-black' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Call Next Widget */}
          <div className="flex items-center gap-2">
            <select
              value={selectedReaderId}
              onChange={(e) => setSelectedReaderId(e.target.value)}
              className="bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none"
            >
              {readers.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <button
              onClick={handleCallNext}
              disabled={activeTokens.filter(t => t.status === 'waiting').length === 0}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all whitespace-nowrap min-h-[38px]"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>CALL NEXT WAITING</span>
            </button>
          </div>
        </div>

        {/* Tokens List Table */}
        <div className="overflow-x-auto">
          {displayedTokens.length === 0 ? (
            <div className="p-8 text-center text-purple-300/60 text-xs font-semibold">
              No customers in the queue yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-900/40 text-[11px] uppercase tracking-wider text-purple-300/70 font-semibold">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Focus Area</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60">
                {displayedTokens.map((token) => (
                  <tr key={token.id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-amber-300 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{token.token_display}</span>
                        {token.is_priority && (
                          <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1 rounded uppercase font-bold">
                            VIP
                          </span>
                        )}
                        {token.is_walkin && (
                          <span className="text-[9px] bg-purple-900 text-purple-200 px-1 rounded">
                            Walk-in
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-white">{token.customer_name}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{token.customer_phone}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-purple-200 font-medium">{token.service_name}</div>
                      <div className="text-[10px] text-gray-400">~{token.service_duration}m • {token.service_cards} cards</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-amber-300/90 uppercase">{token.focus_topic}</span>
                      {token.custom_focus_text && (
                        <div className="text-[10px] text-gray-300 truncate max-w-[150px]">{token.custom_focus_text}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-amber-200">{formatInr(token.final_amount_inr || 0)}</div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        token.payment_status === 'verified'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {token.payment_method === 'cash' ? 'Cash' : 'UPI'}: {token.payment_status || 'Pending'}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        token.status === 'waiting'
                          ? 'bg-purple-900/60 text-purple-200 border border-purple-700'
                          : token.status === 'called'
                          ? 'bg-amber-500 text-black animate-pulse font-black'
                          : token.status === 'in_session'
                          ? 'bg-emerald-600 text-white'
                          : token.status === 'completed'
                          ? 'bg-purple-800 text-purple-200'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {token.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {token.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => handleTokenAction('call_next', token.id, { readerId: selectedReaderId })}
                              className="px-2 py-1 rounded bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400"
                              title="Call this customer"
                            >
                              Call
                            </button>
                            <button
                              onClick={() => handleTokenAction('mark_noshow', token.id)}
                              className="px-2 py-1 rounded bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 text-[11px]"
                              title="Mark No-Show"
                            >
                              No-Show
                            </button>
                          </>
                        )}

                        {token.status === 'called' && (
                          <>
                            <button
                              onClick={() => handleTokenAction('mark_in_session', token.id)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => handleTokenAction('requeue', token.id)}
                              className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-[11px]"
                            >
                              Requeue
                            </button>
                          </>
                        )}

                        {token.status === 'in_session' && (
                          <button
                            onClick={() => setCompleteModalToken(token)}
                            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
                          >
                            Finish
                          </button>
                        )}

                        <button
                          onClick={() => handleTokenAction('priority_bump', token.id, { isPriority: !token.is_priority })}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold ${
                            token.is_priority ? 'bg-amber-500 text-black' : 'text-purple-300 hover:text-white'
                          }`}
                          title="Toggle VIP priority"
                        >
                          VIP
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Complete Reading Modal */}
      {completeModalToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-purple-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <h3 className="text-base font-black text-amber-200 mb-1 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Complete Session for {completeModalToken.token_display}</span>
            </h3>
            <p className="text-xs text-purple-300/80 mb-4">
              {completeModalToken.customer_name} • {completeModalToken.service_name}
            </p>

            <form onSubmit={handleCompleteSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Private Reader Notes & Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Private notes (aura, themes, or insights for this customer)..."
                  value={readerNotes}
                  onChange={(e) => setReaderNotes(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Card Drawn Log (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Card 1: The Sun, Card 2: Two of Cups"
                  value={cardsDrawnInput[0]?.card || ''}
                  onChange={(e) => setCardsDrawnInput([{ card: e.target.value, position: 'Drawn Card', interpretation: 'Insight' }])}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pubSumm"
                  checked={publishSummary}
                  onChange={(e) => setPublishSummary(e.target.checked)}
                  className="rounded border-purple-800 text-amber-500 w-4 h-4"
                />
                <label htmlFor="pubSumm" className="text-xs text-purple-200 font-medium">
                  Share summary notes to customer's live token screen
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setCompleteModalToken(null)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Confirm Reading Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Walk-in Registration Modal */}
      {walkinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#120824] border border-purple-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-base font-black text-amber-200 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <span>Register Stall Walk-in Customer</span>
            </h3>
            <p className="text-xs text-purple-300/80 mb-4">
              Instantly create a token for a customer standing at the stall.
            </p>

            <form onSubmit={handleWalkinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Patil"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="Optional 10-digit number"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">
                  Service Selection *
                </label>
                <select
                  value={walkinServiceId}
                  onChange={(e) => setWalkinServiceId(e.target.value)}
                  className="w-full bg-black/60 border border-purple-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  {walkinServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatInr(s.price_inr)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Create & Activate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
