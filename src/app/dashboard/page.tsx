'use client';

import {
  Zap,
  AlertCircle,
  Cpu,
  Inbox,
  Copy,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';

export default function DashboardOverview() {
  const { setActiveTab, copyToClipboard, copiedText } = useDashboardStore();

  // TODO: Replace with real data from API
  const stats = {
    actionsToday: 124,
    pendingApprovals: 2,
    activeAgents: 2,
  };

  const mcpUrl = `https://agentvault.vercel.app/mcp/universal_${Math.random().toString(36).substring(2, 9)}`;

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

        <div
          className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors shadow-lg"
          onClick={() => setActiveTab('approvals')}
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
        </div>

        <div
          className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:border-indigo-500/50 transition-colors"
          onClick={() => setActiveTab('agents')}
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
        </div>
      </div>

      {/* Recent Action Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Inbox size={18} className="text-indigo-400" /> Recent Action Queue
          </h3>
          <button
            onClick={() => setActiveTab('approvals')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Open Approval Manager &rarr;
          </button>
        </div>
        <div className="divide-y divide-slate-800/50">
          {/* TODO: Replace with real data */}
          <div className="px-6 py-4 text-center text-sm text-slate-500">
            <Shield size={24} className="mx-auto text-slate-700 mb-2" />
            Action queue will appear here once agents are configured.
          </div>
        </div>
      </div>
    </div>
  );
}
