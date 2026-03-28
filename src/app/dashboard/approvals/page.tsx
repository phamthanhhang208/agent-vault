'use client';

import { ShieldCheck, Search } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';

export default function ApprovalsPage() {
  const { approvalFilter, setApprovalFilter } = useDashboardStore();

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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-300"
            />
          </div>
          <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
            {(['Pending', 'All'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setApprovalFilter(f)}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  approvalFilter === f
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <ShieldCheck size={32} className="mx-auto text-slate-800 mb-3" />
            <p className="text-slate-500 text-xs italic">No actions pending.</p>
            <p className="text-slate-600 text-xs mt-2">
              Approval requests from your agents will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* Right Detail Panel */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-950">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck size={32} className="text-slate-700" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Queue is Empty</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          All actions have been reviewed or there are no pending requests matching your filter.
        </p>
      </div>
    </div>
  );
}
