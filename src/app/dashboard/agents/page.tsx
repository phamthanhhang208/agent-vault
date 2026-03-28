'use client';

import { Plus, Cpu } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';

export default function AgentsPage() {
  const { setActiveTab } = useDashboardStore();

  return (
    <div className="space-y-6 animate-fade-in p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Agents & Policies</h2>
          <p className="text-slate-400">
            Manage individual MCP server endpoints and their specific access rules.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('create_agent')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-600/20"
        >
          <Plus size={16} /> New Agent Connection
        </button>
      </div>

      {/* Empty state */}
      <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-600 mb-4">
          <Cpu size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Agents Configured</h3>
        <p className="text-slate-400 max-w-sm mb-6">
          Create an agent to generate an MCP URL and define its vault permissions.
        </p>
        <button
          onClick={() => setActiveTab('create_agent')}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all"
        >
          Create First Agent
        </button>
      </div>
    </div>
  );
}
