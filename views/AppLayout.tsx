import React from 'react';
import { ViewState, User } from '../types';
import { logoutUser } from '../services/mockBackend';
import { Users, Award, MessageSquare, User as UserIcon, LogOut } from 'lucide-react';

interface AppLayoutProps {
  currentUser: User;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentUser, currentView, onNavigate, onLogout, children }) => {
  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onNavigate(view)}
        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-wider transition-all duration-300 relative group
          ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <Icon size={16} className={isActive ? 'text-gold-500' : ''} />
        {label}
        {isActive && (
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
        )}
      </button>
    );
  };

  // Mobile Bottom Nav Item
  const MobileNavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onNavigate(view)}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200
          ${isActive ? 'text-gold-500' : 'text-gray-500 active:text-gray-300'}`}
      >
        <Icon size={20} className={isActive ? 'fill-current' : ''} />
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    // On mobile, use full screen height. On desktop, use framed container.
    <div className="w-full md:max-w-[1400px] h-screen md:h-[85vh] flex flex-col bg-[#09090b] md:bg-[#09090b]/90 backdrop-blur-xl border-x-0 md:border md:border-white/10 rounded-none md:rounded-sm shadow-2xl animate-in fade-in duration-700">
      
      {/* Top Header - Desktop & Mobile (Simplified) */}
      <header className="h-14 md:h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-black/20 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 border border-white/30 flex items-center justify-center bg-black">
            <span className="text-lg md:text-xl text-white font-serif font-bold">黑</span>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white tracking-widest brand-font">黑马相亲</h1>
            <p className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-[0.3em] hidden sm:block">BLACK HORSE DATING</p>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <nav className="hidden md:flex items-center h-full">
          <NavItem view={ViewState.APP_LOBBY} icon={Users} label="交友大厅" />
          <NavItem view={ViewState.APP_LEADERBOARD} icon={Award} label="人气排行" />
          <NavItem view={ViewState.APP_FRIENDS} icon={MessageSquare} label="我的好友" />
          <NavItem view={ViewState.APP_PROFILE} icon={UserIcon} label="个人中心" />
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-white text-xs font-bold">{currentUser.displayName || currentUser.username}</p>
            <p className="text-gold-500 text-[10px] font-mono tracking-wider">UID: {currentUser.uid || '---'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors border border-white/5 hover:border-red-500/20 rounded-sm hover:bg-red-500/10"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar - Visible only on Mobile */}
      <div className="md:hidden h-16 bg-[#0c0c0e] border-t border-white/10 flex items-center justify-around z-50 shrink-0 pb-safe">
          <MobileNavItem view={ViewState.APP_LOBBY} icon={Users} label="大厅" />
          <MobileNavItem view={ViewState.APP_LEADERBOARD} icon={Award} label="排行" />
          <MobileNavItem view={ViewState.APP_FRIENDS} icon={MessageSquare} label="消息" />
          <MobileNavItem view={ViewState.APP_PROFILE} icon={UserIcon} label="我的" />
      </div>
    </div>
  );
};