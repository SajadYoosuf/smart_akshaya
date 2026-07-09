import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard, Search, Calendar, RefreshCw, Download,
  IndianRupee, AlertCircle, Filter, X, ChevronDown, ChevronUp,
  Phone, User, FileText, CheckCircle, Circle, Loader,
  CheckSquare, Banknote,
} from 'lucide-react';
import { getRows, updateRowColumns } from '../services/googleSheetsService';
import { SHEETS_CONFIG, BILL_TYPES, SVC_STATUS } from '../config/sheetsConfig';
import { groupByBooking } from '../utils/billGrouper';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseFlexDate = (str) => {
  if (!str) return null;
  const dmY = /^(\d{2})-(\d{2})-(\d{4})$/.exec(str);
  if (dmY) return new Date(+dmY[3], +dmY[2] - 1, +dmY[1]);
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const PRESETS = [
  { label: 'Today', getValue: () => { const s = new Date().toISOString().split('T')[0]; return { start: s, end: s }; } },
  { label: 'This Week', getValue: () => { const n = new Date(); const m = new Date(n); m.setDate(n.getDate() - n.getDay() + 1); const s = new Date(m); s.setDate(m.getDate() + 6); return { start: m.toISOString().split('T')[0], end: s.toISOString().split('T')[0] }; } },
  { label: 'This Month', getValue: () => { const n = new Date(); const f = new Date(n.getFullYear(), n.getMonth(), 1); const l = new Date(n.getFullYear(), n.getMonth() + 1, 0); return { start: f.toISOString().split('T')[0], end: l.toISOString().split('T')[0] }; } },
  { label: 'Last Month', getValue: () => { const n = new Date(); const f = new Date(n.getFullYear(), n.getMonth() - 1, 1); const l = new Date(n.getFullYear(), n.getMonth(), 0); return { start: f.toISOString().split('T')[0], end: l.toISOString().split('T')[0] }; } },
];

/**
 * Parse a raw row for the Credit view (needs new-format rows only for credit routing,
 * but also handles legacy pending rows where balance < 0).
 */
const parseRow = (row, idx) => {
  const bookingIdRaw = (row[12] || '').toString().trim();
  const isNew = bookingIdRaw && /^\d{13}$/.test(bookingIdRaw);
  const bookingId = isNew ? bookingIdRaw : '';

  if (isNew) {
    return {
      rowIndex: idx + 2,
      date: row[0] || '',
      time: row[1] || '',
      staffName: row[2] || '',
      mobile: row[3] || '',
      customerName: row[4] || 'Walk-in',
      serviceName: row[5] || '',
      quantity: parseInt(row[6]) || 1,
      deptFee: parseFloat(row[7]) || 0,
      serviceCharge: parseFloat(row[8]) || 0,
      rowTotal: parseFloat(row[9]) || 0,
      walletType: row[10] || '',
      serviceStatus: (row[11] || SVC_STATUS.COMPLETED).toString().trim().toLowerCase(),
      bookingId,
      billType: (row[13] || BILL_TYPES.COMPLETED).toString().trim().toLowerCase(),
      bookingTotal: parseFloat(row[14]) || 0,
      amountPaid: parseFloat(row[15]) || 0,
      gpayAmount: parseFloat(row[16]) || 0,
      cashAmount: parseFloat(row[17]) || 0,
      balance: parseFloat(row[18]) || 0,
    };
  }

  // Legacy: only include if balance < 0 (actual credit)
  const hasStoredMobile = /^\d{10}$/.test((row[3] || '').toString().trim());
  const offset = hasStoredMobile ? 1 : 0;
  const total = parseFloat(row[6 + offset]) || 0;
  const gpay = parseFloat(row[9 + offset]) || 0;
  const cash = parseFloat(row[10 + offset]) || 0;
  const bal = parseFloat(row[11 + offset]) || 0;
  const statusRaw = (row[12 + offset] || '').toString().trim().toLowerCase();

  return {
    rowIndex: idx + 2,
    date: row[0] || '',
    time: row[1] || '',
    staffName: row[2] || '',
    mobile: hasStoredMobile ? row[3] : '',
    customerName: row[3 + offset] || 'Walk-in',
    serviceName: row[4 + offset] || '',
    services: row[4 + offset] || '',
    quantity: parseInt(row[5 + offset]) || 1,
    deptFee: 0,
    serviceCharge: total,
    rowTotal: total,
    walletType: row[15 + offset] || '',
    serviceStatus: SVC_STATUS.COMPLETED,
    bookingId: '',
    billType: bal < -0.01 ? BILL_TYPES.PARTIAL_PAYMENT : BILL_TYPES.COMPLETED,
    bookingTotal: total,
    amountPaid: gpay + cash,
    gpayAmount: gpay,
    cashAmount: cash,
    balance: bal,
  };
};

// ── SVC status display config ─────────────────────────────────────────────────

const SVC_CFG = {
  [SVC_STATUS.NOT_STARTED]: { label: 'Not Started', bg: '#F1F5F9', color: '#64748B', Icon: Circle },
  [SVC_STATUS.IN_PROGRESS]: { label: 'In Progress', bg: '#FEF3C7', color: '#B45309', Icon: Loader },
  [SVC_STATUS.COMPLETED]:   { label: 'Completed',   bg: '#ECFDF5', color: '#059669', Icon: CheckSquare },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, subValue, accent, icon: Icon }) {
  return (
    <div
      style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px', minWidth: '180px', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94A3B8', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        {subValue && <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>{subValue}</div>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreditDetailsScreen({ userSession, onSettleBill }) {
  const isAdmin = userSession?.role === 'admin';
  const isAccountant = userSession?.role === 'accountant';
  const currentStaff = userSession?.name || '';

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

  const fetchCredits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
      if (rows && rows.length > 1) {
        const parsed = rows.slice(1).map((row, idx) => parseRow(row, idx));

        const grouped = groupByBooking(parsed);

        const creditBookings = grouped.filter(b => {
          return b.billType === BILL_TYPES.CREDIT_PENDING ||
                 b.billType === BILL_TYPES.PARTIAL_PAYMENT ||
                 b.billType === 'credit_pending' ||
                 b.billType === 'partial_payment' ||
                 (b.isLegacy && b.balance < -0.01);
        });

        // Staff sees only their own
        const visible = (isAdmin || isAccountant)
          ? creditBookings
          : creditBookings.filter(b => (b.staffName || '').trim().toLowerCase() === currentStaff.trim().toLowerCase());

        visible.sort((a, b) => {
          const da = parseFlexDate(a.date), db = parseFlexDate(b.date);
          return (!da || !db) ? 0 : db - da;
        });
        setBookings(visible);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('CreditDetailsScreen fetch error:', err);
      setError('Failed to load credit data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isAccountant, currentStaff]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const staffList = useMemo(() =>
    [...new Set(bookings.map(b => b.staffName).filter(Boolean))].sort(),
    [bookings]
  );

  const filtered = useMemo(() => {
    let data = bookings;
    if ((isAdmin || isAccountant) && staffFilter) {
      data = data.filter(b => b.staffName === staffFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(b =>
        (b.customerName || '').toLowerCase().includes(q) ||
        (b.mobile || '').includes(q) ||
        b.services.some(s => (s.serviceName || '').toLowerCase().includes(q)) ||
        (b.bookingId || '').includes(q)
      );
    }
    if (startDate || endDate) {
      data = data.filter(b => {
        const d = parseFlexDate(b.date);
        if (!d) return true;
        d.setHours(0, 0, 0, 0);
        if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); if (d < s) return false; }
        if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); if (d > e) return false; }
        return true;
      });
    }
    return data;
  }, [bookings, searchQuery, startDate, endDate, staffFilter, isAdmin, isAccountant]);

  const totalCreditAmount = filtered.reduce((s, b) => s + Math.max(0, -b.balance), 0);
  const totalCustomers = new Set(filtered.map(b => b.mobile || b.customerName)).size;

  const handleExport = () => {
    const csvRows = [
      ['Date', 'Booking ID', 'Staff', 'Customer', 'Mobile', 'Services', 'Total (₹)', 'Paid (₹)', 'Balance (₹)'],
      ...filtered.map(b => [
        b.date, b.bookingId, b.staffName, b.customerName, b.mobile,
        `"${b.services.map(s => s.serviceName).join(', ')}"`,
        b.bookingTotal.toFixed(2), b.amountPaid.toFixed(2), Math.abs(b.balance).toFixed(2),
      ]),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-details-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 'max(16px, min(32px, 4vw))', boxSizing: 'border-box', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #DC2626 0%, #9333EA 100%)', borderRadius: '24px', padding: 'clamp(24px,4vw,40px)', color: 'white', boxShadow: '0 12px 32px rgba(220,38,38,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(22px,4vw,32px)', fontWeight: '800', letterSpacing: '-0.5px' }}>Credit Details</h1>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.85 }}>
                {isAdmin || isAccountant ? 'All staff credit & partial-payment bills' : `Your credit bills — ${currentStaff}`}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '14px 24px', borderRadius: '16px', textAlign: 'center', minWidth: '120px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', opacity: 0.8, marginBottom: '4px' }}>BALANCE OWED</div>
            <div style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <IndianRupee size={18} style={{ opacity: 0.9 }} />{fmt(totalCreditAmount)}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '14px 24px', borderRadius: '16px', textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', opacity: 0.8, marginBottom: '4px' }}>BOOKINGS</div>
            <div style={{ fontSize: '22px', fontWeight: '800' }}>{filtered.length}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <StatCard label="Balance Owed" value={`₹${fmt(totalCreditAmount)}`} accent="#DC2626" icon={IndianRupee} />
        <StatCard label="Unique Customers" value={totalCustomers} subValue="with pending balance" accent="#7C3AED" icon={User} />
        <StatCard label="Credit Bookings" value={filtered.length} subValue="unpaid / partial" accent="#D97706" icon={FileText} />
      </div>

      {/* Card + Filters */}
      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
            <AlertCircle size={18} color="#DC2626" /> Credit & Partial Bills
          </h2>
          <button onClick={fetchCredits} disabled={isLoading} title="Refresh" style={{ padding: '9px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}>
            <RefreshCw size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={handleExport} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: '#FAFBFC' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search customer, mobile, service..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '9px 36px 9px 36px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', background: '#fff', outline: 'none', boxSizing: 'border-box' }} onFocus={e => (e.target.style.borderColor = '#DC2626')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}><X size={14} /></button>}
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Calendar size={15} color="#64748B" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', background: '#fff', outline: 'none', cursor: 'pointer' }} />
            <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '12px' }}>→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', background: '#fff', outline: 'none', cursor: 'pointer' }} />
            {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ padding: '7px 9px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#DC2626' }}><X size={14} /></button>}
          </div>

          {/* Presets */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowPresets(p => !p)} style={{ padding: '8px 13px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              <Filter size={13} /> Presets <ChevronDown size={12} />
            </button>
            {showPresets && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', minWidth: '130px' }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => { const { start, end } = p.getValue(); setStartDate(start); setEndDate(end); setShowPresets(false); }} style={{ display: 'block', width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#334155', fontWeight: '500' }} onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Staff filter */}
          {(isAdmin || isAccountant) && (
            <div style={{ position: 'relative', minWidth: '155px' }}>
              <User size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 28px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', background: '#fff', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                <option value="">All Staff</option>
                {staffList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <ChevronDown size={12} color="#64748B" style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #F1F5F9', borderTopColor: '#DC2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Loading credit bills...</span>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '12px', color: '#EF4444' }}>
            <AlertCircle size={40} />
            <span style={{ fontSize: '15px', fontWeight: '600' }}>{error}</span>
            <button onClick={fetchCredits} style={{ padding: '8px 20px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '12px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={28} color="#CBD5E1" />
            </div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#334155' }}>No credit bills found</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>Try adjusting your filters or date range.</div>
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map(booking => {
              const isExpanded = !!expandedIds[booking.bookingId];
              const initial = (booking.customerName || 'W').charAt(0).toUpperCase();
              const billTypeLabel = booking.billType === BILL_TYPES.PARTIAL_PAYMENT ? 'Partial' : 'Credit';
              const billTypeColor = booking.billType === BILL_TYPES.PARTIAL_PAYMENT
                ? { bg: '#FEF3C7', color: '#B45309' }
                : { bg: '#FEF2F2', color: '#DC2626' };

              return (
                <div key={booking.bookingId} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  {/* Header */}
                  <div
                    onClick={() => setExpandedIds(p => ({ ...p, [booking.bookingId]: !p[booking.bookingId] }))}
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#DC2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '800', flexShrink: 0 }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{booking.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {booking.mobile && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Phone size={10} />{booking.mobile}</span>}
                          <span>{booking.date}</span>
                          {(isAdmin || isAccountant) && <span style={{ background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>{booking.staffName}</span>}
                          <span style={{ background: billTypeColor.bg, color: billTypeColor.color, padding: '1px 7px', borderRadius: '20px', fontWeight: '700', fontSize: '10px' }}>{billTypeLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>OWED</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#DC2626' }}>₹{fmt(Math.abs(booking.balance))}</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onSettleBill && onSettleBill(booking); }}
                        style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: '#4F46E5', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Settle Bill
                      </button>
                      {isExpanded ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={{ background: '#F8FAFC', borderTop: '1px solid #F1F5F9', padding: '14px 20px 18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Services</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        {booking.services.map(svc => {
                          const st = svc.serviceStatus || SVC_STATUS.COMPLETED;
                          const cfg = SVC_CFG[st] || SVC_CFG[SVC_STATUS.COMPLETED];
                          return (
                            <div key={svc.rowIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{svc.serviceName}</div>
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                  Qty: {svc.quantity}{svc.walletType ? ` · ${svc.walletType}` : ''}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>₹{fmt(svc.rowTotal)}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: '700' }}>
                                  <cfg.Icon size={10} />{cfg.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Payment breakdown */}
                      <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '12px', display: 'flex', gap: '24px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span>Total: <strong>₹{fmt(booking.bookingTotal)}</strong></span>
                        <span>Paid: <strong style={{ color: '#10B981' }}>₹{fmt(booking.amountPaid)}</strong></span>
                        <span style={{ color: '#DC2626' }}>Owed: <strong>₹{fmt(Math.abs(booking.balance))}</strong></span>
                        {booking.gpayAmount > 0 && <span style={{ color: '#64748B' }}>GPay: ₹{fmt(booking.gpayAmount)}</span>}
                        {booking.cashAmount > 0 && <span style={{ color: '#64748B' }}>Cash: ₹{fmt(booking.cashAmount)}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
