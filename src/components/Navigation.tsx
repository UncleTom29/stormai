'use client';

import { useAppStore } from '@/lib/store';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useAccount } from 'wagmi';

export function Navigation() {
  const { currentPanel, setCurrentPanel } = useAppStore();
  const { setShowAuthFlow, user } = useDynamicContext();
  const { isConnected, address } = useAccount();

  const navItems = [
    { id: 'wizard', label: 'Wizard' },
    { id: 'editor', label: 'Editor' },
    { id: 'deploy', label: 'Deploy' },
    { id: 'dashboard', label: 'Dashboard' },
  ] as const;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnectWallet = () => {
    if (isConnected) {
      // If connected, show disconnect options
      const shouldDisconnect = confirm('Disconnect wallet?');
      if (shouldDisconnect) {
        // Handle disconnect logic here
      }
    } else {
      // If not connected, show auth flow
      setShowAuthFlow(true);
    }
  };

  return (
    <nav className="nav">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <span className="nav-brand">StormAI</span>
            <span className="badge badge-info text-xs">v1.0.0</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPanel(item.id)}
                className={`nav-link ${
                  currentPanel === item.id ? 'active' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-slate-400">Sei Network</span>
          </div>
          
          <button
            onClick={handleConnectWallet}
            className={`btn ${
              isConnected
                ? 'btn-success'
                : 'btn-primary'
            }`}
          >
            {isConnected && address ? formatAddress(address) : 'Connect Wallet'}
          </button>
          
          <div 
            className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center"
            style={{ 
              background: user?.email ? 'linear-gradient(135deg, #334155 0%, #475569 100%)' : '#475569',
              border: '1px solid #64748b'
            }}
          >
            <span className="text-xs font-medium text-slate-200">
              {user?.email?.[0]?.toUpperCase() || ''}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}