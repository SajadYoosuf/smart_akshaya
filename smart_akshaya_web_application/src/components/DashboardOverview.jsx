import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle, Banknote, Wallet, Crop, Camera, User, Percent, Calculator, ChevronDown, ChevronUp, FileText, Bookmark, Globe, Link as LinkIcon, ExternalLink, Database, Cloud, Star, Monitor, AppWindow, Cpu, Rocket, Search } from 'lucide-react';
import { getRows, updateRow, appendRow } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';
import CalculatorModal from './CalculatorModal';
import CashCounterModal from './CashCounterModal';
const ICON_MAP = {
  Globe, Link: LinkIcon, ExternalLink, Database, Cloud, Star, Monitor, AppWindow, Cpu, Rocket
};

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
  {
    id: 'cash-counter',
    label: 'Cash Counter',
    sublabel: 'Denomination Calculator',
    Icon: Banknote,
    bg: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', // Emerald
    view: 'cash-counter',
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
function QuickTile({ tile, onClick, isEditing, onDragStart, onDragEnter, onDragEnd, isDragged }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      draggable={isEditing}
      onDragStart={(e) => onDragStart && onDragStart(e, tile.id)}
      onDragEnter={(e) => onDragEnter && onDragEnter(e, tile.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => isEditing && e.preventDefault()}
      onClick={isEditing ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`dashboard-quick-tile ${isEditing ? 'editing-jiggle' : ''}`}
      style={{
        background: tile.bg,
        boxShadow: hovered && !isEditing ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        transform: hovered && !isEditing ? 'translateY(-4px)' : 'none',
        opacity: isDragged ? 0.4 : 1,
        cursor: isEditing ? 'grab' : 'pointer',
        transition: 'all 0.2s ease',
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
  const [bookmarkedServices, setBookmarkedServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [externalLinks, setExternalLinks] = useState([]);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showCashCounterModal, setShowCashCounterModal] = useState(false);
  const [canSeeWalletBalance, setCanSeeWalletBalance] = useState(userSession?.role === 'admin');

  const [combinedTools, setCombinedTools] = useState([]);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [globalLayoutOrder, setGlobalLayoutOrder] = useState(null);
  const [layoutRowIndex, setLayoutRowIndex] = useState(null);

  const fetchLayoutSettings = async () => {
    try {
      const rows = await getRows('Layout Settings');
      if (rows && rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === 'QuickLaunchOrder') {
            setLayoutRowIndex(i + 1); // 1-indexed for updateRow
            try {
              const order = JSON.parse(rows[i][1]);
              setGlobalLayoutOrder(order);
            } catch (e) {
              console.error('Failed to parse QuickLaunchOrder', e);
            }
            return;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch Layout Settings', err);
    }
  };

  useEffect(() => {
    const allTools = [...TILES, ...externalLinks];
    const savedOrder = globalLayoutOrder || JSON.parse(localStorage.getItem('quick_launch_tool_order') || '[]');
    
    if (savedOrder.length > 0) {
      allTools.sort((a, b) => {
        const indexA = savedOrder.indexOf(a.id);
        const indexB = savedOrder.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    setCombinedTools(allTools);
  }, [externalLinks, globalLayoutOrder]);

  const handleDragStart = (e, id) => {
    if (!isEditingLayout) return;
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, targetId) => {
    if (!isEditingLayout || draggedItemId === null || draggedItemId === targetId) return;
    
    setCombinedTools(prev => {
      const newTools = [...prev];
      const draggedIndex = newTools.findIndex(t => t.id === draggedItemId);
      const targetIndex = newTools.findIndex(t => t.id === targetId);
      
      const [draggedItem] = newTools.splice(draggedIndex, 1);
      newTools.splice(targetIndex, 0, draggedItem);
      
      return newTools;
    });
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const handleSaveLayout = async () => {
    setIsEditingLayout(false);
    const order = combinedTools.map(t => t.id);
    
    localStorage.setItem('quick_launch_tool_order', JSON.stringify(order));
    setGlobalLayoutOrder(order);
    
    try {
      const orderString = JSON.stringify(order);
      if (layoutRowIndex) {
        await updateRow('Layout Settings', layoutRowIndex, ['QuickLaunchOrder', orderString]);
      } else {
        await appendRow('Layout Settings', ['QuickLaunchOrder', orderString]);
        fetchLayoutSettings();
      }
    } catch (err) {
      console.error('Failed to save layout to Google Sheets', err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchExternalLinks();
    fetchPermissions();
    fetchLayoutSettings();
  }, []);

  const fetchPermissions = async () => {
    if (userSession?.role === 'admin') {
      setCanSeeWalletBalance(true);
      return;
    }
    try {
      const rows = await getRows(SHEETS_CONFIG.permissionsSheetName);
      if (rows && rows.length > 1) {
        const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('feature name') || h.includes('name'));
        const accIdx = headers.findIndex(h => h.includes('accountant'));
        const staffIdx = headers.findIndex(h => h.includes('staff'));
        
        let hasAccess = false;
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const featureName = (row[nameIdx] || '').toString().trim().toLowerCase();
          
          if (featureName.includes('dashboard') && featureName.includes('wallet')) {
            if (userSession?.role === 'accountant' && accIdx !== -1) {
              hasAccess = (row[accIdx] || 'FALSE').toString().trim().toUpperCase() === 'TRUE';
            } else if (userSession?.role === 'staff' && staffIdx !== -1) {
              hasAccess = (row[staffIdx] || 'FALSE').toString().trim().toUpperCase() === 'TRUE';
            }
            break;
          }
        }
        setCanSeeWalletBalance(hasAccess);
      }
    } catch (err) {
      console.error('Failed to fetch permissions', err);
    }
  };

  const fetchExternalLinks = async () => {
    try {
      const rows = await getRows('External Links');
      if (rows && rows.length > 0) {
        let startIndex = 1;
        let nameIdx = 0, urlIdx = 1, iconIdx = 2, colorIdx = 3;
        
        const firstRow = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        
        if (firstRow.includes('name') || firstRow.includes('url')) {
          nameIdx = firstRow.indexOf('name') !== -1 ? firstRow.indexOf('name') : 0;
          urlIdx = firstRow.indexOf('url') !== -1 ? firstRow.indexOf('url') : 1;
          iconIdx = firstRow.indexOf('icon') !== -1 ? firstRow.indexOf('icon') : 2;
          colorIdx = firstRow.indexOf('color') !== -1 ? firstRow.indexOf('color') : 3;
        } else {
          startIndex = 0;
        }
        
        const links = [];
        for (let i = startIndex; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0 || (!r[nameIdx] && !r[urlIdx])) continue;
          links.push({
            id: `ext-${i}`,
            label: r[nameIdx] || 'Link',
            sublabel: 'External Tool',
            Icon: ICON_MAP[r[iconIdx]] || Globe,
            bg: r[colorIdx] || 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            url: r[urlIdx] || '#',
            isExternal: true
          });
        }
        setExternalLinks(links);
      }
    } catch (err) {
      console.error('Failed to fetch external links', err);
    }
  };

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
            const rawBalance = (r[balanceIdx] || '0').toString().replace(/[^0-9.-]+/g, '');
            const balance = parseFloat(rawBalance) || 0;
            totalWalletCharge += balance;
            breakdown.push({ name, balance });
          }
        }
      }

      const servicesRows = await getRows(SHEETS_CONFIG.serviceSheetName).catch(() => null);
      const bookmarked = [];
      const allList = [];
      if (servicesRows && servicesRows.length > 1) {
        const normalizedHeaders = servicesRows[0].map(h => (h || '').toString().toLowerCase().replace(/[^a-z0-9]/g, ''));
        const getIdx = (keys, defaultVal) => {
          for (const key of keys) {
            const idx = normalizedHeaders.indexOf(key);
            if (idx !== -1) return idx;
          }
          return defaultVal;
        };
        const idIdx = getIdx(['id', 'serviceid', 'srvid'], -1);
        const nameIdx = getIdx(['servicename', 'name', 'service'], idIdx === -1 ? 0 : 1);
        const websiteIdx = getIdx(['website', 'url', 'link'], idIdx === -1 ? 1 : 2);
        const bookmarkIdx = getIdx(['bookmark', 'isbookmarked', 'favorite'], idIdx === -1 ? 8 : 9);

        for (let i = 1; i < servicesRows.length; i++) {
          const r = servicesRows[i];
          if (!r || r.length === 0 || (r[nameIdx] || '').toString().trim() === '') continue;
          
          const srvObj = {
            name: r[nameIdx] || 'Service',
            website: r[websiteIdx] || '#'
          };
          allList.push(srvObj);

          if (r.length > bookmarkIdx && (r[bookmarkIdx] || '').toString().toLowerCase() === 'true') {
            bookmarked.push(srvObj);
          }
        }
      }

      setWalletBreakdown(breakdown);
      setBookmarkedServices(bookmarked);
      setAllServices(allList);
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
        {canSeeWalletBalance && (
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
        )}
      </div>

      {/* ── Top Bookmarked Services ── */}
      {bookmarkedServices.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={20} color="#3B82F6" fill="#DBEAFE" /> Top Bookmarked Services
          </h3>
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {bookmarkedServices.map((service, index) => {
              const initial = service.name.charAt(0).toUpperCase();
              const colors = [
                ['#EC4899', '#BE185D'], // Pink
                ['#F43F5E', '#BE123C'], // Rose
                ['#14B8A6', '#0F766E'], // Teal
                ['#A855F7', '#7E22CE'], // Purple
                ['#F59E0B', '#B45309'], // Amber
                ['#3B82F6', '#1D4ED8'], // Blue
              ];
              const color = colors[index % colors.length];
              
              return (
                <a 
                  key={index} 
                  href={service.website !== '#' ? service.website : undefined} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '84px', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ 
                    width: '76px', height: '76px', borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%)`,
                    padding: '3px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ 
                      width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid transparent'
                    }}>
                      <span style={{ fontSize: '28px', fontWeight: '800', background: `linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {initial}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '84px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {service.name}
                  </span>
                </a>
              );
            })}
          </div>
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
            @keyframes jiggle {
              0% { transform: rotate(-1deg); }
              50% { transform: rotate(1.5deg); }
              100% { transform: rotate(-1deg); }
            }
            .editing-jiggle {
              animation: jiggle 0.3s infinite;
              border: 2px dashed rgba(255,255,255,0.5);
            }
          `}</style>
        </div>
      )}

      {/* ── Wallet Breakdown ── */}
      {canSeeWalletBalance && showBreakdown && walletBreakdown.length > 0 && (
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="dashboard-tools-title" style={{ margin: 0 }}>
            Quick Launch Tools
          </h3>
          {userSession?.role === 'admin' && (
            <button 
              onClick={isEditingLayout ? handleSaveLayout : () => setIsEditingLayout(true)}
              className={isEditingLayout ? "btn btn-primary" : "btn btn-outline"}
              style={{ height: '36px', fontSize: '13px', padding: '0 16px', borderRadius: '8px' }}
            >
              {isEditingLayout ? 'Save Layout' : 'Customize Layout'}
            </button>
          )}
        </div>
        <div className="dashboard-tiles-grid">
          {combinedTools.map((tile) => (
            <QuickTile
              key={tile.id}
              tile={tile}
              isEditing={isEditingLayout}
              isDragged={draggedItemId === tile.id}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (tile.isExternal && tile.url && tile.url !== '#') {
                  window.open(tile.url, '_blank');
                } else if (tile.id === 'calculator') {
                  setShowCalculatorModal(true);
                } else if (tile.id === 'cash-counter') {
                  setShowCashCounterModal(true);
                } else {
                  onViewChange(tile.view);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Service Directory ── */}
      <div style={{ marginTop: '40px', marginBottom: '40px', position: 'relative' }}>
        {/* Background Decorative Blur */}
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            <Globe size={14} /> Service Directory
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: '0 0 24px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>
            Quickly Access Any Service
          </h2>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
            <div style={{ position: 'absolute', inset: '-2px', background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)', borderRadius: '24px', opacity: serviceSearchQuery ? 0.5 : 0.1, filter: 'blur(8px)', transition: 'opacity 0.3s' }}></div>
            <input 
              type="text" 
              placeholder="Search for a service..." 
              value={serviceSearchQuery}
              onChange={(e) => setServiceSearchQuery(e.target.value)}
              style={{
                width: '100%', height: '56px', padding: '0 24px 0 52px', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.8)', outline: 'none', fontSize: '16px',
                backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
                color: '#1E293B', fontWeight: '500', position: 'relative', zIndex: 1
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.8)'}
            />
            <Search size={20} color="#64748B" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', position: 'relative', zIndex: 1 }}>
          {allServices.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((service, idx) => {
            const colors = [
              { bg: '#EFF6FF', text: '#3B82F6', grad: 'linear-gradient(135deg, #60A5FA, #2563EB)' },
              { bg: '#FDF4FF', text: '#C026D3', grad: 'linear-gradient(135deg, #E879F9, #9333EA)' },
              { bg: '#F0FDF4', text: '#16A34A', grad: 'linear-gradient(135deg, #4ADE80, #16A34A)' },
              { bg: '#FFF7ED', text: '#EA580C', grad: 'linear-gradient(135deg, #FB923C, #EA580C)' },
              { bg: '#FEF2F2', text: '#DC2626', grad: 'linear-gradient(135deg, #F87171, #DC2626)' },
              { bg: '#F8FAFC', text: '#475569', grad: 'linear-gradient(135deg, #94A3B8, #475569)' },
            ];
            const colorTheme = colors[idx % colors.length];
            
            let displayUrl = 'No URL Provided';
            if (service.website && service.website !== '#') {
              try {
                displayUrl = new URL(service.website).hostname.replace('www.', '');
              } catch (e) {
                displayUrl = service.website;
              }
            }
            
            return (
              <a 
                key={idx}
                href={service.website !== '#' ? service.website : undefined} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', padding: '16px 20px', borderRadius: '20px',
                  backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,1)', textDecoration: 'none',
                  boxShadow: '0 4px 15px -5px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.5)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 20px 25px -5px ${colorTheme.text}30, 0 8px 10px -6px ${colorTheme.text}20, inset 0 0 0 1px ${colorTheme.text}40`;
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  const arrow = e.currentTarget.querySelector('.arrow-icon');
                  if (arrow) {
                    arrow.style.transform = 'translate(4px, -4px)';
                    arrow.style.color = colorTheme.text;
                    arrow.style.backgroundColor = colorTheme.bg;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px -5px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.5)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)';
                  const arrow = e.currentTarget.querySelector('.arrow-icon');
                  if (arrow) {
                    arrow.style.transform = 'translate(0, 0)';
                    arrow.style.color = '#94A3B8';
                    arrow.style.backgroundColor = 'rgba(241, 245, 249, 0.8)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '14px',
                    background: colorTheme.grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 8px -2px rgba(0,0,0,0.2)'
                  }}>
                    <Globe size={22} color="#ffffff" strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {service.name}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayUrl}
                    </div>
                  </div>
                </div>
                <div className="arrow-icon" style={{
                  width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(241, 245, 249, 0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94A3B8', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', flexShrink: 0
                }}>
                  <ExternalLink size={16} strokeWidth={2.5} />
                </div>
              </a>
            );
          })}
          {allServices.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
             <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Search size={48} opacity={0.3} />
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#64748B' }}>No services found</div>
                <div style={{ fontSize: '14px' }}>Try adjusting your search query.</div>
             </div>
          )}
        </div>
      </div>

      {showCalculatorModal && (
        <CalculatorModal onClose={() => setShowCalculatorModal(false)} />
      )}
      {showCashCounterModal && (
        <CashCounterModal onClose={() => setShowCashCounterModal(false)} />
      )}
    </div>
  );
}
