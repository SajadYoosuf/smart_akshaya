import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock, User, IndianRupee, FileText } from 'lucide-react';
import { getRows } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function PendingBillsPopup({ userSession, isOpen, onClose }) {
  const [pendingBills, setPendingBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userSession) {
      fetchPendingBills();
    }
  }, [isOpen, userSession]);

  const fetchPendingBills = async () => {
    setIsLoading(true);
    try {
      const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
      if (rows && rows.length > 1) {
        const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        
        const dateIdx = headers.findIndex(h => h.includes('date')) >= 0 ? headers.findIndex(h => h.includes('date')) : 0;
        const staffIdx = headers.findIndex(h => h.includes('staff')) >= 0 ? headers.findIndex(h => h.includes('staff')) : 2;
        const nameIdx = headers.findIndex(h => h.includes('customer') || (h.includes('name') && !h.includes('staff'))) >= 0 ? headers.findIndex(h => h.includes('customer') || (h.includes('name') && !h.includes('staff'))) : 4;
        const serviceIdx = headers.findIndex(h => h.includes('service')) >= 0 ? headers.findIndex(h => h.includes('service')) : 5;
        const totalIdx = headers.findIndex(h => h.includes('total') && !h.includes('qty')) >= 0 ? headers.findIndex(h => h.includes('total') && !h.includes('qty')) : 7;
        const statusIdx = headers.findIndex(h => h.includes('status')) >= 0 ? headers.findIndex(h => h.includes('status')) : 13;

        const myPendingBills = rows.slice(1).filter((row) => {
          const statusVal = (row[statusIdx] || 'pending').toString().trim().toLowerCase();
          const staffVal = (row[staffIdx] || '').toString().trim().toLowerCase();
          const sessionStaff = (userSession?.name || '').toString().trim().toLowerCase();
          
          return statusVal === 'pending' && staffVal === sessionStaff;
        }).map((row) => ({
          date: row[dateIdx] || '',
          customer: row[nameIdx] || 'Walk-in',
          services: row[serviceIdx] || '',
          total: parseFloat(row[totalIdx]) || 0,
        }));

        setPendingBills(myPendingBills);

        if (myPendingBills.length === 0) {
          onClose(); // Auto close if no pending bills
        }
      } else {
        onClose(); // No data
      }
    } catch (error) {
      console.error('Error fetching pending bills:', error);
      onClose(); // Close on error to not block UI
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // If still loading, we can show a small spinner, or just wait
  if (isLoading) return null; // We wait until data is loaded to show the popup, avoiding jarring flashes
  if (pendingBills.length === 0) return null; // Defensive, should be closed

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '560px',
        maxHeight: '85vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderBottom: '1px solid #FDE68A',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', height: '48px', 
              borderRadius: '16px', 
              background: '#F59E0B', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}>
              <AlertTriangle size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#92400E', letterSpacing: '-0.3px' }}>Action Required</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#B45309', fontWeight: '500' }}>
                You have {pendingBills.length} pending bill{pendingBills.length !== 1 ? 's' : ''} to settle
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(253, 230, 138, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: '#B45309',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(253, 230, 138, 0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(253, 230, 138, 0.5)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
            Please ensure these pending bills are settled as soon as possible.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingBills.map((bill, index) => (
              <div key={index} style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', background: '#DBEAFE', borderRadius: '8px' }}>
                      <User size={16} color="#2563EB" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>{bill.customer}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={12} /> {bill.date}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#FEF3C7', padding: '6px 12px', borderRadius: '20px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#B45309' }}>₹{bill.total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <FileText size={14} color="#64748B" style={{ marginTop: '2px' }} />
                  <span style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>{bill.services}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            className="btn"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#F59E0B',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#D97706';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#F59E0B';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
