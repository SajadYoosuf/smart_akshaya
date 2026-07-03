import React, { useState, useEffect } from 'react';
import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import CropRounded from '@mui/icons-material/CropRounded';
import CameraAltRounded from '@mui/icons-material/CameraAltRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PercentRounded from '@mui/icons-material/PercentRounded';
import CalculateRounded from '@mui/icons-material/CalculateRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import PrintRounded from '@mui/icons-material/PrintRounded';
import { getRows } from '../services/googleSheetsService';

// ─── Quick‑launch tile definitions (matching Windows app exactly) ─────────────
const TILES = [
  {
    id: 'crop',
    label: 'Crop & Resize',
    sublabel: 'Photo & Sign',
    Icon: CropRounded,
    bg: '#e91e8c',
    view: 'resizer',
  },
  {
    id: 'passport',
    label: 'Passport Size',
    sublabel: 'Photo Creator',
    Icon: CameraAltRounded,
    bg: '#f4736b',
    view: 'passport',
  },
  {
    id: 'psc',
    label: 'PSC',
    sublabel: 'Photo Creator',
    Icon: PersonRounded,
    bg: '#4dd0c4',
    view: 'psc-photo',
  },
  {
    id: 'sslc',
    label: 'SSLC Percentage',
    sublabel: 'Calculation',
    Icon: PercentRounded,
    bg: '#ce93d8',
    view: 'sslc-calc',
  },
  {
    id: 'calculator',
    label: 'Calculator',
    sublabel: 'Standard Tool',
    Icon: CalculateRounded,
    bg: '#f59e0b',
    view: 'calculator',
  },
];

// ─── MUI icon wrapper ─────────────────────────────────────────────────────────
function MuiIcon({ Icon, size = 24, color, style = {} }) {
  return (
    <Icon style={{ fontSize: size, color: color || 'inherit', display: 'block', ...style }} />
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, iconBg, iconColor, loading, onClick, isExpanded }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: isExpanded ? '1px solid #10B981' : '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'border-color 0.2s',
        flex: '1 1 0',
        minWidth: '160px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MuiIcon Icon={Icon} size={24} color={iconColor} />
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '12px',
            color: '#64748B',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#1E293B',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}
        >
          {loading ? '...' : value}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Launch Tile (horizontal, matching Windows) ─────────────────────────
function QuickTile({ tile, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tile.bg,
        border: 'none',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '14px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: hovered ? `0 8px 24px ${tile.bg}55` : `0 3px 10px ${tile.bg}33`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        minHeight: '72px',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MuiIcon Icon={tile.Icon} size={22} color="#ffffff" />
      </div>

      {/* Text */}
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.3px',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tile.label}
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffffff',
            lineHeight: 1.3,
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
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

  const fmt = (n) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* ── 4 Stat Cards ── */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <StatCard
          label="Today entry"
          value={stats.todayEntry}
          Icon={EditNoteRounded}
          iconBg="#ECFDF5"
          iconColor="#10B981"
          loading={loadingStats}
        />
        <StatCard
          label="Today completed"
          value={stats.todayCompleted}
          Icon={CheckCircleOutlineRounded}
          iconBg="#ECFDF5"
          iconColor="#10B981"
          loading={loadingStats}
        />
        <StatCard
          label="Total service charge"
          value={fmt(stats.totalServiceCharge)}
          Icon={PaymentsOutlined}
          iconBg="#EFF6FF"
          iconColor="#3B82F6"
          loading={loadingStats}
        />
        <StatCard
          label="Total wallet charge"
          value={fmt(stats.totalWalletCharge)}
          Icon={AccountBalanceWalletOutlined}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          loading={loadingStats}
          onClick={() => setShowBreakdown((v) => !v)}
          isExpanded={showBreakdown}
        />
      </div>

      {/* ── Wallet Breakdown ── */}
      {showBreakdown && walletBreakdown.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <h4
              style={{
                fontSize: '12px',
                fontWeight: '800',
                color: '#1E293B',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0,
              }}
            >
              Wallet Balances Breakdown
            </h4>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Click card again to hide</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            {walletBreakdown.map((w, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{w.name}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: w.balance < 0 ? '#EF4444' : '#10B981' }}>
                  {fmt(w.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Launch Tools ── */}
      <div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1E293B',
            marginBottom: '14px',
          }}
        >
          Quick Launch Tools
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
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
