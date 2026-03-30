'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Cpu,
  Copy,
  CheckCircle,
  Github,
  Slack,
  Mail,
  Server,
  Loader2,
  Save,
  Clock,
  Plus,
  Ticket,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { Agent, PolicyState, ServiceName } from '@/types';
import { SERVICE_TEMPLATES } from '@/types';

const SERVICE_ICONS: Record<string, typeof Github> = {
  GitHub: Github,
  Slack: Slack,
  'Google Workspace': Mail,
  Jira: Ticket,
};

const POLICY_STATE_STYLES: Record<PolicyState, { bg: string; text: string; label: string }> = {
  allow: { bg: 'bg-emerald-500', text: 'text-white', label: 'Allow' },
  approval: { bg: 'bg-amber-500', text: 'text-white', label: 'Approval' },
  block: { bg: 'bg-red-500', text: 'text-white', label: 'Block' },
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [vaultToken, setVaultToken] = useState<string | null>(null);
  const [contextInjection, setContextInjection] = useState('');
  const [policies, setPolicies] = useState(agent?.policies || []);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/agents').then((r) => r.json()),
      fetch('/api/agents/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      }).then((r) => r.json()),
    ])
      .then(([agentsJson, tokenJson]) => {
        const found = (agentsJson.data || []).find((a: Agent) => a.id === agentId);
        if (found) {
          setAgent(found);
          setPolicies(found.policies);
          setContextInjection(found.contextInjection || '');
        }
        if (tokenJson.data?.vaultToken) {
          setVaultToken(tokenJson.data.vaultToken);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agentId]);

  const updateRule = (service: ServiceName, action: string, state: PolicyState) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.service !== service) return p;
        return {
          ...p,
          rules: p.rules.map((r) =>
            r.action === action ? { ...r, state } : r
          ),
        };
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agent.id,
          policies,
          contextInjection,
        }),
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Cpu size={32} className="text-slate-700 mb-4" />
        <p className="text-slate-400">Agent not found</p>
        <button
          onClick={() => router.push('/dashboard/agents')}
          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
        >
          ← Back to Agents
        </button>
      </div>
    );
  }

  const mcpUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/mcp/${agent.serverId}`;

  return (
    <div className="animate-fade-in h-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 z-10 px-8 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/agents')}
              className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    agent.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  {agent.status}
                </span>
                Created {new Date(agent.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/logs')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Clock size={16} /> View Audit Logs
          </button>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {/* MCP Endpoint Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            MCP Endpoint URL
          </p>
          <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 mb-4">
            <code className="text-indigo-400 flex-1 truncate font-mono text-sm">{mcpUrl}</code>
            <button
              onClick={() => copyText(mcpUrl, 'url')}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              {copied === 'url' ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>

          {vaultToken && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Bearer Token
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <code className="text-amber-400 flex-1 truncate font-mono text-sm">{vaultToken}</code>
                <button
                  onClick={() => copyText(vaultToken, 'token')}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  {copied === 'token' ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-500">Rate limit: {agent.rateLimit.toLocaleString()}/hr</span>
            <span className={`text-xs ${agent.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
              ● {agent.status === 'active' ? 'Accepting connections' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Policy Matrix */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Granular Policy Matrix</h3>
          <div className="space-y-4">
            {policies.map((policy) => {
              const Icon = SERVICE_ICONS[policy.service] || Server;
              return (
                <div
                  key={policy.service}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
                    <Icon size={18} className="text-slate-400" />
                    <span className="text-white font-bold text-sm">{policy.service}</span>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {policy.rules.map((rule) => (
                      <div key={rule.action} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <code className="text-sm font-mono text-slate-300">{rule.action}</code>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {rule.action.includes('read') || rule.action.includes('list')
                              ? 'Read-only operation'
                              : rule.action.includes('delete')
                              ? 'Destructive operation — HIGH RISK'
                              : 'Write operation'}
                          </p>
                        </div>
                        <div className="flex gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                          {(['allow', 'approval', 'block'] as PolicyState[]).map((state) => {
                            const style = POLICY_STATE_STYLES[state];
                            const active = rule.state === state;
                            return (
                              <button
                                key={state}
                                onClick={() => updateRule(policy.service, rule.action, state)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                                  active
                                    ? `${style.bg} ${style.text} shadow-sm`
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {style.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Context Injection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Advanced: Context Injection</h3>
          <p className="text-xs text-slate-500 mb-4 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-[9px] font-bold uppercase">
              Advisory
            </span>
            The agent is encouraged but not forced to follow these instructions.
          </p>
          <textarea
            value={contextInjection}
            onChange={(e) => {
              setContextInjection(e.target.value);
              setHasChanges(true);
            }}
            placeholder="e.g. Always create issues in the 'backlog' project. Never delete repositories without confirmation."
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-mono"
          />
        </div>

        {/* Save button */}
        {hasChanges && (
          <div className="sticky bottom-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" /> Danger Zone
          </h3>
          <div className="space-y-3">
            {/* Pause/Resume */}
            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <div>
                <p className="text-sm text-white font-medium">
                  {agent.status === 'active' ? 'Pause Agent' : 'Resume Agent'}
                </p>
                <p className="text-xs text-slate-500">
                  {agent.status === 'active'
                    ? 'Temporarily stop accepting MCP connections'
                    : 'Resume accepting MCP connections'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const newStatus = agent.status === 'active' ? 'paused' : 'active';
                  await fetch('/api/agents', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: agent.id, status: newStatus }),
                  });
                  setAgent({ ...agent, status: newStatus });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  agent.status === 'active'
                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                {agent.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                {agent.status === 'active' ? 'Pause' : 'Resume'}
              </button>
            </div>

            {/* Delete */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-white font-medium">Delete Agent</p>
                <p className="text-xs text-slate-500">
                  Permanently remove this agent and revoke its MCP URL
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to delete this agent? This cannot be undone.')) return;
                  await fetch('/api/agents', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: agent.id }),
                  });
                  router.push('/dashboard/agents');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-all border border-red-500/20"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
