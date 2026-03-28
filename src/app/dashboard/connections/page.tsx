'use client';

import { Plus, Github, Slack, Mail } from 'lucide-react';

const AVAILABLE_SERVICES = [
  { name: 'GitHub', icon: Github, color: 'bg-slate-900', description: 'Repositories, issues, pull requests' },
  { name: 'Slack', icon: Slack, color: 'bg-purple-600', description: 'Messages, channels, reactions' },
  { name: 'Google Workspace', icon: Mail, color: 'bg-blue-500', description: 'Drive, Gmail, Calendar' },
];

export default function ConnectionsPage() {
  return (
    <div className="space-y-6 animate-fade-in p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Vault Connections</h2>
          <p className="text-slate-400">
            Services securely connected via OAuth/Auth0. Tokens are encrypted and never exposed to agents.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-600/20">
          <Plus size={16} /> Connect Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder service cards — will be replaced with real connected services */}
        {AVAILABLE_SERVICES.map((service) => (
          <div
            key={service.name}
            className="border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-slate-600 hover:bg-slate-900/50 transition-all cursor-pointer group min-h-[220px]"
          >
            <div
              className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center text-white mb-4 shadow-lg opacity-50 group-hover:opacity-100 transition-opacity`}
            >
              <service.icon size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
              Connect {service.name}
            </p>
            <p className="text-xs text-slate-600 mt-1">{service.description}</p>
          </div>
        ))}

        {/* Generic add card */}
        <div className="border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-slate-600 hover:bg-slate-900/50 transition-all cursor-pointer group min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-4 shadow-lg">
            <Plus size={24} />
          </div>
          <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
            Add Integration
          </p>
        </div>
      </div>
    </div>
  );
}
