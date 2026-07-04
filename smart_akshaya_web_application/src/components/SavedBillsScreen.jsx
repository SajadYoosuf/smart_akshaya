import React, { useState, useEffect } from 'react';
import { Bookmark, Search, RefreshCw, Layers, Calendar, Phone, FileText, X, DollarSign } from 'lucide-react';
import { getRows, appendRow, updateRowColumns } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function SavedBillsScreen({ onSettleBill }) {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settleDialogBill, setSettleDialogBill] = useState(null);
  const [settleGpay, setSettleGpay] = useState('');
  const [settleCash, setSettleCash] = useState('');
  const [staffName, setStaffName] = useState('Staff User');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const rows = await getRows(SHEETS_CONFIG.savedBillsSheetName);
      if (rows && rows.length > 1) {
        const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        
        const getIdx = (key) => headers.indexOf(key);
        const dateIdx = getIdx('date');
        const timeIdx = getIdx('time');
        const staffIdx = getIdx('staff name');
        const mobileIdx = getIdx('mobile');
        const nameIdx = getIdx('customer name');
        const serviceIdx = getIdx('service');
        const qtyIdx = getIdx('quantity');
        const totalIdx = getIdx('total');
        const gpayIdx = headers.findIndex(h => h.includes('gpay'));
        const cashIdx = headers.findIndex(h => h.includes('cash'));
        const balanceIdx = headers.findIndex(h => h.includes('balance'));
        const statusIdx = headers.findIndex(h => h.includes('status'));

        const parsed = rows.slice(1).map((row, idx) => {
          const statusVal = (row[statusIdx] || 'pending').toString().trim().toLowerCase();
          return {
            rowIndex: idx + 2,
            date: row[dateIdx] || '',
            time: row[timeIdx] || '',
            staffName: row[staffIdx] || '',
            mobile: row[mobileIdx] || '',
            customerName: row[nameIdx] || '',
            services: row[serviceIdx] || '',
            quantity: parseInt(row[qtyIdx]) || 0,
            totalAmount: parseFloat(row[totalIdx]) || 0,
            gpayUpi: parseFloat(row[gpayIdx >= 0 ? gpayIdx : -1] || 0),
            cash: parseFloat(row[cashIdx >= 0 ? cashIdx : -1] || 0),
            balance: parseFloat(row[balanceIdx >= 0 ? balanceIdx : -1] || 0),
            status: statusVal,
          };
        });

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
        settleDialogBill.customerName,
        settleDialogBill.mobile,
        settleDialogBill.services,
        '', // Placeholder for service charge
        '', // Placeholder for wallet charge
        '', // Placeholder for wallet type
        settleDialogBill.quantity,
        settleDialogBill.totalAmount,
        settleGpay || '0',
        settleCash || '0',
        settleDialogBill.balance,
        staffName,
        'Completed'
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
  const pendingCount = filteredBills.filter(b => b.status === 'pending').length;

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

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <StatCard title="PENDING BILLS" value={pendingCount} icon={<Layers size={24} color="#D97706" />} bgColor="#FEF3C7" />
        <StatCard title="TOTAL CUSTOMERS" value={totalCustomers} icon={<Layers size={24} color="#0284C7" />} bgColor="#E0F2FE" />
        <StatCard title="TOTAL ITEMS" value={totalItems} icon={<Layers size={24} color="#0284C7" />} bgColor="#E0F2FE" />
      </div>

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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Services</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date & Time</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, index) => {
                  const isPending = bill.status === 'pending';
                  const statusColor = isPending ? { bg: '#FEF3C7', text: '#B45309', badge: 'Pending' } : { bg: '#ECFDF5', text: '#10B981', badge: 'Completed' };

                  return (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>{bill.customerName || 'Walk-in Customer'}</span>
                          <span style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} /> {bill.mobile || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} color="#64748B" />
                          {bill.services || 'No services'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', color: '#1E293B' }}>{bill.date}</span>
                          <span style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{bill.time}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                          {bill.quantity}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>
                          ₹{bill.totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{
                          padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                          color: statusColor.text, backgroundColor: statusColor.bg, borderRadius: '20px'
                        }}>
                          {statusColor.badge}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {isPending && (
                          <button
                            onClick={() => onSettleBill ? onSettleBill(bill) : setSettleDialogBill(bill)}
                            className="btn"
                            style={{
                              backgroundColor: '#10B981', padding: '8px 16px', borderRadius: '8px', fontSize: '13px'
                            }}
                          >
                            Settle
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
