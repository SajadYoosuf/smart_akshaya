import React, { useState, useEffect } from 'react';
import { Bookmark, Search, RefreshCw, Layers, Calendar, Phone, FileText, X, DollarSign, ChevronDown, ChevronUp, Clock, Trash2, ExternalLink } from 'lucide-react';
import { getRows, appendRow, updateRowColumns } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

const isPhoneValue = (value = '') => /^\d{10}$/.test(value.toString().trim());

const buildCustomerLookup = (rows = []) => {
  const lookup = new Map();
  if (!rows || rows.length <= 1) return lookup;

  const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
  const idIdx = headers.indexOf('id') !== -1 ? headers.indexOf('id') : 0;
  const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('customer name');
  const phoneIdx = headers.indexOf('mobile') !== -1 ? headers.indexOf('mobile') : headers.indexOf('mobile number');

  rows.slice(1).forEach(row => {
    const id = (row[idIdx] || '').toString().trim();
    const name = (row[nameIdx] || '').toString().trim();
    const phone = (row[phoneIdx] || '').toString().trim();
    const customer = { id, name, phone };
    if (id) lookup.set(id.toLowerCase(), customer);
    if (name) lookup.set(name.toLowerCase(), customer);
  });

  return lookup;
};

const parseSavedBillRow = (row, idx, customerLookup) => {
  const hasStoredMobile = isPhoneValue(row[3]);
  const isLegacyPending = hasStoredMobile && row.length <= 19;
  const offset = hasStoredMobile ? 1 : 0;
  const customerRef = row[3 + offset] || '';
  const customer = customerLookup.get(customerRef.toString().trim().toLowerCase());

  if (isLegacyPending) {
    return {
      rowIndex: idx + 2,
      date: row[0] || '',
      time: row[1] || '',
      staffName: row[2] || '',
      mobile: customer?.phone || row[3] || '',
      customerName: customer?.name || customerRef,
      customerRef,
      services: row[5] || '',
      quantity: parseInt(row[6]) || 0,
      totalAmount: parseFloat(row[7]) || 0,
      walletCharge: 0,
      gpayUpi: parseFloat(row[9]) || 0,
      cash: parseFloat(row[10]) || 0,
      balance: parseFloat(row[11]) || 0,
      status: (row[12] || 'pending').toString().trim().toLowerCase(),
      serviceCharge: parseFloat(row[13]) || 0,
      wallet: row[15] || '',
      billId: row[17] || '',
      isPriceEdited: (row[18] || '').toString().trim().toLowerCase() === 'yes'
    };
  }

  return {
    rowIndex: idx + 2,
    date: row[0] || '',
    time: row[1] || '',
    staffName: row[2] || '',
    mobile: customer?.phone || (hasStoredMobile ? row[3] : ''),
    customerName: customer?.name || customerRef,
    customerRef,
    services: row[4 + offset] || '',
    quantity: parseInt(row[5 + offset]) || 0,
    totalAmount: parseFloat(row[6 + offset]) || 0,
    walletCharge: parseFloat(row[8 + offset]) || 0,
    gpayUpi: parseFloat(row[9 + offset]) || 0,
    cash: parseFloat(row[10 + offset]) || 0,
    balance: parseFloat(row[11 + offset]) || 0,
    status: (row[12 + offset] || 'pending').toString().trim().toLowerCase(),
    serviceCharge: parseFloat(row[13 + offset]) || 0,
    wallet: row[15 + offset] || '',
    billId: row[17 + offset] || '',
    isPriceEdited: (row[18 + offset] || '').toString().trim().toLowerCase() === 'yes'
  };
};

