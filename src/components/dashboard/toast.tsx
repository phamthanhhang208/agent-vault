'use client';

import { Check, AlertTriangle } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';

export function Toast() {
  const toast = useDashboardStore((s) => s.toast);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border z-[100] animate-slide-in-bottom transition-all ${
        toast.type === 'success'
          ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
          : 'bg-red-950 border-red-500/50 text-red-400'
      }`}
    >
      {toast.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
      <span className="font-bold text-sm">{toast.message}</span>
    </div>
  );
}
