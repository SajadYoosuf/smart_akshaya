import React, { useState, useEffect } from 'react';
import { Ruler, X, ArrowDownUp } from 'lucide-react';

const UNITS = {
  'Square Meter': { factor: 1, short: 'Sq M' },
  'Square Feet': { factor: 10.76391, short: 'Sq Ft' },
  'Acre': { factor: 0.000247105, short: 'Ac' },
  'Hectare': { factor: 0.0001, short: 'Ha' },
  'Square Yard': { factor: 1.19599, short: 'Sq Yd' },
  'Cent': { factor: 0.0247105, short: 'Cent' }, // common in India
};

export default function AreaConverterModal({ onClose }) {
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('10.76391');
  
  const [fromUnit, setFromUnit] = useState('Square Meter');
  const [toUnit, setToUnit] = useState('Square Feet');

  const handleFromChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setFromValue(val);
      if (val !== '') {
        const baseVal = parseFloat(val) / UNITS[fromUnit].factor;
        setToValue((baseVal * UNITS[toUnit].factor).toFixed(5).replace(/\.?0+$/, ''));
      } else {
        setToValue('');
      }
    }
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setToValue(val);
      if (val !== '') {
        const baseVal = parseFloat(val) / UNITS[toUnit].factor;
        setFromValue((baseVal * UNITS[fromUnit].factor).toFixed(5).replace(/\.?0+$/, ''));
      } else {
        setFromValue('');
      }
    }
  };

  useEffect(() => {
    if (fromValue !== '' && !isNaN(fromValue)) {
      const baseVal = parseFloat(fromValue) / UNITS[fromUnit].factor;
      setToValue((baseVal * UNITS[toUnit].factor).toFixed(5).replace(/\.?0+$/, ''));
    }
  }, [fromUnit, toUnit]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue);
  };

  const conversionHint = `One ${fromUnit} is equal to ${((1 / UNITS[fromUnit].factor) * UNITS[toUnit].factor).toFixed(5).replace(/\.?0+$/, '')} ${UNITS[toUnit].short}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', backgroundColor: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(168, 85, 247, 0.2)' }}>
               <Ruler size={20} color="#fff" /> 
            </div>
            Area Converter
          </h4>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '10px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#E2E8F0'} onMouseLeave={(e) => e.target.style.background = '#F1F5F9'}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ fontSize: '15px', color: '#64748B', fontWeight: '500' }}>
            {conversionHint}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* From Unit */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select from unit
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={fromValue}
                  onChange={handleFromChange}
                  placeholder="0.0"
                  style={{ flex: 1, height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '18px', fontWeight: '600', color: '#1E293B', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#A855F7'}
                  onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                />
                <select 
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  style={{ width: '160px', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: '600', color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', cursor: 'pointer' }}
                >
                  {Object.keys(UNITS).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={swapUnits}
                style={{ width: '40px', height: '40px', borderRadius: '20px', border: '1px solid #E2E8F0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                onMouseEnter={(e) => { e.target.style.background = '#F8FAFC'; e.target.style.color = '#A855F7'; e.target.style.borderColor = '#A855F7'; }}
                onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.color = '#64748B'; e.target.style.borderColor = '#E2E8F0'; }}
                title="Swap Units"
              >
                <ArrowDownUp size={18} />
              </button>
            </div>

            {/* To Unit */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select to unit
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={toValue}
                  onChange={handleToChange}
                  placeholder="0.0"
                  style={{ flex: 1, height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '18px', fontWeight: '600', color: '#1E293B', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#A855F7'}
                  onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                />
                <select 
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  style={{ width: '160px', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: '600', color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', cursor: 'pointer' }}
                >
                  {Object.keys(UNITS).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

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
