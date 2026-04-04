'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import type { ApprovalRequest, RiskLevel } from '@/types';

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  High: 'text-red-400 bg-red-400/10',
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Rejected' },
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Pending' | 'All'>('Pending');
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [acting, setActing] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/approvals');
      if (!res.ok) return;
      const data = await res.json();
      setApprovals(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    // Poll every 3 seconds for new approvals
    const interval = setInterval(fetchApprovals, 3000);
    return () => clearInterval(interval);
  }, [fetchApprovals]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActing(true);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, decision: action }),
      });
      if (res.ok) {
        await fetchApprovals();
        setSelected(null);
      }
    } catch {
      // silently fail
    } finally {
      setActing(false);
    }
  };

  const filtered = filter === 'Pending'
    ? approvals.filter((a) => a.status === 'pending')
    : approvals;

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="flex h-full animate-fade-in">
      {/* Left Sidebar Queue */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/30 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Action Queue</h2>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-bold rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
            {(['Pending', 'All'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
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
            <div className="flex items-center justify-center p-8">
              <Loader2 size={20} className="animate-spin text-slate-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <ShieldCheck size={32} className="mx-auto text-slate-800 mb-3" />
                <p className="text-slate-500 text-xs italic">No actions pending.</p>
                <p className="text-slate-600 text-xs mt-2">
                  Approval requests from your agents will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filtered.map((req) => {
                const statusConfig = STATUS_CONFIG[req.status];
                const StatusIcon = statusConfig.icon;
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelected(req)}
                    className={`w-full text-left p-3 hover:bg-slate-800/50 transition-colors ${
                      selected?.id === req.id ? 'bg-slate-800/70' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <StatusIcon size={14} className={`mt-0.5 shrink-0 ${statusConfig.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {req.action} on {req.service}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{req.agentName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${RISK_COLORS[req.risk]}`}>
                            {req.risk}
                          </span>
                          <span className="text-[9px] text-slate-600">
                            {new Date(req.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-700 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={32} className="text-slate-700" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              {filtered.length === 0 ? 'Queue is Empty' : 'Select a Request'}
            </h2>
            <p className="text-slate-500 text-sm max-w-xs">
              {filtered.length === 0
                ? 'All actions have been reviewed or there are no pending requests.'
                : 'Click a request on the left to view details and take action.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.action}</h2>
                <p className="text-slate-400 text-sm">on {selected.service} · by {selected.agentName}</p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].color}`}>
                {STATUS_CONFIG[selected.status].label}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agent Reasoning</h3>
                <p className="text-sm text-slate-300">{selected.intent}</p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Request Details</h3>
                <p className="text-sm text-slate-300 mb-3">{selected.detail}</p>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${RISK_COLORS[selected.risk]}`}>
                    Risk: {selected.risk}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                  {selected.resolvedAt && (
                    <span className="text-[10px] text-slate-500">
                      Resolved: {new Date(selected.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payload</h3>
                <pre className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>

              {selected.resolvedVia && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resolution</h3>
                  <p className="text-sm text-slate-300">
                    {selected.status === 'approved' ? '✅ Approved' : '❌ Rejected'} via {selected.resolvedVia}
                    {selected.resolvedAt && ` at ${new Date(selected.resolvedAt).toLocaleString()}`}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selected.status === 'pending' && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-800">
                <button
                  onClick={() => handleAction(selected.id, 'approved')}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {acting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Approve
                </button>
                <button
                  onClick={() => handleAction(selected.id, 'rejected')}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {acting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
