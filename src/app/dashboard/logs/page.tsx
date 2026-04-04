'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Loader2,
  Download,
} from 'lucide-react';
import type { AuditEntry, AuditStatus } from '@/types';

const STATUS_CONFIG: Record<AuditStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  executed: { icon: CheckCircle, color: 'text-green-400', label: 'Executed' },
  approved: { icon: CheckCircle, color: 'text-blue-400', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', label: 'Rejected' },
  blocked: { icon: Shield, color: 'text-slate-500', label: 'Blocked' },
};

const RISK_COLORS: Record<string, string> = {
  Low: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  High: 'text-red-400 bg-red-400/10',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit');
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.data?.entries || data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Agent', 'Service', 'Action', 'Risk', 'Status', 'Resolved Via', 'Duration (ms)'];
    const rows = logs.map((l) => [
      l.timestamp,
      l.agentName,
      l.service,
      l.action,
      l.risk,
      l.status,
      l.resolvedVia || '',
      String(l.executionMs || 0),
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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Audit Logs</h2>
          <p className="text-slate-400">
            Complete immutable record of all agent activity across your vault.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service / Action</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Via</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Loader2 size={24} className="mx-auto text-slate-500 animate-spin mb-2" />
                  <p className="text-sm text-slate-500">Loading audit logs...</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
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
              logs.map((log) => {
                const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.executed;
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-xs text-white font-medium">
                      {log.agentName}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-slate-300">{log.service}</span>
                      <span className="text-slate-600 mx-1">·</span>
                      <span className="text-xs text-slate-400 font-mono">{log.action}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${RISK_COLORS[log.risk] || RISK_COLORS.Low}`}>
                        {log.risk}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {log.resolvedVia || '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                      {log.executionMs ? `${log.executionMs}ms` : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600 text-center">
        {logs.length} entries · Auto-refreshes every 5s
      </p>
    </div>
  );
}
