import React, { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, Eye, EyeOff, Filter, Download, Phone, User, Briefcase, ChevronDown, ChevronUp, CheckCircle, AlertCircle, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { getRows, deleteRow } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function ServiceReportsScreen({ userSession, onEditBill }) {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchServiceEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, startDate, endDate]);

  const fetchServiceEntries = async () => {
    setIsLoading(true);
    try {
      const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
      
      if (rows && rows.length > 1) {
        const parsed = rows.slice(1).map((row, idx) => ({
          id: idx,
          rowIndex: idx + 2,
          sourceSheet: SHEETS_CONFIG.serviceEntrySheetName,
          date: row[0] || '',
          time: row[1] || '',
          staffName: row[2] || '',
          mobile: '', // Not stored in service entry row directly
          customerName: row[3] || 'Walk-in Customer',
          name: row[3] || 'Walk-in Customer',
          services: row[4] || '',
          qty: row[5] || '0',
          total: parseFloat(row[6]) || 0,
          deptFee: parseFloat(row[7]) || 0,
          walletCharge: parseFloat(row[8]) || 0,
          gpayUpi: parseFloat(row[9]) || 0,
          gpay: parseFloat(row[9]) || 0,
          cash: parseFloat(row[10]) || 0,
          balance: parseFloat(row[11]) || 0,
          status: row[12] || 'Completed',
          serviceCharge: parseFloat(row[13]) || 0,
          commission: parseFloat(row[14]) || 0,
          walletType: row[15] || '',
          remarks: row[16] || '',
          billId: row[17] || '',
          isPriceEdited: row[18] === 'Yes'
        }));
        // Sort reverse chronological by default assuming newer is appended
        setEntries(parsed.reverse());
      }
    } catch (error) {
      console.error('Error fetching service entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBill = async (entry) => {
    if (!window.confirm(`Are you sure you want to delete the bill for ${entry.name}?`)) return;
    try {
      await deleteRow(SHEETS_CONFIG.serviceEntrySheetName, entry.rowIndex);
      alert('Bill deleted successfully.');
      fetchServiceEntries();
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill.');
    }
  };

  const applyFilters = () => {
    let filtered = entries;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.name.toLowerCase().includes(term) ||
        entry.mobile.includes(term) ||
        entry.services.toLowerCase().includes(term)
      );
    }

    // Date filter
    if (startDate || endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return true; // fallback if date is unparseable

        const start = startDate ? new Date(startDate) : new Date('2000-01-01');
        start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : new Date('2100-01-01');
        end.setHours(23, 59, 59, 999);
        
        return entryDate >= start && entryDate <= end;
      });
    }

    setFilteredEntries(filtered);
  };

  const calculateStats = () => {
    const total = filteredEntries.reduce((sum, e) => sum + e.total, 0);
    const received = filteredEntries.reduce((sum, e) => sum + (e.gpay + e.cash), 0);
    const pending = filteredEntries.reduce((sum, e) => sum + (e.balance < 0 ? e.balance : 0), 0);
    return { total, received, pending: Math.abs(pending) };
  };

  const stats = calculateStats();

  const handleExport = () => {
    const csv = [
      ['Date', 'Time', 'Staff', 'Mobile', 'Name', 'Services', 'Qty', 'Total', 'GPay', 'Cash', 'Balance', 'Status'],
      ...filteredEntries.map(e => [
        e.date, e.time, e.staffName, e.mobile, e.name, `"${(e.services || '').replace(/"/g, '""')}"`, 
        e.qty, e.total, e.gpay, e.cash, e.balance, e.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const fmt = (n) => {
    return parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="admin-page">
      
      {/* Hero Header Section */}
      <div className="admin-hero admin-hero--reports">
        <div className="admin-hero-row">
          <div className="admin-hero-main">
            <div className="admin-hero-label">TOTAL REVENUE (FILTERED)</div>
            <div className="admin-hero-amount">
              <span className="admin-hero-currency">₹</span>
              {fmt(stats.total)}
            </div>
          </div>

          <div className="admin-hero-substats">
            <div>
              <div className="admin-hero-substat-label">RECEIVED</div>
              <div className="admin-hero-substat-value">₹{fmt(stats.received)}</div>
            </div>
            <div className="admin-hero-divider" />
            <div>
              <div className="admin-hero-substat-label">PENDING</div>
              <div className="admin-hero-substat-value" style={{ color: stats.pending > 0 ? '#FECACA' : 'white' }}>₹{fmt(stats.pending)}</div>
            </div>
          </div>
        </div>
        
        <div className="admin-hero-meta-card">
          <Briefcase size={32} opacity={0.9} />
          <div>
            <div className="admin-hero-meta-value">{filteredEntries.length}</div>
            <div className="admin-hero-meta-label">COMPLETED SERVICES</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <h2 className="admin-toolbar-title">
          Service Entries
          <button type="button" onClick={fetchServiceEntries} className="admin-toolbar-refresh" title="Reload Data">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </h2>
        
        <div className="admin-toolbar-actions">
          <div className="admin-search">
            <Search size={18} className="admin-search-icon" />
            <input 
              type="text"
              placeholder="Search name, mobile, service..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="modern-date-range">
            <div className="modern-date-input-group">
              <Calendar size={16} className="modern-date-icon" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="modern-date-input"
                title="Start Date"
              />
              <span className="modern-date-separator">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="modern-date-input"
                title="End Date"
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="modern-date-clear"
                  title="Clear Dates"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </div>
          
          <button type="button" onClick={handleExport} className="admin-tool-btn">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="admin-data-card">
        {isLoading ? (
          <div className="admin-loading">
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading reports...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Briefcase size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#64748B' }}>No reports found</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your filters or search term.</div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--wide">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>DATE / TIME</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>CUSTOMER</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>SERVICES</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>TOTAL</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>RECEIVED</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>STATUS</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => (
                  <React.Fragment key={e.id}>
                    <tr style={{ borderBottom: expandedId === e.id ? 'none' : '1px solid #F1F5F9', transition: 'background-color 0.15s', backgroundColor: expandedId === e.id ? '#F8FAFC' : 'white' }} className="expense-row">
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>
                        <div style={{ fontWeight: '600', color: '#1E293B', marginBottom: '2px' }}>{e.date}</div>
                        <div>{e.time}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>{e.name || 'N/A'}</div>
                        <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {e.mobile || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', maxWidth: '250px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {e.services || 'No services'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: '800', color: '#0F172A', textAlign: 'right' }}>
                        ₹{fmt(e.total)}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#10B981', textAlign: 'right' }}>
                        ₹{fmt(e.cash + e.gpay)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px',
                          backgroundColor: e.balance < 0 ? '#FEF2F2' : '#ECFDF5', 
                          color: e.balance < 0 ? '#EF4444' : '#10B981' 
                        }}>
                          {e.balance < 0 ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                          {e.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                            style={{ background: expandedId === e.id ? '#E2E8F0' : '#F1F5F9', border: 'none', cursor: 'pointer', color: '#475569', padding: '8px 12px', borderRadius: '8px', fontWeight: '600', transition: 'background 0.2s', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {expandedId === e.id ? 'Hide' : 'View'} {expandedId === e.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {userSession?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => onEditBill && onEditBill(e)}
                                style={{ background: '#E0F2FE', border: 'none', cursor: 'pointer', color: '#0284C7', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit Bill"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteBill(e)}
                                style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Delete Bill"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === e.id && (
                      <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <td colSpan={7} style={{ padding: '0 24px 24px 24px' }}>
                          <div className="admin-expanded-panel" style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ flex: '1 1 200px' }}>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>Transaction Details</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B', fontSize: '13px' }}>Cash Received:</span> <strong style={{ color: '#0F172A' }}>₹{fmt(e.cash)}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B', fontSize: '13px' }}>GPay/UPI:</span> <strong style={{ color: '#0F172A' }}>₹{fmt(e.gpay)}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: '12px' }}><span style={{ color: '#64748B', fontSize: '13px' }}>Pending Balance:</span> <strong style={{ color: e.balance < 0 ? '#EF4444' : '#10B981' }}>₹{fmt(Math.abs(e.balance))}</strong></div>
                              </div>
                            </div>
                            <div style={{ flex: '2 1 300px' }}>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>Service Description</h4>
                              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6', background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                                {e.services || 'No detailed service description provided.'}
                              </p>
                              <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '13px', color: '#64748B' }}>
                                <span><strong>Staff:</strong> {e.staffName || 'N/A'}</span>
                                <span><strong>Quantity:</strong> {e.qty || '0'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .expense-row:hover { background-color: #F8FAFC !important; }
      `}</style>
    </div>
  );
}
