import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import DashboardOverview from './components/DashboardOverview';
import PassportPhotoGenerator from './components/PassportPhotoGenerator';
import PhotoResizer from './components/PhotoResizer';
import SheetSettings from './components/SheetSettings';
import WalletManagement from './components/WalletManagement';
import CalculatorPage from './components/CalculatorPage';
import QuickDocumentFinder from './components/QuickDocumentFinder';
import PscPhotoCreator from './components/PscPhotoCreator';
import SslcCalculator from './components/SslcCalculator';
import NewEntryScreen from './components/NewEntryScreen';
import ServiceManagement from './components/ServiceManagement';
import StaffManagement from './components/StaffManagement';
import { getCurrentSession, logoutSession } from './services/googleSheetsAuth';
import MenuRounded from '@mui/icons-material/MenuRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';

// ── Page title map (matches Windows app pageTitles list) ──────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  'new-entry': 'New Entry',
  'saved-bills': 'Saved Bills',
  wallet: 'Wallets Balance',
  calculator: 'Calculator',
  'document-finder': 'Application Forms',
  passport: 'Passport Photo Creator',
  'psc-photo': 'PSC Photo Creator',
  resizer: 'Photo Resizer',
  'sslc-calc': 'SSLC Calculator',
  'service-reports': 'Service Reports',
  expenses: 'Expenses',
  settings: 'Sheet Config',
  'service-management': 'Service Management',
  'staff-management': 'Staff Management',
  nameslip: 'Nameslip',
};

// ── Top Bar Component (matches Windows 70px white header) ─────────────────────
function TopBar({ currentView, onRefresh, isRefreshing, onMenuClick, showMenu }) {
  const title = PAGE_TITLES[currentView] || 'Smart Akshaya';
  return (
    <header
      style={{
        height: '70px',
        minHeight: '70px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Mobile menu button */}
      {showMenu && (
        <button
          onClick={onMenuClick}
          className="mobile-menu-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <MenuRounded style={{ fontSize: 20 }} />
        </button>
      )}

      {/* Page Title */}
      <span
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1E293B',
          flex: 1,
        }}
      >
        {title}
      </span>

      {/* Sync / Refresh button */}
      <button
        onClick={onRefresh}
        title="Reload live data from server"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <SyncRounded
          style={{
            fontSize: 18,
            transition: 'transform 0.5s',
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
          }}
        />
      </button>
    </header>
  );
}

export default function App() {
  const getInitialView = () => {
    const path = window.location.pathname.substring(1);
    if (PAGE_TITLES[path]) {
      return path;
    }
    return 'dashboard';
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [currentView, setCurrentView] = useState(getInitialView);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check login session on mount
  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setIsLoggedIn(true);
      setUserSession(session);
    }
  }, []);

  const handleLoginSuccess = () => {
    const session = getCurrentSession();
    setUserSession(session);
    setIsLoggedIn(true);
    // Preserve requested view if not dashboard
    if (currentView === 'dashboard') {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    logoutSession();
    setIsLoggedIn(false);
    setUserSession(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Small delay to show the animation even if nothing reloads
    await new Promise((r) => setTimeout(r, 800));
    setIsRefreshing(false);
  };

  // Render active view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;

      // ── Services ──
      case 'new-entry':
        return <NewEntryScreen userSession={userSession} />;
      case 'saved-bills':
        return (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>
            Saved Bills screen — coming soon.
          </div>
        );

      // ── Wallet ──
      case 'wallet':
        return <WalletManagement />;

      // ── Calculator ──
      case 'calculator':
        return <CalculatorPage />;

      // ── Document Finder ──
      case 'document-finder':
        return <QuickDocumentFinder />;

      // ── Graphics Tools ──
      case 'psc-photo':
        return <PscPhotoCreator onViewChange={setCurrentView} />;
      case 'passport':
        return <PassportPhotoGenerator onViewChange={setCurrentView} />;
      case 'resizer':
        return <PhotoResizer onEditorStateChange={setIsEditingPhoto} />;

      case 'sslc-calc':
        return <SslcCalculator onViewChange={setCurrentView} />;

      // ── Placeholders ──
      case 'nameslip':
        return (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontSize: '15px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚧</div>
            <strong style={{ color: '#64748B' }}>Nameslip</strong>
            <br />
            This feature is coming soon.
          </div>
        );
      case 'service-reports':
        return (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>
            Service Reports — coming soon.
          </div>
        );
      case 'expenses':
        return (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>
            Expenses — coming soon.
          </div>
        );

      // ── Admin ──
      case 'settings':
        return <SheetSettings />;

      case 'service-management':
        return <ServiceManagement />;

      case 'staff-management':
        return <StaffManagement />;

      default:
        return <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const hideSidebar = currentView === 'resizer' && isEditingPhoto;
  // These views render their own full-screen layout (no top bar)
  const hideTopBar = currentView === 'resizer' && isEditingPhoto;

  return (
    <div className="app-container">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && !hideSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div
        className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}
        style={{ display: hideSidebar ? 'none' : 'block' }}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
          }}
          userSession={userSession}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Shell */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Top Bar */}
        {!hideTopBar && (
          <TopBar
            currentView={currentView}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onMenuClick={() => setIsSidebarOpen(true)}
            showMenu={isSidebarOpen === false}
          />
        )}

        {/* Scrollable Content Area */}
        <main
          className="content-area"
          style={hideTopBar ? { padding: 0, height: '100vh' } : undefined}
        >
          {renderView()}
        </main>
      </div>
    </div>
  );
}
