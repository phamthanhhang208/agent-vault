'use client';

import { useUser } from '@auth0/nextjs-auth0';
import {
  Shield,
  ArrowRight,
  Github,
  Slack,
  Mail,
  Lock,
  Cpu,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Terminal,
} from 'lucide-react';
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
            <div className="w-24 h-10 skeleton" />
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
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6">
          {/* Hero Section */}
          <section className="flex items-center justify-center min-h-[60vh] py-20">
            <div className="max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium mb-8 animate-slide-up stagger-1">
                <Lock size={14} />
                Auth0 Token Vault + MCP Protocol
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6 animate-slide-up stagger-2">
                Permission vaults
                <br />
                <span className="text-indigo-400">for AI agents</span>
              </h1>

              <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up stagger-3">
                Connect your services once. Define granular permissions. Generate an MCP server URL
                that any AI agent can plug into — with full audit logging and human-in-the-loop approval.
              </p>

              <div className="flex items-center justify-center gap-4 mb-16 animate-slide-up stagger-4">
                <a
                  href="/auth/login"
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 text-base animate-pulse-glow"
                >
                  Get Started <ArrowRight size={18} />
                </a>
                <a
                  href="https://github.com/phamthanhhang208/agent-vault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-slate-600 hover:bg-slate-900 text-white rounded-xl font-medium transition-all text-base"
                >
                  <Github size={18} /> View Source
                </a>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left animate-slide-up stagger-5">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/30 transition-all">
                  <div className="p-2.5 bg-indigo-500/10 rounded-lg w-fit mb-4">
                    <Cpu className="text-indigo-400" size={20} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Any Agent, One URL</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Claude Code, Cursor, OpenClaw — paste an MCP URL and it just works.
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-amber-500/30 transition-all">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg w-fit mb-4">
                    <Shield className="text-amber-400" size={20} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Granular Permissions</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Allow, require approval, or block — per action, per service, per agent.
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg w-fit mb-4">
                    <Activity className="text-emerald-400" size={20} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Full Audit Trail</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Every tool call logged. Every approval tracked. Complete visibility.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-20 border-t border-slate-800/50">
            <h2 className="text-3xl font-bold text-white text-center mb-4">How It Works</h2>
            <p className="text-slate-400 text-center mb-12 max-w-lg mx-auto">
              Three steps to secure your AI agents. No code changes to your agent required.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  1
                </div>
                <h3 className="text-white font-bold mb-2">Connect Services</h3>
                <p className="text-sm text-slate-400">
                  Link GitHub, Slack, or Google via OAuth. Auth0 Token Vault stores tokens securely.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  2
                </div>
                <h3 className="text-white font-bold mb-2">Set Permissions</h3>
                <p className="text-sm text-slate-400">
                  Choose Allow, Require Approval, or Block for every action on every service.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  3
                </div>
                <h3 className="text-white font-bold mb-2">Copy MCP URL</h3>
                <p className="text-sm text-slate-400">
                  Paste the URL into any MCP client. Your agent discovers only permitted tools.
                </p>
              </div>
            </div>

            {/* MCP Config Example */}
            <div className="max-w-lg mx-auto mt-12">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2 bg-slate-950/50">
                  <Terminal size={14} className="text-slate-500" />
                  <span className="text-xs text-slate-500 font-mono">mcp.json</span>
                </div>
                <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto">
{`{
  "mcpServers": {
    "vault": {
      "url": "https://agentvault.vercel.app/mcp/srv_abc",
      "headers": {
        "Authorization": "Bearer avt_your_token"
      }
    }
  }
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Approval Flow Visual */}
          <section className="py-20 border-t border-slate-800/50">
            <h2 className="text-3xl font-bold text-white text-center mb-4">Human-in-the-Loop</h2>
            <p className="text-slate-400 text-center mb-12 max-w-lg mx-auto">
              Write actions pause and wait for your approval via push notification or dashboard.
            </p>

            <div className="max-w-2xl mx-auto flex flex-col gap-3">
              {[
                { time: '10:00 AM', service: 'GitHub', action: 'repos.read', status: 'executed', icon: CheckCircle, color: 'text-emerald-500' },
                { time: '10:01 AM', service: 'GitHub', action: 'issues.create', status: 'pending → approved', icon: CheckCircle, color: 'text-emerald-500' },
                { time: '10:02 AM', service: 'Gmail', action: 'gmail.send', status: 'blocked', icon: XCircle, color: 'text-red-500' },
                { time: '10:05 AM', service: 'Slack', action: 'chat.write', status: 'pending → denied', icon: XCircle, color: 'text-red-500' },
              ].map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3 bg-slate-900 border border-slate-800 rounded-xl"
                >
                  <span className="text-xs text-slate-500 font-mono w-20">{entry.time}</span>
                  <code className="text-xs text-indigo-400 font-mono flex-1">
                    {entry.service}:{entry.action}
                  </code>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${entry.color}`}>
                    <entry.icon size={14} />
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Service logos */}
          <section className="py-16 border-t border-slate-800/50">
            <div className="flex items-center justify-center gap-6 text-slate-600">
              <span className="text-xs uppercase tracking-widest font-bold">Supported Services</span>
              <div className="flex gap-3">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800"><Github size={20} /></div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800"><Slack size={20} /></div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800"><Mail size={20} /></div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
              <span className="text-xs text-slate-700">+ 25 more via Auth0</span>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>Built for the Authorized to Act hackathon · April 2026</span>
          <a
            href="https://github.com/phamthanhhang208/agent-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
