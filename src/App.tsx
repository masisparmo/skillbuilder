import React from 'react';
import { AppProvider } from './AppContext';
import { Header } from './components/Header';
import { Toasts } from './components/Toasts';
import { IdeaSection } from './components/IdeaSection';
import { WorkspaceSection } from './components/WorkspaceSection';
import { VaultModal } from './components/VaultModal';
import { ApiKeyModal } from './components/ApiKeyModal';

function AppContent() {
  return (
    <div className="bg-[#F1F5F9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans selection:bg-brand-500 selection:text-white antialiased pb-24 transition-colors duration-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col gap-6">
        <IdeaSection />
        <WorkspaceSection />
      </main>
      <VaultModal />
      <ApiKeyModal />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
