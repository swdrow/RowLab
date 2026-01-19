import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Anchor, Settings, Sparkles } from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { loadAthletes, loadBoats, loadShells, loadErgData } from '../utils/csvParser';
import { preloadHeadshots } from '../utils/fileLoader';
import LoginModal from '../components/Auth/LoginModal';
import RegisterModal from '../components/Auth/RegisterModal';
import AdminPanel from '../components/Auth/AdminPanel';
import LineupAssistant, { AIAssistantButton } from '../components/AI/LineupAssistant';
import { Sidebar } from '../components/compound/Sidebar';

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMinimized, setAiMinimized] = useState(false);

  const {
    setAthletes,
    setBoatConfigs,
    setShells,
    setErgData,
    setHeadshotMap,
  } = useLineupStore();

  const { user, accessToken: token, initialize, logout } = useAuthStore();
  const { features } = useSettingsStore();
  const aiEnabled = features.aiAssistant;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const athletesData = await loadAthletes('/api/data/athletes.csv');
        setAthletes(athletesData);

        const boatsData = await loadBoats('/data/boats.csv');
        setBoatConfigs(boatsData);

        const shellsData = await loadShells('/data/shells.csv');
        setShells(shellsData);

        const ergData = await loadErgData('/data/erg_data_template.csv');
        setErgData(ergData);

        const headshotMap = await preloadHeadshots(athletesData);
        setHeadshotMap(headshotMap);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-deep">
        <div className="text-center">
          {/* Glowing brand icon */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blade-green/20 border border-blade-green/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,153,0.3)]">
            <Anchor className="w-7 h-7 text-blade-green animate-pulse" />
          </div>
          <p className="text-text-muted font-mono text-sm tracking-wider uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-deep">
        <div className="p-8 max-w-md text-center rounded-2xl bg-void-surface border border-white/[0.06] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-danger-red/20 border border-danger-red/30 flex items-center justify-center">
            <X className="w-6 h-6 text-danger-red" />
          </div>
          <p className="text-danger-red mb-4 font-medium">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-blade-green text-void-deep font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,229,153,0.4)] hover:translate-y-[-2px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-deep">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSettingsClick={() => {
          setSidebarOpen(false);
          setShowAdminPanel(true);
        }}
      />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="main-content">
        {/* Topbar with glass morphism */}
        <header className="topbar bg-void-surface/80 backdrop-blur-xl saturate-[180%] border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="menu-button w-9 h-9 rounded-lg bg-void-elevated/50 border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-void-elevated hover:border-white/[0.1] transition-all duration-200 md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="font-display text-lg font-semibold text-text-primary">
              {location.pathname === '/app' && 'Dashboard'}
              {location.pathname === '/app/lineup' && 'Lineup Builder'}
              {location.pathname === '/app/athletes' && 'Athletes'}
              {location.pathname === '/app/erg' && 'Erg Data'}
              {location.pathname === '/app/analytics' && 'Analytics'}
              {location.pathname === '/app/settings' && 'Settings'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {token && user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="w-9 h-9 rounded-lg bg-void-elevated/50 border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-void-elevated hover:border-white/[0.1] transition-all duration-200"
                    title="Admin Panel"
                  >
                    <Settings size={16} />
                  </button>
                )}
                {aiEnabled && (
                  <button
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className="w-9 h-9 rounded-lg bg-coxswain-violet/20 border border-coxswain-violet/30 flex items-center justify-center text-coxswain-violet hover:bg-coxswain-violet/30 hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all duration-200"
                    title="AI Assistant"
                  >
                    <Sparkles size={16} />
                  </button>
                )}
                <span className="text-sm text-text-muted hidden sm:block px-2">
                  {user.name || user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-lg bg-void-elevated/50 border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-danger-red hover:bg-danger-red/10 hover:border-danger-red/30 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-lg bg-blade-green text-void-deep font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,229,153,0.4)] hover:translate-y-[-1px]"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col bg-void-deep">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex-1 flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      {/* AI Assistant */}
      <AnimatePresence>
        {showAIAssistant && (
          <LineupAssistant
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            isMinimized={aiMinimized}
            onToggleMinimize={() => setAiMinimized(!aiMinimized)}
          />
        )}
      </AnimatePresence>

      {/* AI Floating Button (shows when assistant is closed and AI is enabled) */}
      {!showAIAssistant && aiEnabled && token && (
        <AIAssistantButton onClick={() => setShowAIAssistant(true)} />
      )}
    </div>
  );
}

export default AppLayout;
