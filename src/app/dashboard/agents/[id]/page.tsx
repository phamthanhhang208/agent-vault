'use client';

import { ArrowLeft, Cpu } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';

export default function AgentDetailPage() {
  const { setActiveTab, selectedAgentId } = useDashboardStore();

  return (
    <div className="animate-fade-in h-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 z-10 px-8 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setActiveTab('agents')}
            className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Detail</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Agent ID: {selectedAgentId || 'none'}
            </p>
          </div>
        </div>
      </div>

      {/* Content — TODO: Implement from UI mock in Phase 3 */}
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <Cpu size={32} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Agent Configuration</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            MCP URL, policy matrix editor, context injection, and audit log viewer.
            Implementation in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
}
