'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { Shield, ArrowRight, Github, Slack, Mail, Lock, Cpu, Activity } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { user, isLoading } = useUser();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Nav */}
      <header className="border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
              <Shield size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">AgentVault</span>
          </div>
          {isLoading ? (
            <div className="w-24 h-10 bg-slate-800 rounded-lg animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-600/20"
            >
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <a
              href="/auth/login"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-600/20"
            >
              Sign In <ArrowRight size={16} />
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium mb-8">
            <Lock size={14} />
            Auth0 Token Vault + MCP Protocol
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Permission vaults
            <br />
            <span className="text-indigo-400">for AI agents</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Connect your services once. Define granular permissions. Generate an MCP server URL
            that any AI agent can plug into — with full audit logging and human-in-the-loop approval.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <a
              href="/auth/login"
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 text-base"
            >
              Get Started <ArrowRight size={18} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-slate-600 hover:bg-slate-900 text-white rounded-xl font-medium transition-all text-base"
            >
              <Github size={18} /> View Source
            </a>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="p-2.5 bg-indigo-500/10 rounded-lg w-fit mb-4">
                <Cpu className="text-indigo-400" size={20} />
              </div>
              <h3 className="text-white font-bold mb-2">Any Agent, One URL</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Claude Code, Cursor, OpenClaw — paste an MCP URL and it just works.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="p-2.5 bg-amber-500/10 rounded-lg w-fit mb-4">
                <Shield className="text-amber-400" size={20} />
              </div>
              <h3 className="text-white font-bold mb-2">Granular Permissions</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Allow, require approval, or block — per action, per service, per agent.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg w-fit mb-4">
                <Activity className="text-emerald-400" size={20} />
              </div>
              <h3 className="text-white font-bold mb-2">Full Audit Trail</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every tool call logged. Every approval tracked. Complete visibility.
              </p>
            </div>
          </div>

          {/* Service logos */}
          <div className="mt-16 flex items-center justify-center gap-6 text-slate-600">
            <span className="text-xs uppercase tracking-widest font-bold">Supported Services</span>
            <div className="flex gap-3">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><Github size={18} /></div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><Slack size={18} /></div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><Mail size={18} /></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
