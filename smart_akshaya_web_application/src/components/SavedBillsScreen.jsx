import React, { useState, useEffect, useCallback } from 'react';
import {
  Bookmark, Search, RefreshCw, Phone, X,
  ChevronDown, ChevronUp, Circle, Loader, CheckSquare,
  IndianRupee, AlertTriangle,
} from 'lucide-react';
import { getRows, updateRowColumns } from '../services/googleSheetsService';
import { SHEETS_CONFIG, BILL_TYPES, SVC_STATUS } from '../config/sheetsConfig';
import { groupByBooking, determineBillType } from '../utils/billGrouper';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Parse a raw sheet row into a normalised object.
 * Handles both legacy rows (col F = comma-separated services string, no booking_id)
 * and new rows (col F = single service, col M = booking_id).
 */
const parseRow = (row, idx) => {
  const bookingIdRaw = (row[12] || '').toString().trim(); // col M
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
      serviceStatus: (row[11] || SVC_STATUS.NOT_STARTED).toString().trim().toLowerCase(),
      bookingId,
      billType: (row[13] || BILL_TYPES.COMPLETED).toString().trim().toLowerCase(),
      bookingTotal: parseFloat(row[14]) || 0,
      amountPaid: parseFloat(row[15]) || 0,
      gpayAmount: parseFloat(row[16]) || 0,
      cashAmount: parseFloat(row[17]) || 0,
      balance: parseFloat(row[18]) || 0,
    };
  }

  // Legacy row
  const hasStoredMobile = /^\d{10}$/.test((row[3] || '').toString().trim());
  const offset = hasStoredMobile ? 1 : 0;
  const total = parseFloat(row[6 + offset]) || 0;
  const statusRaw = (row[12 + offset] || 'pending').toString().trim().toLowerCase();

  return {
    rowIndex: idx + 2,
    date: row[0] || '',
    time: row[1] || '',
    staffName: row[2] || '',
    mobile: hasStoredMobile ? row[3] : '',
    customerName: row[3 + offset] || 'Walk-in',
    serviceName: row[4 + offset] || '',  // comma-separated for legacy
    services: row[4 + offset] || '',
    quantity: parseInt(row[5 + offset]) || 1,
    deptFee: 0,
    serviceCharge: total,
    rowTotal: total,
    walletType: row[15 + offset] || '',
    serviceStatus: statusRaw === 'pending' ? SVC_STATUS.NOT_STARTED : SVC_STATUS.COMPLETED,
    bookingId: '',
    billType: statusRaw === 'pending' ? BILL_TYPES.SERVICE_PENDING : BILL_TYPES.COMPLETED,
    bookingTotal: total,
    amountPaid: (parseFloat(row[9 + offset]) || 0) + (parseFloat(row[10 + offset]) || 0),
    gpayAmount: parseFloat(row[9 + offset]) || 0,
    cashAmount: parseFloat(row[10 + offset]) || 0,
    balance: parseFloat(row[11 + offset]) || 0,
  };
};

// ── status config ─────────────────────────────────────────────────────────────

const SVC_CFG = {
  [SVC_STATUS.NOT_STARTED]: { label: 'Not Started', bg: '#F1F5F9', color: '#64748B', Icon: Circle },
  [SVC_STATUS.IN_PROGRESS]: { label: 'In Progress', bg: '#FEF3C7', color: '#B45309', Icon: Loader },
  [SVC_STATUS.COMPLETED]:   { label: 'Completed',   bg: '#ECFDF5', color: '#059669', Icon: CheckSquare },
};

const SVC_CYCLE = {
  [SVC_STATUS.NOT_STARTED]: SVC_STATUS.IN_PROGRESS,
  [SVC_STATUS.IN_PROGRESS]: SVC_STATUS.COMPLETED,
  [SVC_STATUS.COMPLETED]:   SVC_STATUS.NOT_STARTED,
};

// ── main component ────────────────────────────────────────────────────────────

