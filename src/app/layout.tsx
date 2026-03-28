import type { Metadata } from 'next';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentVault — Permission Vaults for AI Agents',
  description: 'Connect once, control everything, plug into any agent.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-300 antialiased">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
