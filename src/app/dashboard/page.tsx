'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  AlertCircle,
  Cpu,
  Inbox,
  Copy,
  CheckCircle,
  Shield,
  Clock,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboardStore } from '@/stores/dashboard-store';
import type { ApprovalRequest, AuditEntry } from '@/types';

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  executed: CheckCircle,
  approved: CheckCircle,
  rejected: XCircle,
  pending: Clock,
};

const STATUS_COLOR: Record<string, string> = {
  executed: 'text-green-400',
  approved: 'text-blue-400',
  rejected: 'text-red-400',
  pending: 'text-yellow-400',
};

export default function DashboardOverview() {
  const { copyToClipboard, copiedText } = useDashboardStore();
  const [stats, setStats] = useState({ actionsToday: 0, pendingApprovals: 0, activeAgents: 0 });
  const [recentActions, setRecentActions] = useState<AuditEntry[]>([]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch audit stats + recent entries
      const auditRes = await fetch('/api/audit?limit=5');
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        const entries = auditData.data?.entries || [];
        const auditStats = auditData.data?.stats || {};
        setRecentActions(entries);
        setStats((prev) => ({ ...prev, actionsToday: auditStats.actionsToday || entries.length }));
      }

      // Fetch pending approvals count
      const appRes = await fetch('/api/approvals?status=pending');
      if (appRes.ok) {
        const appData = await appRes.json();
        const pending = (appData.data || []).filter((a: ApprovalRequest) => a.status === 'pending');
        setStats((prev) => ({ ...prev, pendingApprovals: pending.length }));
      }

      // Fetch agent count
      const agentRes = await fetch('/api/agents');
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setStats((prev) => ({ ...prev, activeAgents: (agentData.data || []).length }));
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const mcpUrl = `https://agentvault.vercel.app/mcp/universal`;

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-6xl mx-auto">
      {/* Universal MCP URL Banner */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 shadow-xl">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Universal MCP Gateway</h1>
          <p className="text-slate-400 mb-6">
            Drop this root URL into your AI client to access all allowed services.
            To isolate access, generate specific URLs in the Agents tab.
          </p>
          <div className="flex items-center gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 group">
            <code className="text-indigo-400 flex-1 truncate font-mono text-sm">
              {mcpUrl}
            </code>
            <button
              onClick={() => copyToClipboard(mcpUrl)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              {copiedText === mcpUrl ? (
                <CheckCircle size={18} className="text-green-400" />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Zap className="text-green-500" size={20} />
            </div>
            <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              LIVE
            </span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.actionsToday}</div>
          <div className="text-sm text-slate-500">Actions processed today</div>
        </div>

        <Link
          href="/dashboard/approvals"
          className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors shadow-lg block"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertCircle className="text-amber-500" size={20} />
            </div>
            <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
              ACTION REQUIRED
            </span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.pendingApprovals}</div>
          <div className="text-sm text-slate-500">Awaiting your approval</div>
        </Link>

        <Link
          href="/dashboard/agents"
          className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:border-indigo-500/50 transition-colors block"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Cpu className="text-indigo-500" size={20} />
            </div>
            <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">
              ACTIVE AGENTS
            </span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.activeAgents}</div>
          <div className="text-sm text-slate-500">Configured MCP endpoints</div>
        </Link>
      </div>

      {/* Recent Action Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Inbox size={18} className="text-indigo-400" /> Recent Activity
          </h3>
          <Link
            href="/dashboard/logs"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            View All Logs →
          </Link>
        </div>
        <div className="divide-y divide-slate-800/50">
          {recentActions.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              <Shield size={24} className="mx-auto text-slate-700 mb-2" />
              Activity will appear here once agents start making tool calls.
            </div>
          ) : (
            recentActions.map((entry) => {
              const Icon = STATUS_ICON[entry.status] || CheckCircle;
              const color = STATUS_COLOR[entry.status] || 'text-slate-400';
              return (
                <div key={entry.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                  <Icon size={14} className={color} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-white font-medium">{entry.agentName}</span>
                    <span className="text-slate-600 mx-2">·</span>
                    <span className="text-xs text-slate-400">{entry.service} → {entry.action}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${color}`}>{entry.status}</span>
                  <span className="text-[10px] text-slate-600 font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
