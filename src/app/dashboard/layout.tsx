'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Toast } from '@/components/dashboard/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = () => {
      fetch('/api/approvals?status=pending')
        .then((r) => r.json())
        .then((json) => setPendingCount((json.data || []).length))
        .catch(() => {});
    };

    fetchPending();
    // Refresh pending count every 10 seconds
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

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
