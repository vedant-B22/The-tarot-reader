'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Download, 
  Search, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { AuditLog } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/audit')
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.action.toLowerCase().includes(q) ||
      (l.admin_name && l.admin_name.toLowerCase().includes(q)) ||
      (l.entity_type && l.entity_type.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/50">
        <div>
          <h3 className="font-extrabold text-base text-amber-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Tamper-Resistant Security Audit Log</span>
          </h3>
          <p className="text-xs text-purple-300/80">
            Read-only chronological record of every administrative action, price change, and payment verification
          </p>
        </div>

        <a
          href="/api/admin/export?type=audit"
          className="px-3.5 py-2 rounded-xl bg-purple-900/60 border border-purple-700 hover:bg-purple-800 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors w-fit"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Trail CSV</span>
        </a>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Filter audit actions or admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black/60 border border-purple-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="bg-[#120824] border border-purple-900/60 rounded-2xl p-4 sm:p-5 shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-purple-300">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            <span className="text-xs">Loading audit logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-purple-300/60 text-xs font-semibold">
            No audit records yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-900/40 text-[11px] uppercase tracking-wider text-purple-300/70 font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 px-3 text-purple-300/80 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 px-3 font-sans font-bold text-amber-200 whitespace-nowrap">
                      {log.admin_name || 'System'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-purple-900/70 text-purple-200 border border-purple-700 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-300 whitespace-nowrap">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                    </td>
                    <td className="py-3 px-3 text-gray-400 max-w-xs truncate">
                      {log.new_values || log.old_values || '--'}
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