export default function SavedBillsScreen({ onSettleBill, userSession }) {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settleDialogBill, setSettleDialogBill] = useState(null);
  const [settleGpay, setSettleGpay] = useState('');
  const [settleCash, setSettleCash] = useState('');
  const [staffName, setStaffName] = useState('Staff User');
  const [expandedBills, setExpandedBills] = useState({});

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const [rows, customerRows] = await Promise.all([
        getRows(SHEETS_CONFIG.savedBillsSheetName),
        getRows(SHEETS_CONFIG.customerSheetName).catch(() => [])
      ]);
      const customerLookup = buildCustomerLookup(customerRows);
      if (rows && rows.length > 1) {
        const parsed = rows.slice(1).map((row, idx) => parseSavedBillRow(row, idx, customerLookup));

        setBills(parsed);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.error('Failed to fetch saved bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBills();
    setIsRefreshing(false);
  };

  const handleSettlePayment = async () => {
    if (!settleDialogBill) return;
    
    try {
      // Update status in Saved Bills sheet to 'Completed'
      await updateRowColumns(SHEETS_CONFIG.savedBillsSheetName, settleDialogBill.rowIndex, {
        'status': 'Completed'
      });

      // Append to Service Entries sheet with Completed status
      const row = [
        settleDialogBill.date,
        settleDialogBill.time,
        staffName,
        settleDialogBill.customerRef || settleDialogBill.customerName,
        settleDialogBill.services,
        settleDialogBill.quantity,
        settleDialogBill.totalAmount,
        0,
        settleDialogBill.walletCharge || 0,
        settleGpay || '0',
        settleCash || '0',
        settleDialogBill.balance,
        'Completed',
        settleDialogBill.serviceCharge || 0,
        0,
        settleDialogBill.wallet || '',
        '',
        settleDialogBill.billId || '',
        settleDialogBill.isPriceEdited ? 'Yes' : 'No'
      ];
      await appendRow(SHEETS_CONFIG.serviceEntrySheetName, row);

      alert('Bill settled successfully!');
      setSettleDialogBill(null);
      setSettleGpay('');
      setSettleCash('');
      await fetchBills();
    } catch (error) {
      console.error('Error settling payment:', error);
      alert('Failed to settle payment. Please try again.');
    }
  };

  const filteredBills = bills.filter(b => {
    const query = searchQuery.toLowerCase();
    return (b.customerName || '').toLowerCase().includes(query) ||
           (b.mobile || '').includes(query) ||
           (b.services || '').toLowerCase().includes(query);
  });

  const totalItems = filteredBills.reduce((acc, b) => acc + b.quantity, 0);
  const totalCustomers = new Set(filteredBills.map(b => b.mobile)).size;
  const oldestSave = filteredBills.length > 0 
    ? [...filteredBills].sort((a,b) => new Date(a.date) - new Date(b.date))[0].date 
    : '-';

  const isAdminOrAccountant = userSession?.role === 'admin' || userSession?.role === 'accountant';

  const toggleExpand = (idx) => {
    setExpandedBills(prev => ({...prev, [idx]: !prev[idx]}));
  };

  return (
    <div style={{ 
      padding: 'max(16px, min(32px, 5vw))',
      animation: 'fadeIn 0.3s ease', 
      boxSizing: 'border-box',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: '24px',
        padding: '32px 40px',
        color: 'white',
        boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Saved Bills</h2>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
            Pending & completed bills
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', padding: '12px 24px',
            borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', color: '#fff',
            cursor: 'pointer', transition: 'background-color 0.2s', backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats row - ONLY for Admin/Accountant */}
      {isAdminOrAccountant && (
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <StatCard title="CUSTOMERS" value={totalCustomers} icon={<Layers size={24} color="#0284C7" />} bgColor="#E0F2FE" />
          <StatCard title="TOTAL ITEMS" value={totalItems} icon={<Layers size={24} color="#0284C7" />} bgColor="#E0F2FE" />
          <StatCard title="OLDEST SAVE" value={oldestSave} icon={<Clock size={24} color="#D97706" />} bgColor="#FEF3C7" />
        </div>
      )}

      <div className="glow-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Saved Bills Tracking</h3>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by customer, mobile, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#94A3B8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Bills display area */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Loading saved bills...</span>
          </div>
        ) : filteredBills.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', background: '#F8FAFC' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Bookmark size={28} color="#94A3B8" />
            </div>
            <span style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>No bills found</span>
            <span style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>All bills have been cleared or no bills exist yet.</span>
          </div>
        ) : (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredBills.map((bill, index) => {
              const isExpanded = !!expandedBills[index];
              const isPending = bill.status === 'pending';
              const statusColor = isPending ? { bg: '#FEF3C7', text: '#B45309', badge: 'pending' } : { bg: '#ECFDF5', text: '#10B981', badge: 'completed' };
              const initial = bill.customerName ? bill.customerName.charAt(0).toUpperCase() : 'C';

              const rowBg = bill.isPriceEdited ? '#FEF2F2' : '#fff';

              return (
                <div key={index} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', backgroundColor: rowBg, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  
                  {/* Card Header */}
                  <div 
                    onClick={() => toggleExpand(index)}
                    style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: rowBg }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{bill.customerName || 'Walk-in'}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {bill.mobile || '-'}</span>
                          <span>Saved {bill.date}</span>
                          <span>Created {bill.date}, {bill.time}</span>
                          {isAdminOrAccountant && (
                            <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                              Staff: {bill.staffName || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px' }}>
                        1 item
                      </span>
                      <span style={{ color: '#8B5CF6', fontWeight: '700', backgroundColor: '#EDE9FE', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                        ₹{bill.totalAmount.toFixed(2)}
                      </span>
                      {isExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div style={{ padding: '0 24px 24px 24px', backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <th style={{ padding: '12px 8px', borderBottom: '1px solid #E2E8F0' }}>Service</th>
                            {isAdminOrAccountant && (
                              <>
                                <th style={{ padding: '12px 8px', borderBottom: '1px solid #E2E8F0' }}>Dept. Fee</th>
                                <th style={{ padding: '12px 8px', borderBottom: '1px solid #E2E8F0' }}>Svc Charge</th>
                                <th style={{ padding: '12px 8px', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '12px 8px', borderBottom: '1px solid #E2E8F0' }}>Total</th>
                                <th style={{ padding: '12px 8px', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>Status</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '16px 8px', color: '#1E293B', fontWeight: '500', fontSize: '14px' }}>{bill.services}</td>
                            {isAdminOrAccountant && (
                              <>
                                <td style={{ padding: '16px 8px', color: '#1E293B', fontWeight: '600', fontSize: '14px' }}>₹0.00</td>
                                <td style={{ padding: '16px 8px', color: '#1E293B', fontWeight: '600', fontSize: '14px' }}>₹{bill.totalAmount.toFixed(2)}</td>
                                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                                  <span style={{ backgroundColor: '#E0F2FE', color: '#0284C7', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>x1</span>
                                </td>
                                <td style={{ padding: '16px 8px', color: '#1E293B', fontWeight: '600', fontSize: '14px' }}>₹{bill.totalAmount.toFixed(2)}</td>
                                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                                  <span style={{ backgroundColor: statusColor.bg, color: statusColor.text, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{statusColor.badge}</span>
                                </td>
                              </>
                            )}
                          </tr>
                        </tbody>
                      </table>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #CBD5E1' }}>
                        <div style={{ color: '#64748B', fontSize: '14px' }}>
                          Grand Total: <span style={{ color: '#0284C7', fontWeight: '700' }}>₹{bill.totalAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {isAdminOrAccountant && (
                            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onSettleBill ? onSettleBill(bill) : setSettleDialogBill(bill); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284C7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            <ExternalLink size={14} /> {isAdminOrAccountant ? 'Open in Billing' : 'Settle Bill'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Payment Dialog */}
      {settleDialogBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '90vw', maxWidth: '500px', 
            padding: 'clamp(16px, 5vw, 24px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E2E8F0',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} color="#10B981" /> Settle Payment
              </h4>
              <button
                onClick={() => setSettleDialogBill(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', fontSize: '20px', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Bill Summary */}
              <div style={{ background: '#F8FAFC', padding: 'clamp(8px, 2vw, 12px)', borderRadius: '8px' }}>
                <div style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: '#64748B', marginBottom: '4px' }}>Customer: <strong>{settleDialogBill.customerName}</strong></div>
                <div style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: '#64748B', marginBottom: '4px' }}>Mobile: <strong>{settleDialogBill.mobile}</strong></div>
                <div style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: '#64748B' }}>Bill Total: <strong>₹{settleDialogBill.totalAmount.toFixed(2)}</strong></div>
              </div>

              {/* GPay/UPI Input */}
              <div>
                <label style={{ fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>GPay/UPI Amount</label>
                <input
                  type="number"
                  value={settleGpay}
                  onChange={(e) => setSettleGpay(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: 'clamp(12px, 2vw, 13px)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Cash Input */}
              <div>
                <label style={{ fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Cash Amount</label>
                <input
                  type="number"
                  value={settleCash}
                  onChange={(e) => setSettleCash(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: 'clamp(12px, 2vw, 13px)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Balance Display */}
              <div style={{ background: '#F8FAFC', padding: 'clamp(8px, 2vw, 12px)', borderRadius: '8px' }}>
                <div style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: '#64748B' }}>
                  Settlement Balance: <strong style={{ color: '#1E293B' }}>₹{(parseFloat(settleGpay || 0) + parseFloat(settleCash || 0) - settleDialogBill.totalAmount).toFixed(2)}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSettlePayment}
                  style={{
                    flex: 1, minWidth: '120px', background: '#10B981', color: 'white', border: 'none',
                    padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                    fontSize: 'clamp(12px, 2vw, 13px)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10B981'}
                >
                  Complete Settlement
                </button>
                <button
                  onClick={() => setSettleDialogBill(null)}
                  style={{
                    flex: 1, minWidth: '120px', background: '#E2E8F0', color: '#475569', border: 'none',
                    padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                    fontSize: 'clamp(12px, 2vw, 13px)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#CBD5E1'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }) {
  return (
    <div className="glow-card" style={{
      display: 'flex', alignItems: 'center', gap: '20px', width: 'auto', minWidth: '240px', flex: '1 1 240px',
      border: '1px solid #E2E8F0', borderRadius: '16px'
    }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginTop: '4px', letterSpacing: '-0.5px' }}>{value}</div>
      </div>
    </div>
  );
}
