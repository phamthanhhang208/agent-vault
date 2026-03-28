import { create } from 'zustand';
import type { DashboardTab, ToastMessage } from '@/types';

interface DashboardStore {
  // Navigation
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;

  // Selections
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  selectedConnectionService: string | null;
  setSelectedConnectionService: (service: string | null) => void;

  // Filters
  approvalFilter: 'Pending' | 'All';
  setApprovalFilter: (filter: 'Pending' | 'All') => void;

  // Toast
  toast: ToastMessage | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  clearToast: () => void;

  // Clipboard
  copiedText: string | null;
  copyToClipboard: (text: string) => void;

  // Navigation helpers
  navigateToApproval: (requestId: string) => void;
  navigateToAgentDetail: (agentId: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Selections
  selectedRequestId: null,
  setSelectedRequestId: (id) => set({ selectedRequestId: id }),
  selectedAgentId: null,
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  selectedConnectionService: null,
  setSelectedConnectionService: (service) => set({ selectedConnectionService: service }),

  // Filters
  approvalFilter: 'Pending',
  setApprovalFilter: (filter) => set({ approvalFilter: filter, selectedRequestId: null }),

  // Toast
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),

  // Clipboard
  copiedText: null,
  copyToClipboard: (text) => {
    navigator.clipboard.writeText(text).catch(() => {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
    set({ copiedText: text });
    setTimeout(() => set({ copiedText: null }), 2000);
  },

  // Navigation helpers
  navigateToApproval: (requestId) =>
    set({ activeTab: 'approvals', selectedRequestId: requestId }),
  navigateToAgentDetail: (agentId) =>
    set({ activeTab: 'agent_detail', selectedAgentId: agentId }),
}));
