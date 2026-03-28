'use client';

import { Clock } from 'lucide-react';

export default function LogsPage() {
  return (
    <div className="space-y-6 animate-fade-in p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Audit Logs</h2>
          <p className="text-slate-400">
            Complete immutable record of all agent activity across your vault.
          </p>
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/20">
          Export CSV
        </button>
      </div>

      {/* Table — TODO: Populate with real data in Phase 6 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service / Action</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Level</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center">
                <Clock size={24} className="mx-auto text-slate-700 mb-2" />
                <p className="text-sm text-slate-500">No audit entries yet.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Activity will be logged once agents begin making tool calls.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
