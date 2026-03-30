'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Cpu,
  Terminal,
} from 'lucide-react';
import type { ApprovalRequest, RiskLevel } from '@/types';

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string }> = {
  Low: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  High: { bg: 'bg-red-500/10', text: 'text-red-500' },
};

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-500', icon: XCircle },
};

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<'Pending' | 'All'>('Pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const status = filter === 'Pending' ? '?status=pending' : '';
      const res = await fetch(`/api/approvals${status}`);
      const json = await res.json();
      setRequests(json.data || []);
    } catch {
      console.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
    // Auto-refresh every 5 seconds for pending requests
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleDecision = async (requestId: string, decision: 'approved' | 'rejected') => {
    setActing(true);
    try {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, decision }),
      });
      await fetchRequests();
    } catch {
      console.error('Failed to process decision');
    } finally {
      setActing(false);
    }
  };

  const selected = requests.find((r) => r.id === selectedId);

  const filteredRequests = searchQuery
    ? requests.filter(
        (r) =>
          r.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.action.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : requests;

  return (
    <div className="flex h-full animate-fade-in">
      {/* Left Sidebar Queue */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/30 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-300"
            />
          </div>
          <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
            {(['Pending', 'All'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setSelectedId(null);
                }}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  filter === f
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-indigo-500" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <ShieldCheck size={32} className="text-slate-800 mb-3" />
              <p className="text-slate-500 text-xs italic">No actions {filter === 'Pending' ? 'pending' : 'found'}.</p>
              <p className="text-slate-600 text-xs mt-2">
                Approval requests from your agents will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filteredRequests.map((request) => {
                const statusStyle = STATUS_STYLES[request.status];
                const riskStyle = RISK_STYLES[request.risk];
                const isSelected = selectedId === request.id;

                return (
                  <button
                    key={request.id}
                    onClick={() => setSelectedId(request.id)}
                    className={`w-full text-left px-4 py-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                        : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">
                        {request.agentName}
                      </span>
                      <span
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <statusStyle.icon size={10} />
                        {request.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] text-slate-400 font-mono truncate">
                        {request.service}:{request.action}
                      </code>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${riskStyle.bg} ${riskStyle.text}`}
                      >
                        {request.risk}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-slate-950">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <code className="text-xs text-slate-500 font-mono">{selected.id}</code>
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  STATUS_STYLES[selected.status].bg
                } ${STATUS_STYLES[selected.status].text}`}
              >
                {(() => { const Icon = STATUS_STYLES[selected.status].icon; return <Icon size={12} />; })()}
                {selected.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {selected.service}: {selected.action}
            </h2>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu size={14} className="text-indigo-400" />
                {selected.agentName}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  RISK_STYLES[selected.risk].bg
                } ${RISK_STYLES[selected.risk].text}`}
              >
                {selected.risk} Risk
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* CIBA Notice */}
            {selected.status === 'pending' && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">Awaiting your approval</p>
                  <p className="text-xs text-amber-500/70 mt-1">
                    Check your Auth0 Guardian app for a push notification, or approve below.
                  </p>
                </div>
              </div>
            )}

            {/* Agent Intent */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Agent Intent
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-300 italic font-serif">&ldquo;{selected.intent}&rdquo;</p>
              </div>
            </div>

            {/* Payload */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <Terminal size={12} /> Request Payload
              </p>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 overflow-x-auto">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </div>

            {/* Security Analysis */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <Shield size={12} /> Security Analysis
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Risk Level</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      RISK_STYLES[selected.risk].bg
                    } ${RISK_STYLES[selected.risk].text}`}
                  >
                    {selected.risk}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Service</span>
                  <span className="text-xs text-white font-medium">{selected.service}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Action</span>
                  <code className="text-xs text-indigo-400 font-mono">{selected.action}</code>
                </div>
                {selected.resolvedVia && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Resolved via</span>
                    <span className="text-xs text-white font-medium capitalize">{selected.resolvedVia}</span>
                  </div>
                )}
                {selected.resolvedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Resolved at</span>
                    <span className="text-xs text-slate-300">
                      {new Date(selected.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer — Approve/Reject buttons (only for pending) */}
          {selected.status === 'pending' && (
            <div className="px-8 py-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl flex items-center justify-end gap-3">
              <button
                onClick={() => handleDecision(selected.id, 'rejected')}
                disabled={acting}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold transition-all text-sm border border-red-500/20"
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => handleDecision(selected.id, 'approved')}
                disabled={acting}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all text-sm shadow-lg shadow-emerald-600/20"
              >
                {acting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Approve & Execute
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-950">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-slate-700" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {filteredRequests.length > 0 ? 'Select a Request' : 'Queue is Empty'}
          </h2>
          <p className="text-slate-500 text-sm max-w-xs">
            {filteredRequests.length > 0
              ? 'Click a request on the left to view details and take action.'
              : 'All actions have been reviewed or there are no pending requests matching your filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
