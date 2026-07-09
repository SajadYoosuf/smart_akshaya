import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, X, Clock, User, IndianRupee, FileText, Phone, CreditCard, ChevronRight } from 'lucide-react';
import { getRows } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function PendingBillsPopup({ userSession, isOpen, onClose, onSettleNow }) {
  const [pendingBills, setPendingBills] = useState([]);
  const [creditBills, setCreditBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' or 'credit'

  useEffect(() => {
    if (isOpen && userSession) {
      fetchBills();
    }
  }, [isOpen, userSession]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
      if (rows && rows.length > 1) {
        const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        
        const dateIdx = headers.findIndex(h => h.includes('date')) >= 0 ? headers.findIndex(h => h.includes('date')) : 0;
        const staffIdx = headers.findIndex(h => h.includes('staff')) >= 0 ? headers.findIndex(h => h.includes('staff')) : 2;
        const mobileIdx = headers.findIndex(h => h.includes('mobile') || h.includes('phone')) >= 0 ? headers.findIndex(h => h.includes('mobile') || h.includes('phone')) : 3;
        const nameIdx = headers.findIndex(h => h.includes('customer') || (h.includes('name') && !h.includes('staff'))) >= 0 ? headers.findIndex(h => h.includes('customer') || (h.includes('name') && !h.includes('staff'))) : 4;
        const serviceIdx = headers.findIndex(h => h.includes('service')) >= 0 ? headers.findIndex(h => h.includes('service')) : 5;
        const totalIdx = headers.findIndex(h => h.includes('total') && !h.includes('qty')) >= 0 ? headers.findIndex(h => h.includes('total') && !h.includes('qty')) : 7;
        const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('bill type')) >= 0 ? headers.findIndex(h => h.includes('status') || h.includes('bill type')) : 13;
        const balanceIdx = headers.findIndex(h => h.includes('balance')) >= 0 ? headers.findIndex(h => h.includes('balance')) : 18;

        const myPending = [];
        const myCredit = [];
        const sessionStaff = (userSession?.name || '').toString().trim().toLowerCase();

        rows.slice(1).forEach((row) => {
          const staffVal = (row[staffIdx] || '').toString().trim().toLowerCase();
          
          if (staffVal === sessionStaff) {
            const statusVal = (row[statusIdx] || 'pending').toString().trim().toLowerCase();
            const billTypeVal = (row[13] || '').toString().trim().toLowerCase(); // Usually 13 is bill type
            const balanceVal = parseFloat(row[balanceIdx]) || 0;

            const isPending = statusVal === 'pending' || statusVal === 'service_pending' || billTypeVal === 'service_pending';
            const isCredit = statusVal === 'credit_pending' || statusVal === 'partial_payment' || billTypeVal === 'credit_pending' || billTypeVal === 'partial_payment' || balanceVal < -0.01;

            if (isPending) {
              myPending.push({
                date: row[dateIdx] || '',
                customer: row[nameIdx] || 'Walk-in',
                services: row[serviceIdx] || '',
                total: parseFloat(row[totalIdx]) || 0,
                mobile: row[mobileIdx] || '',
              });
            } else if (isCredit) {
              myCredit.push({
                date: row[dateIdx] || '',
                customer: row[nameIdx] || 'Walk-in',
                services: row[serviceIdx] || '',
                total: Math.abs(balanceVal) || parseFloat(row[totalIdx]) || 0,
                mobile: row[mobileIdx] || '',
              });
            }
          }
        });

        setPendingBills(myPending);
        setCreditBills(myCredit);

        if (myPending.length === 0 && myCredit.length > 0) {
          setActiveTab('credit');
        } else if (myPending.length === 0 && myCredit.length === 0) {
          onClose(); // Auto close if no bills
        }
      } else {
        onClose(); // No data
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      onClose(); // Close on error to not block UI
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  if (isLoading) return null; 
  if (pendingBills.length === 0 && creditBills.length === 0) return null;

  const currentBills = activeTab === 'saved' ? pendingBills : creditBills;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Header - Modern Gradient */}
        <div style={{
          padding: '28px 32px 24px',
          background: 'linear-gradient(135deg, #FFEDD5 0%, #FEF3C7 100%)',
          position: 'relative'
        }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: '#92400E',
              transition: 'all 0.2s',
              backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
          >
            <X size={18} />
          </button>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '56px', height: '56px', 
              borderRadius: '18px', 
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)',
              flexShrink: 0
            }}>
              <AlertTriangle size={28} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div style={{ paddingTop: '2px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#92400E', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                Action Required
              </h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#B45309', fontWeight: '600', lineHeight: 1.4 }}>
                You have bills that require completion or credit payments to settle.
              </p>
            </div>
          </div>
        </div>

        {/* Tabbar */}
        <div style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid #E2E8F0', background: '#FAFBFC' }}>
          <button
            onClick={() => setActiveTab('saved')}
            style={{
              flex: 1,
              padding: '16px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'saved' ? '3px solid #F59E0B' : '3px solid transparent',
              color: activeTab === 'saved' ? '#92400E' : '#64748B',
              fontWeight: activeTab === 'saved' ? '700' : '600',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} /> Saved Bills 
            <span style={{ 
              background: activeTab === 'saved' ? '#FEF3C7' : '#F1F5F9', 
              color: activeTab === 'saved' ? '#B45309' : '#94A3B8', 
              padding: '2px 8px', borderRadius: '12px', fontSize: '12px' 
            }}>{pendingBills.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            style={{
              flex: 1,
              padding: '16px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'credit' ? '3px solid #DC2626' : '3px solid transparent',
              color: activeTab === 'credit' ? '#991B1B' : '#64748B',
              fontWeight: activeTab === 'credit' ? '700' : '600',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <CreditCard size={16} /> Credit 
            <span style={{ 
              background: activeTab === 'credit' ? '#FEE2E2' : '#F1F5F9', 
              color: activeTab === 'credit' ? '#DC2626' : '#94A3B8', 
              padding: '2px 8px', borderRadius: '12px', fontSize: '12px' 
            }}>{creditBills.length}</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px', overflowY: 'auto', background: '#FAFBFC', flex: 1 }}>
          {currentBills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
              <div style={{ width: '48px', height: '48px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle size={24} color="#CBD5E1" />
              </div>
              <p style={{ margin: 0, fontWeight: '600' }}>No pending actions here!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentBills.map((bill, index) => (
                <div key={index} style={{
                  padding: '20px',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ 
                        padding: '10px', 
                        background: activeTab === 'saved' ? '#EFF6FF' : '#FEF2F2', 
                        borderRadius: '14px' 
                      }}>
                        <User size={20} color={activeTab === 'saved' ? '#3B82F6' : '#EF4444'} />
                      </div>
                      <div style={{ paddingTop: '2px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.3px' }}>{bill.customer}</div>
                        {activeTab === 'credit' && bill.mobile && (
                          <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: '500' }}>
                            <Phone size={12} /> {bill.mobile}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: activeTab === 'credit' && bill.mobile ? '2px' : '4px', fontWeight: '500' }}>
                          <Clock size={12} /> {bill.date}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '2px', 
                      background: activeTab === 'saved' ? '#F8FAFC' : '#FEF2F2', 
                      padding: '8px 14px', borderRadius: '14px',
                      border: `1px solid ${activeTab === 'saved' ? '#E2E8F0' : '#FECACA'}`
                    }}>
                      <span style={{ 
                        fontSize: '16px', fontWeight: '800', 
                        color: activeTab === 'saved' ? '#334155' : '#DC2626' 
                      }}>₹{bill.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {activeTab === 'saved' && bill.services && (
                    <div style={{ 
                      background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', 
                      display: 'flex', alignItems: 'flex-start', gap: '8px' 
                    }}>
                      <FileText size={16} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', fontWeight: '500' }}>{bill.services}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          >
            I'll do it later
          </button>
          <button
            onClick={() => onSettleNow(activeTab)}
            style={{
              padding: '14px 28px',
              borderRadius: '16px',
              border: 'none',
              background: activeTab === 'saved' ? '#0F172A' : '#DC2626',
              color: 'white',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'saved' ? '0 8px 20px rgba(15, 23, 42, 0.2)' : '0 8px 20px rgba(220, 38, 38, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = activeTab === 'saved' ? '0 12px 24px rgba(15, 23, 42, 0.3)' : '0 12px 24px rgba(220, 38, 38, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = activeTab === 'saved' ? '0 8px 20px rgba(15, 23, 42, 0.2)' : '0 8px 20px rgba(220, 38, 38, 0.2)';
            }}
          >
            {activeTab === 'saved' ? 'View Saved Bills' : 'Settle Credit'} <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
