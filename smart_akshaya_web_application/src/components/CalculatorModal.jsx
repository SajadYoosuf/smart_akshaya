import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';

export default function CalculatorModal({ onClose }) {
  const [totalCharges, setTotalCharges] = useState('');
  const [customerPaid, setCustomerPaid] = useState('');

  const total = parseFloat(totalCharges) || 0;
  const paid = parseFloat(customerPaid) || 0;
  const balance = paid - total;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div className="glass-panel" style={{ width: '320px', padding: '24px', animation: 'slideUp 0.3s ease-out', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} style={{ color: 'var(--primary)' }} /> Balance Calculator
          </h4>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px', display: 'block' }}>Total charges</label>
            <input 
              type="number" 
              value={totalCharges} 
              onChange={(e) => setTotalCharges(e.target.value)} 
              placeholder="0.00" 
              className="form-input" 
              autoFocus 
              style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px', display: 'block' }}>Customer paid</label>
            <input 
              type="number" 
              value={customerPaid} 
              onChange={(e) => setCustomerPaid(e.target.value)} 
              placeholder="0.00" 
              className="form-input" 
              style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px', display: 'block' }}>Balance amount</label>
            <div className="form-input" style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', fontWeight: 'bold', color: balance >= 0 ? '#10B981' : '#EF4444', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px' }}>
              ₹{balance.toFixed(2)}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ marginTop: '8px', width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '600', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
