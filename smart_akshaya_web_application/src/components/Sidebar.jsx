import React, { useState } from 'react';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import CalculateRounded from '@mui/icons-material/CalculateRounded';
import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded';
import CameraAltRounded from '@mui/icons-material/CameraAltRounded';
import CropRounded from '@mui/icons-material/CropRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';

// Helper: extract 1-2 initials from a name
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase();
}

// Thin wrapper so MUI SvgIcon renders at a consistent size like Lucide
function MuiIcon({ Icon, size = 20, color, style = {} }) {
  return (
    <Icon
      style={{
        fontSize: size,
        color: color || 'inherit',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export default function Sidebar({ currentView, onViewChange, userSession, onLogout }) {
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

  const expandableHeader = (anyChildActive, expanded) => ({
    ...navItem(anyChildActive && !expanded),
    justifyContent: 'space-between',
  });

  const subNavItem = (active) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '9px 16px 9px 48px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? '#10B981' : 'transparent',
    color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: '13px',
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
        style={navItem(active)}
        onClick={() => onViewChange(view)}
        onMouseEnter={onHover}
        onMouseLeave={(e) => onLeave(e, active)}
      >
        <MuiIcon Icon={Icon} size={20} />
        {label}
      </button>
    );
  };

  const ExpandableItem = ({ title, Icon, isExpanded, onToggle, anyChildActive, children }) => (
    <div>
      <button
        style={expandableHeader(anyChildActive, isExpanded)}
        onClick={onToggle}
        onMouseEnter={onHover}
        onMouseLeave={(e) => onLeave(e, anyChildActive && !isExpanded)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <MuiIcon Icon={Icon} size={20} />
          {title}
        </span>
        <MuiIcon
          Icon={isExpanded ? KeyboardArrowDownRounded : KeyboardArrowRightRounded}
          size={18}
          color="rgba(255,255,255,0.4)"
        />
      </button>
      {isExpanded && children}
    </div>
  );

  const SubNavItem = ({ view, label }) => {
    const active = isActive(view);
    return (
      <button
        style={subNavItem(active)}
        onClick={() => onViewChange(view)}
        onMouseEnter={onHover}
        onMouseLeave={(e) => onLeave(e, active)}
      >
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
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Brand Header ── */}
      <div style={{ padding: '24px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/akshaya_logo.png"
            alt="Akshaya Logo"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.3px', lineHeight: 1.2 }}>
              Smart Akshaya
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Akashaya Pookiparamb
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
        <nav style={{ padding: '0 16px' }}>

          {/* MAIN */}
          <span style={sectionLabel}>MAIN</span>
          {isAdmin && <NavItem view="dashboard" Icon={DashboardRounded} label="Dashboard" />}
          <NavItem view="document-finder" Icon={FolderOpenRounded} label="Application Forms" />

          {/* SERVICES */}
          <span style={sectionLabel}>SERVICES</span>
          <NavItem view="new-entry" Icon={GridViewRounded} label="Service Entry" />
          <NavItem view="saved-bills" Icon={BookmarkRounded} label="Saved Bills" />
          {isAdmin && <NavItem view="service-management" Icon={BuildOutlined} label="Service Management" />}

          {/* WALLETS */}
          <span style={sectionLabel}>WALLETS</span>
          <NavItem view="wallet" Icon={AccountBalanceWalletRounded} label="Wallets Balance" />

          {/* FINANCE */}
          <span style={sectionLabel}>FINANCE</span>
          <NavItem view="service-reports" Icon={BarChartRounded} label="Service Reports" />
          <NavItem view="expenses" Icon={PaymentsOutlined} label="Expenses" />

          {/* SYSTEM */}
          <span style={sectionLabel}>SYSTEM</span>
          <NavItem view="staff-management" Icon={PersonRounded} label="Staff Management" />
        </nav>
      </div>

      {/* ── Bottom User Profile ── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
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
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
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
            padding: '6px',
            borderRadius: '6px',
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
          <MuiIcon Icon={LogoutRounded} size={20} color="#ef4444" />
        </button>
      </div>
    </aside>
  );
}