export default function SavedBillsScreen({ onSettleBill, userSession }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState({});
  const [updatingRow, setUpdatingRow] = useState(null); // rowIndex being updated

  const isAdminOrAccountant =
    userSession?.role === 'admin' || userSession?.role === 'accountant';
  const currentStaff = userSession?.name || '';

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
      if (rows && rows.length > 1) {
        const parsed = rows.slice(1).map((row, idx) => parseRow(row, idx));

        const grouped = groupByBooking(parsed);

        const pending = grouped.filter(b => {
          return b.billType === BILL_TYPES.SERVICE_PENDING || 
                 b.billType === 'service_pending' || 
                 b.billType === 'pending';
        });

        // Staff sees only their own
        const visible = isAdminOrAccountant
          ? pending
          : pending.filter(b => (b.staffName || '').trim().toLowerCase() === currentStaff.trim().toLowerCase());

        // Sort newest first
        visible.sort((a, b) => {
          const da = new Date(a.date), db = new Date(b.date);
          return isNaN(db) || isNaN(da) ? 0 : db - da;
        });
        setBookings(visible);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('SavedBillsScreen fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdminOrAccountant, currentStaff]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBills();
    setIsRefreshing(false);
  };

  const toggleExpand = (id) =>
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));

  /**
   * Cycle one service's status.
   * If all services in the booking become "completed" after the update,
   * and payment was already collected, promote booking to "completed".
   */
  const handleSelectStatus = async (booking, svc, nextStatus) => {
    if (booking.isLegacy) return; // can't update legacy rows via column name
    setUpdatingRow(svc.rowIndex);

    try {
      await updateRowColumns(SHEETS_CONFIG.serviceEntrySheetName, svc.rowIndex, {
        service_status: nextStatus,
      });

      // Optimistic update locally
      const updatedBookings = bookings.map(b => {
        if (b.bookingId !== booking.bookingId) return b;
        const updatedServices = b.services.map(s =>
          s.rowIndex === svc.rowIndex ? { ...s, serviceStatus: nextStatus } : s
        );
        const newStatuses = updatedServices.map(s => s.serviceStatus);
        const newBillType = determineBillType(newStatuses, b.amountPaid, b.bookingTotal);

        // If all done + payment collected → promote to completed in sheet too
        if (newBillType === BILL_TYPES.COMPLETED) {
          // Fire-and-forget: update all rows of this booking to completed
          Promise.all(
            booking.rowIndices.map(ri =>
              updateRowColumns(SHEETS_CONFIG.serviceEntrySheetName, ri, {
                bill_type: BILL_TYPES.COMPLETED,
              })
            )
          ).catch(console.error);

          // Remove card from the screen
          return null;
        }

        return { ...b, services: updatedServices, billType: newBillType };
      }).filter(Boolean);

      setBookings(updatedBookings);
    } catch (err) {
      console.error('Error updating service status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingRow(null);
    }
  };

  const filtered = bookings.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.mobile || '').includes(q) ||
      b.services.some(s => (s.serviceName || '').toLowerCase().includes(q)) ||
      (b.bookingId || '').includes(q)
    );
  });

  return (
    <div style={{ padding: 'max(16px, min(32px, 5vw))', boxSizing: 'border-box', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: '24px', padding: '32px 40px', color: 'white',
        boxShadow: '0 10px 25px rgba(79,70,229,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px',
      }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Saved Bills
          </h2>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
            Bills where services are still pending
          </p>
        </div>
        <button
          onClick={handleRefresh} disabled={isRefreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Card list */}
      <div className="glow-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Service-Pending Bills
            <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: '600', background: '#EDE9FE', color: '#7C3AED', padding: '2px 10px', borderRadius: '20px' }}>
              {filtered.length}
            </span>
          </h3>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search customer, mobile, service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '38px' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Loading saved bills...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', background: '#F8FAFC' }}>
            <Bookmark size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
            <span style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>No pending-service bills</span>
            <span style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>All services are done, or no bills exist yet.</span>
          </div>
        ) : (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(booking => {
              const isExpanded = !!expandedIds[booking.bookingId];
              const allDone = booking.services.every(s => s.serviceStatus === SVC_STATUS.COMPLETED);
              const initial = (booking.customerName || 'W').charAt(0).toUpperCase();

              return (
                <div key={booking.bookingId} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  {/* Card header */}
                  <div
                    onClick={() => toggleExpand(booking.bookingId)}
                    style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', flexShrink: 0 }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>
                          {booking.customerName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {booking.mobile && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Phone size={11} />{booking.mobile}</span>}
                          <span>{booking.date}</span>
                          {isAdminOrAccountant && <span style={{ background: '#F1F5F9', color: '#475569', padding: '1px 7px', borderRadius: '4px', fontWeight: '600' }}>{booking.staffName}</span>}
                          {booking.isLegacy && <span style={{ background: '#FEF3C7', color: '#B45309', padding: '1px 7px', borderRadius: '4px', fontWeight: '600', fontSize: '10px' }}>LEGACY</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Progress badge */}
                      <span style={{ fontSize: '11px', fontWeight: '700', background: allDone ? '#ECFDF5' : '#FEF3C7', color: allDone ? '#059669' : '#B45309', padding: '4px 10px', borderRadius: '20px' }}>
                        {booking.services.filter(s => s.serviceStatus === SVC_STATUS.COMPLETED).length}/{booking.services.length} done
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSettleBill && onSettleBill(booking); }}
                        style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: '#4F46E5', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Complete Bill
                      </button>
                      <span style={{ color: '#8B5CF6', fontWeight: '700', background: '#EDE9FE', padding: '4px 10px', borderRadius: '12px', fontSize: '13px' }}>
                        ₹{fmt(booking.bookingTotal)}
                      </span>
                      {isExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                    </div>
                  </div>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div style={{ background: '#F8FAFC', borderTop: '1px solid #F1F5F9', padding: '16px 24px 20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Services — click a status badge to update
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {booking.services.map(svc => {
                          const st = svc.serviceStatus || SVC_STATUS.NOT_STARTED;
                          const cfg = SVC_CFG[st] || SVC_CFG[SVC_STATUS.NOT_STARTED];
                          const isUpdating = updatingRow === svc.rowIndex;
                          return (
                            <div key={svc.rowIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', padding: '12px 16px', border: '1px solid #E2E8F0' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{svc.serviceName}</div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                  Qty: {svc.quantity} · Dept: ₹{fmt(svc.deptFee)} · Svc: ₹{fmt(svc.serviceCharge)}
                                  {svc.walletType && ` · ${svc.walletType}`}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>₹{fmt(svc.rowTotal)}</span>
                                <select
                                  disabled={isUpdating || booking.isLegacy}
                                  value={st}
                                  onChange={(e) => handleSelectStatus(booking, svc, e.target.value)}
                                  style={{ height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '13px', fontWeight: '700', color: '#1E293B', outline: 'none', cursor: 'pointer' }}
                                >
                                  <option value={SVC_STATUS.NOT_STARTED}>Not Started</option>
                                  <option value={SVC_STATUS.IN_PROGRESS}>In Progress</option>
                                  <option value={SVC_STATUS.COMPLETED}>Completed</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Payment summary */}
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                          <span>Total: <strong style={{ color: '#1E293B' }}>₹{fmt(booking.bookingTotal)}</strong></span>
                          <span>Paid: <strong style={{ color: '#10B981' }}>₹{fmt(booking.amountPaid)}</strong></span>
                          {booking.balance < -0.01 && (
                            <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={13} />
                              Balance owed: <strong>₹{fmt(Math.abs(booking.balance))}</strong>
                            </span>
                          )}
                        </div>
                        {allDone && (
                          <div style={{ background: '#ECFDF5', color: '#059669', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckSquare size={13} /> All services done — will auto-complete on next status click
                          </div>
                        )}
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
