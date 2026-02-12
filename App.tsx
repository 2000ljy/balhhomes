import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { UserLogin } from './views/UserLogin';
import { Registration } from './views/Registration';
import { AdminLogin } from './views/AdminLogin';
import { AdminDashboard } from './views/AdminDashboard';
import { NoticeBoard } from './views/NoticeBoard';
import { AppLayout } from './views/AppLayout';
import { AppLobby } from './views/AppLobby';
import { AppLeaderboard } from './views/AppLeaderboard';
import { AppFriends } from './views/AppFriends';
import { AppProfile } from './views/AppProfile';
import { ViewState, User } from './types';
import { getCurrentUser, initializeDatabase, updateUserHeartbeat } from './services/mockBackend';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initialize Database First
    initializeDatabase();

    // 2. Simulate database connection and session check
    const checkSession = async () => {
      // Small delay to prevent hydration mismatch and simulate net check
      await new Promise(r => setTimeout(r, 200));
      
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setCurrentView(ViewState.APP_LOBBY);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // 3. Heartbeat for Online Status
  useEffect(() => {
    if (!currentUser) return;
    
    // Beat immediately
    updateUserHeartbeat(currentUser.id);

    // Beat every 10 seconds to indicate "I am online"
    const interval = setInterval(() => {
        updateUserHeartbeat(currentUser.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView(ViewState.APP_LOBBY);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(ViewState.LOGIN);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#020205] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-t-transparent border-gold-500 rounded-full animate-spin"></div>
          <div className="text-white text-xs tracking-[0.5em] animate-pulse">CONNECTING TO DATABASE...</div>
        </div>
      </div>
    );
  }

  // If we are logged in as a regular user, use the AppLayout
  const isAppView = [ViewState.APP_LOBBY, ViewState.APP_LEADERBOARD, ViewState.APP_FRIENDS, ViewState.APP_PROFILE].includes(currentView);

  if (currentUser && isAppView) {
    return (
      <div className="min-h-screen w-full relative bg-[#020205] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#020205] to-[#020205] pointer-events-none"></div>
        <div className="fixed inset-0 stars pointer-events-none opacity-40"></div>
        
        <AppLayout 
          currentUser={currentUser} 
          currentView={currentView} 
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        >
          {currentView === ViewState.APP_LOBBY && <AppLobby currentUser={currentUser} />}
          {currentView === ViewState.APP_LEADERBOARD && <AppLeaderboard currentUser={currentUser} />}
          {currentView === ViewState.APP_FRIENDS && <AppFriends currentUser={currentUser} onUpdateUser={setCurrentUser} />}
          {currentView === ViewState.APP_PROFILE && <AppProfile currentUser={currentUser} onUpdateUser={setCurrentUser} />}
        </AppLayout>
      </div>
    );
  }

  // Otherwise use the Public/Admin Layout
  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === ViewState.LOGIN && <UserLogin onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />}
      {currentView === ViewState.REGISTER && <Registration onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />}
      {currentView === ViewState.ADMIN_LOGIN && <AdminLogin onNavigate={handleNavigate} />}
      {currentView === ViewState.ADMIN_DASHBOARD && <AdminDashboard onNavigate={handleNavigate} />}
      {currentView === ViewState.NOTICE_BOARD && <NoticeBoard onNavigate={handleNavigate} />}
    </Layout>
  );
}

export default App;