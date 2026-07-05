import React from 'react';
import { LayoutDashboard, LayoutGrid, Bookmark, Wallet, FolderOpen, Settings, BarChart2, Receipt, Users, LogOut, UserCircle, FileText, X } from 'lucide-react';

// Helper: extract 1-2 initials from a name
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
}

export default function Sidebar({ currentView, onViewChange, userSession, onLogout, onClose }) {
  const isActive = (view) => currentView === view;
  const isAdmin = true;

  /* ── style helpers ── */
  const navItem = (active) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '11px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? '#10B981' : 'transparent',
    color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '500',
    textAlign: 'left',
    transition: 'background-color 0.15s, color 0.15s',
    fontFamily: 'inherit',
  });

  const sectionLabel = {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    padding: '20px 24px 10px',
    display: 'block',
  };

  const onHover = (e) => {
    if (!e.currentTarget.style.backgroundColor.includes('16, 185, 129')) {
      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
      e.currentTarget.style.color = '#ffffff';
    }
  };
  const onLeave = (e, active) => {
    if (!active) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
    }
  };

  /* ── Reusable sub-components ── */
  const NavItem = ({ view, Icon, label }) => {
    const active = isActive(view);
    return (
      <button
        className="sidebar-nav-item"
        style={navItem(active)}
        onClick={() => onViewChange(view)}
        onMouseEnter={onHover}
        onMouseLeave={(e) => onLeave(e, active)}
      >
        <Icon size={20} />
        {label}
      </button>
    );
  };

  const initials = getInitials(userSession?.name);
  const displayName = userSession?.name || 'Admin User';
  const roleLabel = userSession?.role === 'admin' ? 'System Admin' : 'Service Operator';

  return (
    <aside
      className="sidebar no-print"
      style={{
        width: '260px',
        height: '100vh',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Brand Header ── */}
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <img
              src="/akshaya_logo.png"
              alt="Akshaya Logo"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', lineHeight: 1.2 }}>
              Smart Akshaya
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Akashaya Pookiparamb
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <div className="sidebar-nav-scroll">
        <nav style={{ padding: '0 16px' }}>

          {/* MAIN */}
          <span style={sectionLabel}>MAIN</span>
          {isAdmin && <NavItem view="dashboard" Icon={LayoutDashboard} label="Dashboard" />}
          <NavItem view="document-finder" Icon={FolderOpen} label="Application Forms" />

          {/* SERVICES */}
          <span style={sectionLabel}>SERVICES</span>
          <NavItem view="new-entry" Icon={LayoutGrid} label="Service Entry" />
          <NavItem view="saved-bills" Icon={Bookmark} label="Saved Bills" />
          {isAdmin && <NavItem view="service-management" Icon={Settings} label="Service Management" />}

          {/* WALLETS */}
          <span style={sectionLabel}>WALLETS</span>
          <NavItem view="wallet" Icon={Wallet} label="Wallets Balance" />

          {/* FINANCE */}
          <span style={sectionLabel}>FINANCE</span>
          <NavItem view="service-reports" Icon={BarChart2} label="Service Reports" />
          <NavItem view="expenses" Icon={Receipt} label="Expenses" />

          {/* SYSTEM */}
          <span style={sectionLabel}>SYSTEM</span>
          <NavItem view="staff-management" Icon={Users} label="Staff Management" />
          <NavItem view="customer-details" Icon={UserCircle} label="Customer Details" />
        </nav>
      </div>

      {/* ── Bottom User Profile ── */}
      <div className="sidebar-user-footer">
        {/* Initials Avatar */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '14px',
            flexShrink: 0,
            letterSpacing: '0.5px',
          }}
        >
          {initials}
        </div>

        {/* Name + Role */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            {roleLabel}
          </div>
        </div>

        {/* Logout Icon Button */}
        <button
          onClick={onLogout}
          title="Log out"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            transition: 'background-color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={20} color="#ef4444" />
        </button>
      </div>
    </aside>
  );
}
