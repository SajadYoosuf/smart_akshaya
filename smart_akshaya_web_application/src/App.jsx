import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import DashboardOverview from './components/DashboardOverview';
import PassportPhotoGenerator from './components/PassportPhotoGenerator';
import PhotoResizer from './components/PhotoResizer';
import SheetSettings from './components/SheetSettings';
import WalletManagement from './components/WalletManagement';
import QuickDocumentFinder from './components/QuickDocumentFinder';
import PscPhotoCreator from './components/PscPhotoCreator';
import SslcCalculator from './components/SslcCalculator';
import NewEntryScreen from './components/NewEntryScreen';
import SavedBillsScreen from './components/SavedBillsScreen';
import ServiceReportsScreen from './components/ServiceReportsScreen';
import ServiceManagement from './components/ServiceManagement';
import StaffManagement from './components/StaffManagement';
import StaffDashboard from './components/StaffDashboard';
import CustomerDetails from './components/CustomerDetails';
import ExpensesScreen from './components/ExpensesScreen';
import AdminPermissionsScreen from './components/AdminPermissionsScreen';
import ResumeBuilderWrapper from './components/ResumeBuilderWrapper';
import TransactionHistoryScreen from './components/TransactionHistoryScreen';
import { getCurrentSession, logoutSession } from './services/googleSheetsAuth';
import MenuRounded from '@mui/icons-material/MenuRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import { Search, X } from 'lucide-react';
import ReloadPrompt from './components/ReloadPrompt';
import AttendancePopup from './components/AttendancePopup';
import ExternalLinksManager from './components/ExternalLinksManager';
import PendingBillsPopup from './components/PendingBillsPopup';

// ── Page title map (matches Windows app pageTitles list) ──────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  'new-entry': 'New Entry',
  'saved-bills': 'Saved Bills',
  wallet: 'Wallets Balance',
  'document-finder': 'Application Forms',
  passport: 'Passport Photo Creator',
  'psc-photo': 'PSC Photo Creator',
  resizer: 'Photo Resizer',
  'sslc-calc': 'SSLC Calculator',
  'service-reports': 'Billed Services',
  expenses: 'Expenses',
  settings: 'Sheet Config',
  'service-management': 'Service Management',
  'staff-management': 'Staff Management',
  'staff-performance': 'Staff Performance',
  'customer-details': 'Customer Details',
  permissions: 'Feature Permissions',
  nameslip: 'Nameslip',
  'resume-studio': 'Resume Studio',
  'transaction-history': 'Transaction History',
  'external-tools': 'External Tools',
};

