import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView }) => {
  // Determine layout properties based on the current view
  const isDashboard = currentView === ViewState.ADMIN_DASHBOARD;
  
  const containerClasses = isDashboard
    ? 'max-w-[1600px] items-start pt-20' // Dashboard: Wide, top-aligned
    : 'max-w-md items-center'; // Auth: Narrow, centered

  return (
    <div className="min-h-screen w-full relative bg-[#020205] overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center font-sans selection:bg-white/20">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#020205] to-[#020205] pointer-events-none"></div>
      <div className="fixed inset-0 stars pointer-events-none opacity-40"></div>
      
      {/* Desktop App Header / Window Bar */}
      <div className="fixed top-0 w-full h-8 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-center z-50">
        <span className="text-[10px] text-gray-500 tracking-[0.2em] font-medium uppercase">
          Black Horse Dating System v1.0
        </span>
      </div>

      {/* Main Content Area */}
      <main className={`relative z-10 w-full px-4 md:px-0 flex flex-col justify-center min-h-screen ${containerClasses}`}>
        {children}
      </main>

      {/* Footer - Only show on auth screens */}
      {!isDashboard && (
        <div className="fixed bottom-4 text-center text-gray-700 text-[10px] tracking-widest z-10">
           © 2025 BLACK HORSE INC.
        </div>
      )}
    </div>
  );
};