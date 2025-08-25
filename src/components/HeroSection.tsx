'use client';

import { useAppStore } from '@/lib/store';
import { ArrowRight, Code, Zap, Lightbulb, Shield, Rocket, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HeroSection() {
  const { setCurrentPanel } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Lightbulb,
      title: 'AI-Powered Wizard',
      description: 'Generate smart contracts from natural language descriptions with intelligent parameter suggestions.',
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    },
    {
      icon: Code,
      title: 'Advanced Editor',
      description: 'Full-featured IDE with syntax highlighting, intelligent autocomplete, and real-time compilation.',
      color: '#16a34a',
      gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    },
    {
      icon: Zap,
      title: 'One-Click Deploy',
      description: 'Deploy directly to Sei with integrated wallet support and comprehensive deployment tracking.',
      color: '#ea580c',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    },
  ];

  const stats = [
    { label: 'Contracts Created', value: '12,547', icon: Code },
    { label: 'Successful Deployments', value: '9,823', icon: Rocket },
    { label: 'Gas Saved (SEI)', value: '2.8M', icon: Shield },
    { label: 'Active Developers', value: '1,250', icon: Users },
  ];

  if (!mounted) {
    return (
      <div className="w-full bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 grid-bg min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div 
            className="inline-block mb-6"
            style={{
              animation: 'slideIn 0.8s ease-out',
            }}
          >
            <h1 className="text-5xl font-bold text-slate-100 mb-6 leading-tight">
              AI-Powered Smart Contract
              <span 
                className="block text-transparent bg-clip-text"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                IDE for Sei
              </span>
            </h1>
          </div>
          
          <div 
            style={{
              animation: 'slideIn 0.8s ease-out 0.2s both',
            }}
          >
            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Draft, test, and deploy contracts with zero hassle — powered by AI. 
              Professional-grade development environment for the Sei blockchain ecosystem.
            </p>
          </div>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{
              animation: 'slideIn 0.8s ease-out 0.4s both',
            }}
          >
            <button
              onClick={() => setCurrentPanel('wizard')}
              className="btn btn-primary btn-lg group"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
              }}
            >
              <span>Start in Wizard Mode</span>
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button
              onClick={() => setCurrentPanel('editor')}
              className="btn btn-secondary btn-lg group"
              style={{
                background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
                border: '1px solid #64748b',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #475569 0%, #64748b 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #334155 0%, #475569 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Open IDE</span>
              <Code className="w-5 h-5 ml-2 transition-transform group-hover:rotate-12" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div 
          className="grid md:grid-cols-3 gap-8 mt-20 mb-20"
          style={{
            animation: 'slideIn 0.8s ease-out 0.6s both',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="card group cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: '1px solid #475569',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = feature.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#475569';
              }}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ background: feature.gradient }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div 
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          style={{
            animation: 'slideIn 0.8s ease-out 0.8s both',
          }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="flex items-center justify-center mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div 
                className="text-3xl font-bold mb-2 transition-all duration-300"
                style={{
                  color: '#60a5fa',
                  textShadow: '0 2px 8px rgba(96, 165, 250, 0.3)',
                }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div 
          className="text-center mt-20 p-8 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            animation: 'slideIn 0.8s ease-out 1s both',
          }}
        >
          <h2 className="text-2xl font-bold text-slate-100 mb-4">
            Ready to Build the Future?
          </h2>
          <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
            Join thousands of developers building on Sei with StormAI. 
            Start creating professional smart contracts today.
          </p>
          <button
            onClick={() => setCurrentPanel('wizard')}
            className="btn btn-primary btn-lg"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
            }}
          >
            Get Started Now
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}