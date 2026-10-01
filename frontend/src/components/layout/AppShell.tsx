import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { RouteProgressBar } from './RouteProgressBar';
import { GlobalSearch } from '../shared/GlobalSearch';
import { Toaster } from 'sonner';

export const AppShell: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      {/* Route Progress Bar */}
      <RouteProgressBar />

      {/* Left Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div key={location.pathname} className="page-enter flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Global Command Palette */}
      <GlobalSearch />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};
