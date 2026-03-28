'use client';

import { ArrowLeft, Server } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';

export default function CreateAgentPage() {
  const { setActiveTab } = useDashboardStore();

  return (
    <div className="animate-fade-in h-full flex flex-col relative">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 z-10 px-8 py-5 shrink-0 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setActiveTab('agents')}
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

      {/* Content — TODO: Implement 3-step wizard from UI mock */}
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Server size={32} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Agent Creation Wizard</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              This wizard will walk you through naming your agent, selecting vault services,
              and configuring per-action permissions. Implementation in Phase 3.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-5 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveTab('agents')}
            className="px-6 py-2.5 rounded-lg text-slate-400 hover:text-white font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed font-bold"
          >
            <Server size={18} /> Generate MCP Server URL
          </button>
        </div>
      </div>
    </div>
  );
}
