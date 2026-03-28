'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import {
  Shield,
  Activity,
  ShieldCheck,
  Key,
  User,
  Clock,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';
import type { DashboardTab } from '@/types';

interface NavItem {
  tab: DashboardTab;
  matchTabs?: DashboardTab[];  // also highlight for these tabs
  icon: typeof Activity;
  label: string;
  getBadge?: () => number;
}

const NAV_ITEMS: NavItem[] = [
  { tab: 'dashboard', icon: Activity, label: 'Overview' },
  { tab: 'approvals', icon: ShieldCheck, label: 'Action Queue' },
  { tab: 'connections', icon: Key, label: 'Vault Connections' },
  { tab: 'agents', matchTabs: ['create_agent', 'agent_detail'], icon: User, label: 'Agents & Policies' },
  { tab: 'logs', icon: Clock, label: 'Audit Logs' },
];

export function Sidebar({ pendingCount }: { pendingCount: number }) {
  const { activeTab, setActiveTab } = useDashboardStore();
  const { user } = useUser();

  const isActive = (item: NavItem) => {
    if (activeTab === item.tab) return true;
    if (item.matchTabs?.includes(activeTab)) return true;
    return false;
  };

  return (
    <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-950 z-50 shrink-0 relative shadow-2xl">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 text-white mb-8">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
            <Shield size={22} />
          </div>
          <span className="font-bold text-xl tracking-tight">AgentVault</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const badge = item.tab === 'approvals' ? pendingCount : 0;

            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      active
                        ? 'bg-white text-indigo-600'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 space-y-4 border-t border-slate-800/50">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
            <Shield size={12} /> Enterprise Plan
          </div>
          <p className="text-[11px] text-slate-500">Secure limits active.</p>
        </div>
        {user && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 min-w-0">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <User size={12} />
                </div>
              )}
              <span className="text-xs text-slate-400 truncate">{user.email}</span>
            </div>
            <a
              href="/api/auth/logout"
              className="text-[10px] text-slate-500 hover:text-red-400 font-medium transition-colors shrink-0"
            >
              Log out
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
