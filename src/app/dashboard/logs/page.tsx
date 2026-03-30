'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  Zap,
} from 'lucide-react';
import type { AuditEntry, AuditStatus, RiskLevel } from '@/types';

const STATUS_STYLES: Record<AuditStatus, { bg: string; text: string; label: string }> = {
  executed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Executed' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Approved' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Rejected' },
  blocked: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'Blocked' },
};

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string }> = {
  Low: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  High: { bg: 'bg-red-500/10', text: 'text-red-500' },
};

const RESOLVED_LABELS: Record<string, string> = {
  auto: '⚡ Auto',
  dashboard: '🖥️ Dashboard',
  ciba: '📱 Guardian',
};

export default function LogsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState({ actionsToday: 0, totalActions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit?limit=100')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setEntries(json.data.entries || []);
          setStats(json.data.stats || { actionsToday: 0, totalActions: 0 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Agent', 'Service', 'Action', 'Risk', 'Status', 'Resolved Via', 'Duration (ms)'];
    const rows = entries.map((e) => [
      e.timestamp,
      e.agentName,
      e.service,
      e.action,
      e.risk,
      e.status,
      e.resolvedVia || '',
      e.executionMs.toString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentvault-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Audit Logs</h2>
          <p className="text-slate-400">
            Complete immutable record of all agent activity across your vault.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap size={14} className="text-emerald-500" />
              <span className="text-white font-bold">{stats.actionsToday}</span> today
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              <span className="text-white font-bold">{stats.totalActions}</span> total
            </span>
          </div>
          <button
            onClick={exportCSV}
            disabled={entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/20"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Service / Action
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Via
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Loader2 size={24} className="mx-auto animate-spin text-indigo-500" />
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Clock size={24} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-sm text-slate-500">No audit entries yet.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Activity will be logged once agents begin making tool calls.
                  </p>
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const statusStyle = STATUS_STYLES[entry.status];
                const riskStyle = RISK_STYLES[entry.risk];

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-white font-medium">
                      {entry.agentName}
                    </td>
                    <td className="px-6 py-3">
                      <code className="text-xs text-indigo-400 font-mono">
                        {entry.service}:{entry.action}
                      </code>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskStyle.bg} ${riskStyle.text}`}
                      >
                        {entry.risk}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {entry.status === 'executed' || entry.status === 'approved' ? (
                          <CheckCircle size={10} />
                        ) : entry.status === 'rejected' ? (
                          <XCircle size={10} />
                        ) : (
                          <Shield size={10} />
                        )}
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">
                      {entry.resolvedVia ? RESOLVED_LABELS[entry.resolvedVia] || entry.resolvedVia : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 font-mono text-right">
                      {entry.executionMs}ms
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
