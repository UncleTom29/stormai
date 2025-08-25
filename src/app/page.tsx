'use client';

import { useAppStore } from '@/lib/store';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { ChatToggle } from '@/components/ChatToggle';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Suspense, lazy } from 'react';

// Lazy load heavy components for better performance
const WizardPanel = lazy(() => 
  import('@/components/WizardPanel').then(module => ({ default: module.WizardPanel }))
);
const EditorPanel = lazy(() => 
  import('@/components/EditorPanel').then(module => ({ default: module.EditorPanel }))
);
const DeployPanel = lazy(() => 
  import('@/components/DeployPanel').then(module => ({ default: module.DeployPanel }))
);
const DashboardPanel = lazy(() => 
  import('@/components/DashboardPanel').then(module => ({ default: module.DashboardPanel }))
);
const AIChatSidebar = lazy(() => 
  import('@/components/AIChatSidebar').then(module => ({ default: module.AIChatSidebar }))
);

// Loading component for panels
const PanelLoading = () => (
  <div className="flex items-center justify-center h-full bg-slate-900">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-slate-400">Loading panel...</p>
    </div>
  </div>
);

export default function Home() {
  const { currentPanel, isChatOpen, isLoading } = useAppStore();

  const renderCurrentPanel = () => {
    switch (currentPanel) {
      case 'wizard':
        return (
          <Suspense fallback={<PanelLoading />}>
            <WizardPanel />
          </Suspense>
        );
      case 'editor':
        return (
          <Suspense fallback={<PanelLoading />}>
            <EditorPanel />
          </Suspense>
        );
      case 'deploy':
        return (
          <Suspense fallback={<PanelLoading />}>
            <DeployPanel />
          </Suspense>
        );
      case 'dashboard':
        return (
          <Suspense fallback={<PanelLoading />}>
            <DashboardPanel />
          </Suspense>
        );
      default:
        return <HeroSection />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navigation />
      
      <div className="flex h-screen pt-16">
        <main className="flex-1 overflow-hidden">
          {renderCurrentPanel()}
        </main>
        
        {isChatOpen && (
          <Suspense fallback={<div className="w-96 bg-slate-800 border-l border-slate-700" />}>
            <AIChatSidebar />
          </Suspense>
        )}
      </div>

      <ChatToggle />
      {isLoading && <LoadingOverlay />}
    </div>
  );
}