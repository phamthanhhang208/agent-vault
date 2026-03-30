'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Toast } from '@/components/dashboard/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // TODO: Replace with real pending count from API
  const pendingCount = 0;

  const isApprovals = pathname === '/dashboard/approvals';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/30">
      <Sidebar pendingCount={pendingCount} />

      <main className="flex-1 flex flex-col relative h-screen bg-slate-950/50">
        <div className={`flex-1 ${isApprovals ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </div>
        <Toast />
      </main>
    </div>
  );
}
