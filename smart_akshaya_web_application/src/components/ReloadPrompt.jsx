import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      padding: '20px',
      zIndex: 9999,
      maxWidth: '320px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#1E293B', fontWeight: '700' }}>Update Available</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            A new version of Smart Akshaya is available.
          </p>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>
      
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          backgroundColor: '#4F46E5',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
      >
        <RefreshCw size={16} />
        Update Now
      </button>
    </div>
  );
}
