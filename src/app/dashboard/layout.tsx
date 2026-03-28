'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Toast } from '@/components/dashboard/toast';
import { useDashboardStore } from '@/stores/dashboard-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeTab = useDashboardStore((s) => s.activeTab);

  // TODO: Replace with real pending count from API
  const pendingCount = 2;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/30">
      <Sidebar pendingCount={pendingCount} />

      <main className="flex-1 flex flex-col relative h-screen bg-slate-950/50">
        <div
          className={`flex-1 ${
            activeTab === 'approvals' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {children}
        </div>
        <Toast />
      </main>
    </div>
  );
}
