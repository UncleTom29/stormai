'use client';

import { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Processing...' }: LoadingOverlayProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="loading-overlay"
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div className="text-center">
        {/* Modern Spinner */}
        <div 
          className="relative w-16 h-16 mx-auto mb-6"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        >
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, #2563eb 90deg, transparent 360deg)',
              animation: 'spin 1.5s linear infinite',
            }}
          />
          <div 
            className="absolute inset-1 rounded-full bg-slate-900"
            style={{
              background: 'radial-gradient(circle, #0f172a 60%, transparent 100%)',
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              boxShadow: '0 0 12px #2563eb',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h3 
            className="text-xl font-semibold text-slate-100"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {message}{dots}
          </h3>
          <p className="text-slate-400 text-sm">
            This may take a few moments
          </p>
        </div>
        
        {/* Progress Indicator */}
        <div className="mt-8 w-64 mx-auto">
          <div 
            className="h-1 bg-slate-700 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
            }}
          >
            <div 
              className="h-full bg-blue-600 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                animation: 'shimmer 2s ease-in-out infinite',
                width: '100%',
                transform: 'translateX(-100%)',
              }}
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}