'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Github,
  Slack,
  Mail,
  Settings,
  CheckCircle,
  Loader2,
  X,
  ExternalLink,
  Unplug,
  Shield,
} from 'lucide-react';
import type { VaultConnection, ServiceName } from '@/types';

interface ServiceConfig {
  name: ServiceName;
  icon: typeof Github;
  color: string;
  iconBg: string;
  description: string;
  actions: string[];
}

const SERVICES: ServiceConfig[] = [
  {
    name: 'GitHub',
    icon: Github,
    color: 'text-white',
    iconBg: 'bg-slate-800',
    description: 'Repositories, issues, pull requests',
    actions: ['repos.read', 'repos.write', 'repos.delete', 'issues.*'],
  },
  {
    name: 'Slack',
    icon: Slack,
    color: 'text-purple-400',
    iconBg: 'bg-purple-600',
    description: 'Messages, channels, reactions',
    actions: ['chat.read', 'chat.write', 'channels.manage'],
  },
  {
    name: 'Google Workspace',
    icon: Mail,
    color: 'text-blue-400',
    iconBg: 'bg-blue-500',
    description: 'Drive, Gmail, Calendar',
    actions: ['drive.read', 'drive.write', 'gmail.send'],
  },
];

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<VaultConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceConfig | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show toast from URL params (after OAuth redirect)
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      setToast({ message: `${connected} connected successfully!`, type: 'success' });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/connections');
    }
    if (error) {
      setToast({ message: error, type: 'error' });
      window.history.replaceState({}, '', '/dashboard/connections');
    }
  }, [searchParams]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/connections');
      const json = await res.json();
      setConnections(json.data || []);
    } catch {
      console.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const isConnected = (service: ServiceName) =>
    connections.some((c) => c.service === service);

  const getConnection = (service: ServiceName) =>
    connections.find((c) => c.service === service);

  const handleConnect = async (service: ServiceName) => {
    setConnecting(service);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setToast({ message: json.error || 'Failed to start connection', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to connect', type: 'error' });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (service: ServiceName) => {
    try {
      await fetch('/api/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });
      setConnections((prev) => prev.filter((c) => c.service !== service));
      setSelectedService(null);
      setToast({ message: `${service} disconnected`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to disconnect', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Vault Connections</h2>
          <p className="text-slate-400">
            Services securely connected via OAuth/Auth0. Tokens are encrypted and never exposed to agents.
          </p>
        </div>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          const connected = isConnected(service.name);
          const connection = getConnection(service.name);
          const isConnecting = connecting === service.name;

          return (
            <div
              key={service.name}
              className={`relative rounded-2xl border transition-all ${
                connected
                  ? 'bg-slate-900 border-slate-700 shadow-xl'
                  : 'border-2 border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/50'
              }`}
            >
              {/* Connected badge */}
              {connected && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Connected
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Icon + Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center text-white shadow-lg ${
                      !connected ? 'opacity-50' : ''
                    }`}
                  >
                    <service.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{service.name}</h3>
                    <p className="text-xs text-slate-500">{service.description}</p>
                  </div>
                </div>

                {connected && connection ? (
                  <>
                    {/* Scopes */}
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        OAuth Scopes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {connection.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded-md border border-slate-700"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Connected since */}
                    <p className="text-xs text-slate-500 mb-4">
                      Connected {new Date(connection.connectedAt).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedService(service)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                      >
                        <Settings size={14} /> Settings
                      </button>
                    </div>
                  </>
                ) : (
                  /* Connect button */
                  <button
                    onClick={() => handleConnect(service.name)}
                    disabled={isConnecting}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-600/20 disabled:shadow-none"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink size={16} />
                        Connect {service.name}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Integration placeholder */}
        <div className="border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-slate-600 hover:bg-slate-900/50 transition-all cursor-pointer group min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-4 shadow-lg">
            <Plus size={24} />
          </div>
          <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
            Add Integration
          </p>
          <p className="text-xs text-slate-600 mt-1">Coming soon</p>
        </div>
      </div>

      {/* Connection Settings Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedService(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${selectedService.iconBg} flex items-center justify-center text-white shadow-lg`}
                >
                  <selectedService.icon size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold">{selectedService.name}</h3>
                  <p className="text-xs text-slate-500">Connection Settings</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* OAuth Scopes */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  <Shield size={12} className="inline mr-1" />
                  OAuth Scopes Granted
                </p>
                <div className="space-y-2">
                  {getConnection(selectedService.name)?.scopes.map((scope) => (
                    <div
                      key={scope}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg"
                    >
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <code className="text-xs text-slate-300 font-mono">{scope}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Actions */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Available Agent Actions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedService.actions.map((action) => (
                    <span
                      key={action}
                      className="px-2.5 py-1 text-xs font-mono bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleDisconnect(selectedService.name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg font-medium transition-all text-sm border border-red-500/20"
                >
                  <Unplug size={16} />
                  Revoke Access & Disconnect
                </button>
                <p className="text-[10px] text-slate-600 text-center mt-2">
                  This will revoke all agent access to this service.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
              : 'bg-red-950 border-red-800 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={18} className="text-emerald-500" />
          ) : (
            <X size={18} className="text-red-500" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      )}
    </div>
  );
}