// ── Top Bar Component (matches Windows 70px white header) ─────────────────────
function TopBar({ currentView, onRefresh, isRefreshing, onMenuClick, showMenu, searchQuery, setSearchQuery }) {
  const title = PAGE_TITLES[currentView] || 'Smart Akshaya';
  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="mobile-menu-btn"
            type="button"
            aria-label="Open menu"
          >
            <MenuRounded style={{ fontSize: 20 }} />
          </button>
        )}
      </div>

      <div className="app-topbar-center">
        <span className="app-topbar-title">{title}</span>
      </div>

      <div className="app-topbar-right">
        {currentView === 'document-finder' && (
          <div className="app-topbar-search">
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748B',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms…"
              style={{
                width: '100%',
                height: '36px',
                paddingLeft: '36px',
                paddingRight: searchQuery ? '32px' : '12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onRefresh}
          title="Reload live data from server"
          className="app-topbar-refresh"
        >
          <SyncRounded
            style={{
              fontSize: 18,
              transition: 'transform 0.5s',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </div>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [editBillData, setEditBillData] = useState(null);
  const [showPendingBillsPopup, setShowPendingBillsPopup] = useState(false);

  // Check login session on mount
  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setIsLoggedIn(true);
      setUserSession(session);
      setShowPendingBillsPopup(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    const session = getCurrentSession();
    setUserSession(session);
    setIsLoggedIn(true);
    setShowPendingBillsPopup(true);
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
    await new Promise((r) => setTimeout(r, 800));
    setIsRefreshing(false);
  };

  const hideSidebar = (currentView === 'resizer' && isEditingPhoto) || currentView === 'resume-studio';
  const hideTopBar = hideSidebar;

  useEffect(() => {
    if (!isLoggedIn) return;
    if (isSidebarOpen && !hideSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoggedIn, isSidebarOpen, hideSidebar]);

  // Render active view
  const renderView = () => {
    const role = userSession?.role || 'staff';
    const isAdmin = role === 'admin';
    const isAccountant = role === 'accountant';

    const canSeeStaffManagement = isAdmin;
    const canSeeStaffPerformance = isAdmin;
    const canSeeWallet = isAdmin || isAccountant;

    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;

      // ── Services ──
      case 'new-entry':
        return <NewEntryScreen userSession={userSession} editBillData={editBillData} setEditBillData={setEditBillData} />;
      case 'saved-bills':
        return (
          <SavedBillsScreen
            onSettleBill={(bill) => {
              setEditBillData(bill);
              setCurrentView('new-entry');
            }}
          />
        );

      // ── Wallet ──
      case 'wallet':
        return canSeeWallet ? <WalletManagement /> : <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;

      // ── Document Finder ──
      case 'document-finder':
        return <QuickDocumentFinder search={searchQuery} setSearch={setSearchQuery} />;

      // ── Graphics Tools ──
      case 'psc-photo':
        return <PscPhotoCreator onViewChange={setCurrentView} />;
      case 'passport':
        return <PassportPhotoGenerator onViewChange={setCurrentView} />;
      case 'resizer':
        return <PhotoResizer onEditorStateChange={setIsEditingPhoto} />;

      case 'sslc-calc':
        return <SslcCalculator onViewChange={setCurrentView} />;
      case 'resume-studio':
        return <ResumeBuilderWrapper onViewChange={setCurrentView} />;

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
        return <ServiceReportsScreen userSession={userSession} onEditBill={(bill) => { setEditBillData(bill); setCurrentView('new-entry'); }} />;
      case 'expenses':
        return <ExpensesScreen userSession={userSession} />;

      // ── Admin ──
      case 'settings':
        return <SheetSettings />;

      case 'service-management':
        return <ServiceManagement />;

      case 'staff-management':
        return canSeeStaffManagement ? <StaffManagement /> : <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;

      case 'staff-performance':
        return canSeeStaffPerformance ? <StaffDashboard /> : <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;

      case 'customer-details':
        return <CustomerDetails />;

      case 'permissions':
        return isAdmin ? <AdminPermissionsScreen userSession={userSession} /> : <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;

      case 'transaction-history':
        return isAdmin ? <TransactionHistoryScreen userSession={userSession} /> : <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;

      case 'external-tools':
        return <ExternalLinksManager />;

      default:
        return <DashboardOverview onViewChange={setCurrentView} userSession={userSession} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
            setSearchQuery('');
            setIsSidebarOpen(false);
          }}
          userSession={userSession}
          onLogout={handleLogout}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content Shell */}
      <div className="app-main-shell">
        {/* Top Bar */}
        {!hideTopBar && (
          <TopBar
            currentView={currentView}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onMenuClick={() => setIsSidebarOpen(true)}
            showMenu={!hideSidebar && !isSidebarOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
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
      <ReloadPrompt />
      <AttendancePopup userSession={userSession} />
      <PendingBillsPopup 
        userSession={userSession} 
        isOpen={showPendingBillsPopup} 
        onClose={() => setShowPendingBillsPopup(false)} 
        onSettleNow={() => {
          setShowPendingBillsPopup(false);
          setCurrentView('saved-bills');
        }}
      />
    </div>
  );
}
