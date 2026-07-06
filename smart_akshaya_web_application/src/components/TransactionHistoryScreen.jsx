import React, { useState, useEffect, useMemo } from 'react';
import { getRows } from '../services/googleSheetsService';
import { Search, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';

export default function TransactionHistoryScreen({ userSession }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getRows('Transaction History');
      // Format: Date, Time, Wallet, Type, Amount, Balance, Description, StaffName, BillId
      const parsed = rows.slice(1).map(r => ({
        dateStr: r[0] || '',
        timeStr: r[1] || '',
        wallet: r[2] || '',
        type: r[3] || '',
        amount: parseFloat(r[4] || 0),
        balance: parseFloat(r[5] || 0),
        description: r[6] || '',
        staff: r[7] || '',
        billId: r[8] || ''
      }));
      setTransactions(parsed.reverse()); // Show newest first
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transaction history.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse DD-MM-YYYY into Date object
  const parseDate = (ddMMyyyy) => {
    if (!ddMMyyyy) return null;
    const parts = ddMMyyyy.split('-');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return null;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search
      const searchStr = `${t.wallet} ${t.description} ${t.staff} ${t.billId} ${t.type}`.toLowerCase();
      if (searchQuery && !searchStr.includes(searchQuery.toLowerCase())) return false;

      // Date Range
      if (fromDate || toDate) {
        const txDate = parseDate(t.dateStr);
        if (txDate) {
          txDate.setHours(0, 0, 0, 0);
          if (fromDate) {
            const fDate = new Date(fromDate);
            fDate.setHours(0, 0, 0, 0);
            if (txDate < fDate) return false;
          }
          if (toDate) {
            const tDate = new Date(toDate);
            tDate.setHours(0, 0, 0, 0);
            if (txDate > tDate) return false;
          }
        }
      }

      return true;
    });
  }, [transactions, searchQuery, fromDate, toDate]);

  const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)',
        borderRadius: '24px',
        padding: '32px 40px',
        color: 'white',
        boxShadow: '0 10px 25px rgba(13, 148, 136, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>Transaction History</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>Track all incoming and outgoing wallet transactions</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '13px', opacity: 0.8, fontWeight: '600' }}>TOTAL IN</div>
            <div style={{ fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IndianRupee size={20} /> {totalIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '13px', opacity: 0.8, fontWeight: '600' }}>TOTAL OUT</div>
            <div style={{ fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IndianRupee size={20} /> {totalOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by wallet, staff, description, or bill ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Calendar size={18} color="#64748B" />
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none' }}
            />
            <span style={{ color: '#64748B', fontWeight: '500' }}>to</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none' }}
            />
          </div>
          <button 
            onClick={fetchTransactions}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B'
            }}
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? 'spin-anim' : ''} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '16px', background: '#FEF2F2', color: '#EF4444', borderRadius: '12px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        {/* Data Table */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>Date & Time</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>Wallet</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>Amount</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>Description</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>Staff & Bill ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Loading transactions...</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '14px', fontWeight: '500' }}>No transactions found for the selected criteria.</td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: '#FFFFFF', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1E293B' }}>
                      <div style={{ fontWeight: '600' }}>{t.dateStr}</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>{t.timeStr}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1E293B', fontWeight: '600' }}>{t.wallet}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: t.type === 'IN' ? '#ECFDF5' : '#FEF2F2',
                        color: t.type === 'IN' ? '#10B981' : '#EF4444'
                      }}>
                        {t.type === 'IN' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        {t.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1E293B', fontWeight: '600' }}>
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Bal: ₹{t.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1E293B', maxWidth: '250px' }}>
                      {t.description}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1E293B' }}>
                      <div style={{ fontWeight: '500' }}>{t.staff || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{t.billId || '-'}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        input:focus {
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}
