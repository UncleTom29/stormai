'use client';

import { useAppStore } from '@/lib/store';
import { MessageCircle, X } from 'lucide-react';

export function ChatToggle() {
  const { isChatOpen, toggleChat } = useAppStore();

  return (
    <button
      onClick={toggleChat}
      className="floating-button"
      title={isChatOpen ? 'Close AI Chat' : 'Open AI Chat'}
      style={{
        background: isChatOpen 
          ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        transform: isChatOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'all 0.3s ease',
        boxShadow: isChatOpen
          ? '0 8px 24px rgba(220, 38, 38, 0.4)'
          : '0 8px 24px rgba(37, 99, 235, 0.4)',
      }}
      onMouseEnter={(e) => {
        if (!isChatOpen) {
          e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.5)';
        } else {
          e.currentTarget.style.transform = 'scale(1.1) rotate(180deg)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(220, 38, 38, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isChatOpen) {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
        } else {
          e.currentTarget.style.transform = 'scale(1) rotate(180deg)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(220, 38, 38, 0.4)';
        }
      }}
    >
      {isChatOpen ? (
        <X className="w-6 h-6 text-white" style={{ transform: 'rotate(180deg)' }} />
      ) : (
        <MessageCircle className="w-6 h-6 text-white" />
      )}
      
      {/* Notification dot for new messages */}
      {!isChatOpen && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"
          style={{
            boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)',
          }}
        />
      )}
    </button>
  );
}