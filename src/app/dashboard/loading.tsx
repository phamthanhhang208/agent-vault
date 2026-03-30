import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
