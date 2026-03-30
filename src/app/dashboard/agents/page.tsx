'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Cpu,
  Copy,
  CheckCircle,
  Github,
  Slack,
  Mail,
  Loader2,
  Pause,
  Play,
  Ticket,
} from 'lucide-react';
import Link from 'next/link';
import type { Agent, ServiceName } from '@/types';

const SERVICE_ICONS: Record<string, typeof Github> = {
  GitHub: Github,
  Slack: Slack,
  'Google Workspace': Mail,
  Jira: Ticket,
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((json) => setAgents(json.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyUrl = (agent: Agent) => {
    const url = `${window.location.origin}/api/mcp/${agent.serverId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(agent.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getServiceNames = (agent: Agent): ServiceName[] =>
    agent.policies.map((p) => p.service);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Agents & Policies</h2>
          <p className="text-slate-400">
            Manage individual MCP server endpoints and their specific access rules.
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-600/20"
        >
          <Plus size={16} /> New Agent Connection
        </Link>
      </div>

      {agents.length === 0 ? (
        /* Empty state */
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-600 mb-4">
            <Cpu size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Agents Configured</h3>
          <p className="text-slate-400 max-w-sm mb-6">
            Create an agent to generate an MCP URL and define its vault permissions.
          </p>
          <Link
            href="/dashboard/agents/new"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all"
          >
            Create First Agent
          </Link>
        </div>
      ) : (
        /* Agent cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{agent.name}</h3>
                    {agent.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{agent.description}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    agent.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}
                >
                  {agent.status === 'active' ? (
                    <Play size={10} />
                  ) : (
                    <Pause size={10} />
                  )}
                  {agent.status}
                </span>
              </div>

              {/* MCP URL */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  MCP Endpoint
                </p>
                <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <code className="text-indigo-400 flex-1 truncate font-mono text-xs">
                    {window.location.origin}/api/mcp/{agent.serverId}
                  </code>
                  <button
                    onClick={() => copyUrl(agent)}
                    className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    {copiedId === agent.id ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Services */}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Services
                </p>
                <div className="flex gap-1.5">
                  {getServiceNames(agent).map((service) => {
                    const Icon = SERVICE_ICONS[service] || Cpu;
                    return (
                      <div
                        key={service}
                        title={service}
                        className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400"
                      >
                        <Icon size={14} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rate limit + Manage */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-500">
                  {agent.rateLimit.toLocaleString()}/hr limit
                </span>
                <Link
                  href={`/dashboard/agents/${agent.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Manage Policy →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
