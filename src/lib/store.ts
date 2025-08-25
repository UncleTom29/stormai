/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Contract {
  id: string;
  name: string;
  symbol?: string;
  type: 'erc20' | 'erc721' | 'erc1155' | 'governance' | 'custom';
  sourceCode: string;
  bytecode?: string;
  abi?: any[];
  features: string[];
  parameters?: Record<string, any>;
  status: 'draft' | 'compiled' | 'deployed';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deployment {
  id: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: bigint;
  gasUsed: bigint;
  gasPrice: bigint;
  network: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  contractId: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  isUser: boolean;
}

interface AppState {
  // UI State
  currentPanel: 'hero' | 'wizard' | 'editor' | 'deploy' | 'dashboard';
  isChatOpen: boolean;
  isLoading: boolean;
  
  // Contract State
  currentContract: Contract | null;
  contracts: Contract[];
  deployments: Deployment[];
  
  // Chat State
  chatMessages: ChatMessage[];
  
  // Actions
  setCurrentPanel: (panel: AppState['currentPanel']) => void;
  toggleChat: () => void;
  setLoading: (loading: boolean) => void;
  
  setCurrentContract: (contract: Contract | null) => void;
  addContract: (contract: Contract) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  
  addDeployment: (deployment: Deployment) => void;
  updateDeployment: (id: string, updates: Partial<Deployment>) => void;
  
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentPanel: 'hero',
      isChatOpen: false,
      isLoading: false,
      currentContract: null,
      contracts: [],
      deployments: [],
      chatMessages: [],
      
      // Actions
      setCurrentPanel: (panel) => set({ currentPanel: panel }),
      toggleChat: () => set({ isChatOpen: !get().isChatOpen }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      setCurrentContract: (contract) => set({ currentContract: contract }),
      addContract: (contract) => set({ contracts: [...get().contracts, contract] }),
      updateContract: (id, updates) => set({
        contracts: get().contracts.map(c => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
        ),
        currentContract: get().currentContract?.id === id 
          ? { ...get().currentContract!, ...updates, updatedAt: new Date() } 
          : get().currentContract
      }),
      deleteContract: (id) => set({
        contracts: get().contracts.filter(c => c.id !== id),
        currentContract: get().currentContract?.id === id ? null : get().currentContract
      }),
      
      addDeployment: (deployment) => set({ deployments: [...get().deployments, deployment] }),
      updateDeployment: (id, updates) => set({
        deployments: get().deployments.map(d => 
          d.id === id ? { ...d, ...updates } : d
        )
      }),
      
      addChatMessage: (message) => set({ chatMessages: [...get().chatMessages, message] }),
      clearChat: () => set({ chatMessages: [] }),
    }),
    {
      name: 'stormai-storage',
      partialize: (state) => ({
        contracts: state.contracts,
        deployments: state.deployments,
        chatMessages: state.chatMessages.slice(-50), // Keep only last 50 messages
      }),
    }
  )
);