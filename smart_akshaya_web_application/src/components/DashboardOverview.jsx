import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle, Banknote, Wallet, Crop, Camera, User, Percent, Calculator, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { getRows } from '../services/googleSheetsService';

// ─── Quick‑launch tile definitions ─────────────
const TILES = [
  {
    id: 'crop',
    label: 'Crop & Resize',
    sublabel: 'Photo & Sign',
    Icon: Crop,
    bg: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', // Pink
    view: 'resizer',
  },
  {
    id: 'passport',
    label: 'Passport Size',
    sublabel: 'Photo Creator',
    Icon: Camera,
    bg: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)', // Rose
    view: 'passport',
  },
  {
    id: 'psc',
    label: 'PSC',
    sublabel: 'Photo Creator',
    Icon: User,
    bg: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)', // Teal
    view: 'psc-photo',
  },
  {
    id: 'sslc',
    label: 'SSLC Percentage',
    sublabel: 'Calculation',
    Icon: Percent,
    bg: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)', // Purple
    view: 'sslc-calc',
  },
  {
    id: 'calculator',
    label: 'Calculator',
    sublabel: 'Standard Tool',
    Icon: Calculator,
    bg: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)', // Amber
    view: 'calculator',
  },
  {
    id: 'resume',
    label: 'Resume Studio',
    sublabel: 'Premium Builder',
    Icon: FileText,
    bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', // Blue
    view: 'resume-studio',
  },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, iconBg, iconColor, loading, onClick, isExpanded }) {
  const isClickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className="dashboard-stat-card glass-panel glow-card"
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={28} color={iconColor} />
      </div>
      <div style={{ overflow: 'hidden', flex: 1, paddingRight: isClickable ? '24px' : '0' }}>
        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {label}
        </div>
        <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.5px', marginTop: '4px', wordBreak: 'break-word', lineHeight: '1.1' }}>
          {loading ? '...' : value}
        </div>
      </div>
      {isClickable && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#94A3B8' }}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      )}
    </div>
  );
}

// ─── Quick Launch Tile ─────────────────────────
function QuickTile({ tile, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="dashboard-quick-tile"
      style={{
        background: tile.bg,
        boxShadow: hovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <tile.Icon size={24} color="#ffffff" strokeWidth={2.5} />
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tile.label}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tile.sublabel}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardOverview({ onViewChange, userSession }) {
  const [stats, setStats] = useState({
    todayEntry: 0,
    todayCompleted: 0,
    totalServiceCharge: 0,
    totalWalletCharge: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [walletBreakdown, setWalletBreakdown] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let todayEntry = 0;
      let todayCompleted = 0;
      let totalServiceCharge = 0;
      let totalWalletCharge = 0;

      const rows = await getRows('Service Entries');
      if (rows && rows.length > 1) {
        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const dateIdx = headers.indexOf('date');
        const cashIdx = headers.indexOf('cash');
        const statusIdx = headers.indexOf('status');
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const rowDate = dateIdx >= 0 ? (r[dateIdx] || '').trim() : '';
          if (rowDate === today) {
            todayEntry++;
            if (statusIdx >= 0 && (r[statusIdx] || '').toLowerCase() === 'completed') {
              todayCompleted++;
            } else if (statusIdx === -1) {
              todayCompleted++;
            }
          }
          totalServiceCharge += parseFloat(r[cashIdx] || 0);
        }
      }

      const walletRows = await getRows('Wallets');
      const breakdown = [];
      if (walletRows && walletRows.length > 1) {
        const headers = walletRows[0].map((h) => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('wallet name');
        const balanceIdx = headers.indexOf('current balance');
        if (balanceIdx >= 0) {
          for (let i = 1; i < walletRows.length; i++) {
            const r = walletRows[i];
            const name = nameIdx >= 0 ? (r[nameIdx] || `Wallet ${i}`).trim() : `Wallet ${i}`;
            const balance = parseFloat(r[balanceIdx] || 0);
            totalWalletCharge += balance;
            breakdown.push({ name, balance });
          }
        }
      }

      setWalletBreakdown(breakdown);
      setStats({ todayEntry, todayCompleted, totalServiceCharge, totalWalletCharge });
    } catch (_) {
      // silently fail
    } finally {
      setLoadingStats(false);
    }
  };

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="dashboard-page">
      
      {/* Hero Header Section */}
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-hero-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="dashboard-hero-title">
            Welcome back, {userSession?.name?.split(' ')[0] || 'User'}!
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="dashboard-stats-row">
        <StatCard
          label="Today's Entries"
          value={stats.todayEntry}
          Icon={Edit3}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          loading={loadingStats}
        />
        <StatCard
          label="Completed Today"
          value={stats.todayCompleted}
          Icon={CheckCircle}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          loading={loadingStats}
        />
        <StatCard
          label="Total Cash Collection"
          value={fmt(stats.totalServiceCharge)}
          Icon={Banknote}
          iconBg="#FEF2F2"
          iconColor="#DC2626"
          loading={loadingStats}
        />
        <StatCard
          label="Net Wallet Balance"
          value={fmt(stats.totalWalletCharge)}
          Icon={Wallet}
          iconBg="#FDF4FF"
          iconColor="#C026D3"
          loading={loadingStats}
          onClick={() => setShowBreakdown((v) => !v)}
          isExpanded={showBreakdown}
        />
      </div>

      {/* ── Wallet Breakdown ── */}
      {showBreakdown && walletBreakdown.length > 0 && (
        <div className="dashboard-breakdown glass-panel">
          <div className="dashboard-breakdown-header">
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={20} color="var(--primary)" /> Wallet Balances Breakdown
            </h4>
            <button onClick={() => setShowBreakdown(false)} className="btn btn-outline" style={{ height: '36px', fontSize: '13px' }}>Close</button>
          </div>
          <div className="dashboard-wallet-grid">
            {walletBreakdown.map((w, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>{w.name}</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: w.balance < 0 ? '#EF4444' : '#10B981' }}>
                  {fmt(w.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Launch Tools ── */}
      <div className="dashboard-tools glass-panel">
        <h3 className="dashboard-tools-title">
          Quick Launch Tools
        </h3>
        <div className="dashboard-tiles-grid">
          {TILES.map((tile) => (
            <QuickTile
              key={tile.id}
              tile={tile}
              onClick={() => onViewChange(tile.view)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
