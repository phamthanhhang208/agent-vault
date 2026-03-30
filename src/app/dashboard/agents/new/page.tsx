'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Server,
  Github,
  Slack,
  Mail,
  Check,
  Loader2,
  Copy,
  CheckCircle,
  Ticket,
} from 'lucide-react';
import type { Policy, PolicyRule, PolicyState, ServiceName } from '@/types';
import { SERVICE_TEMPLATES } from '@/types';

const SERVICE_ICONS: Record<string, typeof Github> = {
  GitHub: Github,
  Slack: Slack,
  'Google Workspace': Mail,
  Jira: Ticket,
};

const SERVICE_COLORS: Record<string, string> = {
  GitHub: 'bg-slate-800',
  Slack: 'bg-purple-600',
  'Google Workspace': 'bg-blue-500',
  Jira: 'bg-blue-600',
};

const POLICY_STATE_STYLES: Record<PolicyState, { bg: string; text: string; label: string }> = {
  allow: { bg: 'bg-emerald-500', text: 'text-white', label: 'Allow' },
  approval: { bg: 'bg-amber-500', text: 'text-white', label: 'Approval' },
  block: { bg: 'bg-red-500', text: 'text-white', label: 'Block' },
};

export default function CreateAgentPage() {
  const router = useRouter();

  // Step 1: Identity
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Services
  const [selectedServices, setSelectedServices] = useState<Set<ServiceName>>(new Set());

  // Step 3: Policies
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Result
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ mcpUrl: string; vaultToken: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const toggleService = (service: ServiceName) => {
    const next = new Set(selectedServices);
    if (next.has(service)) {
      next.delete(service);
      setPolicies((prev) => prev.filter((p) => p.service !== service));
    } else {
      next.add(service);
      // Add default policy from template
      const template = SERVICE_TEMPLATES[service];
      if (template) {
        setPolicies((prev) => [
          ...prev,
          { service, rules: [...template.defaultRules] },
        ]);
      }
    }
    setSelectedServices(next);
  };

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
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, policies }),
      });
      const json = await res.json();
      if (json.data) {
        setResult({
          mcpUrl: json.data._mcpUrl,
          vaultToken: json.data._vaultToken,
        });
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const canCreate = name.trim().length > 0 && selectedServices.size > 0;

  // Success view
  if (result) {
    return (
      <div className="animate-fade-in h-full flex flex-col items-center justify-center p-8">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Agent Created!</h2>
          <p className="text-slate-400 mb-8">
            Copy the MCP configuration below and paste it into your AI agent&apos;s settings.
          </p>

          {/* MCP Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                MCP Server URL
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <code className="text-indigo-400 flex-1 truncate font-mono text-sm">
                  {result.mcpUrl}
                </code>
                <button
                  onClick={() => copyText(result.mcpUrl, 'url')}
                  className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white"
                >
                  {copied === 'url' ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Vault Token
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <code className="text-amber-400 flex-1 truncate font-mono text-sm">
                  {result.vaultToken}
                </code>
                <button
                  onClick={() => copyText(result.vaultToken, 'token')}
                  className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white"
                >
                  {copied === 'token' ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Example MCP Client Config
              </p>
              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
{JSON.stringify({
  mcpServers: {
    agentvault: {
      url: result.mcpUrl,
      headers: {
        Authorization: `Bearer ${result.vaultToken}`,
      },
    },
  },
}, null, 2)}
              </pre>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/agents')}
            className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all"
          >
            Go to Agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col relative">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 z-10 px-8 py-5 shrink-0 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/agents')}
            className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server size={20} className="text-indigo-500" /> Create New Agent Endpoint
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Generate a secure MCP endpoint with custom vault policies.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Step 1: Agent Identity */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Agent Identity</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                  Agent Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. DevOps Copilot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Code review and issue management assistant"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Select Services */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Connect Vault Services</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(SERVICE_TEMPLATES).map(([key, template]) => {
                const service = key as ServiceName;
                const Icon = SERVICE_ICONS[service] || Server;
                const selected = selectedServices.has(service);
                const colorBg = SERVICE_COLORS[service] || 'bg-slate-800';

                return (
                  <button
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                      selected
                        ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                        : 'border-slate-800 hover:border-slate-600 bg-slate-900/50'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`w-12 h-12 rounded-xl ${colorBg} flex items-center justify-center text-white mb-4 shadow-lg`}
                    >
                      <Icon size={24} />
                    </div>
                    <h4 className="text-white font-bold mb-1">{service}</h4>
                    <p className="text-xs text-slate-500">
                      {template.defaultRules.length} actions available
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3: Policy Matrix */}
          {policies.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-white">Configure Policy Matrix</h3>
              </div>

              <div className="space-y-4">
                {policies.map((policy) => {
                  const Icon = SERVICE_ICONS[policy.service] || Server;
                  return (
                    <div
                      key={policy.service}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                    >
                      {/* Service header */}
                      <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
                        <Icon size={18} className="text-slate-400" />
                        <span className="text-white font-bold text-sm">{policy.service}</span>
                      </div>

                      {/* Rules */}
                      <div className="divide-y divide-slate-800/50">
                        {policy.rules.map((rule) => (
                          <div
                            key={rule.action}
                            className="px-6 py-4 flex items-center justify-between"
                          >
                            <div>
                              <code className="text-sm font-mono text-slate-300">
                                {rule.action}
                              </code>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {rule.action.includes('read') || rule.action.includes('list')
                                  ? 'Read-only operation'
                                  : rule.action.includes('delete')
                                  ? 'Destructive operation — HIGH RISK'
                                  : 'Write operation'}
                              </p>
                            </div>

                            {/* Toggle buttons */}
                            <div className="flex gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                              {(['allow', 'approval', 'block'] as PolicyState[]).map((state) => {
                                const style = POLICY_STATE_STYLES[state];
                                const active = rule.state === state;
                                return (
                                  <button
                                    key={state}
                                    onClick={() =>
                                      updateRule(policy.service, rule.action, state)
                                    }
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
            </section>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-5 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/agents')}
            className="px-6 py-2.5 rounded-lg text-slate-400 hover:text-white font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || creating}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold transition-all ${
              canCreate && !creating
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {creating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Server size={18} />
                Generate MCP Server URL
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
