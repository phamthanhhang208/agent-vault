import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 text-white mb-8">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
            <Shield size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">AgentVault</span>
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-slate-400 mb-8">This page doesn&apos;t exist in any vault.</p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
