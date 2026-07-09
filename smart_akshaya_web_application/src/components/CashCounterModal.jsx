import React, { useState, useEffect } from 'react';
import { Banknote, X, RefreshCcw } from 'lucide-react';

const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function CashCounterModal({ onClose }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const initialCounts = {};
    DENOMINATIONS.forEach(d => initialCounts[d] = '');
    setCounts(initialCounts);
  }, []);

  const handleCountChange = (denomination, value) => {
    const val = value.replace(/[^0-9]/g, '');
    setCounts(prev => ({ ...prev, [denomination]: val }));
  };

  const handleReset = () => {
    const initialCounts = {};
    DENOMINATIONS.forEach(d => initialCounts[d] = '');
    setCounts(initialCounts);
  };

  const calculateTotal = () => {
    return DENOMINATIONS.reduce((sum, d) => {
      const count = parseInt(counts[d]) || 0;
      return sum + (d * count);
    }, 0);
  };

  const calculateTotalNotes = () => {
    return DENOMINATIONS.reduce((sum, d) => {
      return sum + (parseInt(counts[d]) || 0);
    }, 0);
  };

  const grandTotal = calculateTotal();
  const totalNotes = calculateTotalNotes();

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '960px', maxHeight: '90vh', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', backgroundColor: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
               <Banknote size={20} color="#fff" /> 
            </div>
            Cash Counter
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handleReset} style={{ border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.2)'} onMouseLeave={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.1)'}>
              <RefreshCcw size={16} /> Reset
            </button>
            <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '10px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#E2E8F0'} onMouseLeave={(e) => e.target.style.background = '#F1F5F9'}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1, overflowY: 'auto' }}>
          
          {/* Left Side: Grid of Denominations */}
          <div style={{ flex: '1 1 500px', padding: '32px', borderRight: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '20px' }}>
              {DENOMINATIONS.map(d => {
                const count = parseInt(counts[d]) || 0;
                const value = d * count;
                const isFocused = counts[d] !== undefined && counts[d] !== '';
                return (
                  <div key={d} style={{ 
                    background: isFocused ? '#FFFFFF' : '#F8FAFC', 
                    border: '1px solid',
                    borderColor: isFocused ? '#3B82F6' : '#E2E8F0',
                    borderRadius: '16px', 
                    padding: '20px 16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '12px',
                    boxShadow: isFocused ? '0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: isFocused ? '#1E293B' : '#64748B' }}>₹{d}</div>
                    
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={counts[d] !== undefined ? counts[d] : ''} 
                      onChange={(e) => handleCountChange(d, e.target.value)} 
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        height: '44px', 
                        textAlign: 'center',
                        borderRadius: '12px', 
                        border: '1px solid',
                        borderColor: isFocused ? '#93C5FD' : '#CBD5E1', 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#1E293B',
                        backgroundColor: isFocused ? '#EFF6FF' : '#FFFFFF',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { 
                        e.target.style.borderColor = '#3B82F6'; 
                        e.target.style.backgroundColor = '#EFF6FF'; 
                        e.target.parentElement.style.borderColor = '#3B82F6'; 
                        e.target.parentElement.style.background = '#FFFFFF'; 
                        e.target.parentElement.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)'; 
                      }}
                      onBlur={(e) => { 
                        if (!e.target.value) {
                          e.target.style.borderColor = '#CBD5E1'; 
                          e.target.style.backgroundColor = '#FFFFFF';
                          e.target.parentElement.style.borderColor = '#E2E8F0';
                          e.target.parentElement.style.background = '#F8FAFC';
                          e.target.parentElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        }
                      }}
                    />
                    
                    <div style={{ fontSize: '15px', fontWeight: '800', color: value > 0 ? '#10B981' : '#94A3B8' }}>
                      = ₹{value.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Total Summary */}
          <div style={{ flex: '1 1 300px', padding: '32px', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ flex: 1 }}>
               <h5 style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Banknote size={16} /> Summary Details
               </h5>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                 <span style={{ color: '#475569', fontWeight: '700', fontSize: '16px' }}>Total Notes</span>
                 <span style={{ color: '#3B82F6', fontWeight: '800', fontSize: '18px' }}>{totalNotes}</span>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                 <span style={{ color: '#475569', fontWeight: '700', fontSize: '16px' }}>Total Amount</span>
                 <span style={{ color: '#10B981', fontWeight: '800', fontSize: '18px' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
               </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '20px', padding: '32px 24px', color: 'white', boxShadow: '0 15px 30px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, transform: 'rotate(-15deg)', pointerEvents: 'none' }}>
                <Banknote size={120} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', opacity: 0.9, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', position: 'relative', zIndex: 1 }}>Grand Total</div>
              <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px', wordBreak: 'break-word', lineHeight: 1.1, position: 'relative', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>
            
            <button onClick={onClose} style={{ width: '100%', height: '56px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '800', color: '#1E293B', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: '8px' }} onMouseEnter={(e) => { e.target.style.background = '#F1F5F9'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.transform = 'translateY(0)'; }}>
              Done / Close
            </button>
          </div>
          
        </div>
      </div>
      <style>{`
        @keyframes scaleIn { 
          from { opacity: 0; transform: scale(0.95) translateY(10px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
      `}</style>
    </div>
  );
}
