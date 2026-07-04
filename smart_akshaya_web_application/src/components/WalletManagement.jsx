import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  History,
  Trash2,
  RefreshCw,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { getRows, appendRow, appendRows, updateRowColumns } from '../services/googleSheetsService';

const SHEET = 'Wallets';

const INITIAL_WALLET_DATA = [
  ['ID', 'Wallet Name', 'Opening Balance', 'Current Balance', 'Last Updated', 'Status'],
  ['1', 'Cash', '0.00', '33472.00', '01 Jul 2026 17:35', 'Needs Update'],
  ['2', 'BANK', '-268343.80', '-499678.79', '01 Jul 2026 17:35', 'Needs Update'],
  ['3', 'Edistrict', '2320.00', '1767.00', '30 Jun 2026 18:23', 'Needs Update'],
  ['4', 'CSC', '-77238.00', '-146459.00', '01 Jul 2026 17:25', 'Needs Update'],
  ['5', 'UPI', '0.00', '0.00', '01 Jul 2026 00:00', 'Needs Update'],
  ['6', 'UTI', '-2505.00', '-6839.00', '01 Jul 2026 16:37', 'Needs Update']
];

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  const num = parseFloat(n) || 0;
  const abs = `₹${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return num < 0 ? `−${abs}` : abs;
};

const nowStr = () => {
  const d = new Date();
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Input helper ─────────────────────────────────────────────────────────────
const labelStyle = { fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' };
const inputStyle = { width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };

export default function WalletManagement() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // modals
  const [addModal, setAddModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [addFundsModal, setAddFundsModal] = useState(null); // wallet object

  // form state
  const [newName, setNewName] = useState('');
  const [newOpening, setNewOpening] = useState('');
  const [txFrom, setTxFrom] = useState('');
  const [txTo, setTxTo] = useState('');
  const [txAmt, setTxAmt] = useState('');
  const [txNote, setTxNote] = useState('');
  const [addAmt, setAddAmt] = useState('');
  const [addNote, setAddNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchWallets(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchWallets = async () => {
    setLoading(true);
    setError('');
    try {
      let rows = await getRows(SHEET);
      
      // Auto-populate if empty
      if (!rows || rows.length === 0) {
        showToast('Initializing empty Wallets sheet...');
        await appendRows(SHEET, INITIAL_WALLET_DATA);
        rows = await getRows(SHEET);
      }
      
      if (!rows || rows.length <= 1) { setWallets([]); return; }
      const h = rows[0].map((v) => v.trim().toLowerCase());
      const gi = (k) => h.indexOf(k);
      const list = rows.slice(1).map((r, idx) => ({
        rowIndex: idx + 2, // 1-indexed, skip header
        id: r[gi('id')] || String(idx + 1),
        name: r[gi('wallet name')] || r[gi('name')] || `Wallet ${idx + 1}`,
        opening: parseFloat(r[gi('opening balance')] || 0),
        current: parseFloat(r[gi('current balance')] || 0),
        updated: r[gi('last updated')] || '—',
        status: r[gi('status')] || 'Updated',
      }));
      setWallets(list);
    } catch (e) {
      setError(e.message || 'Failed to load wallets. Check if the Wallets sheet exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const id = Date.now();
      const opening = parseFloat(newOpening) || 0;
      await appendRow(SHEET, [id, newName.trim(), opening, opening, nowStr(), 'Updated']);
      showToast(`Wallet "${newName}" added.`);
      setAddModal(false);
      setNewName(''); setNewOpening('');
      fetchWallets();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!addFundsModal || !addAmt) return;
    setSaving(true);
    try {
      const amt = parseFloat(addAmt);
      const newBalance = addFundsModal.current + amt;
      await updateRowColumns(SHEET, addFundsModal.rowIndex, { 'current balance': newBalance, 'last updated': nowStr() });
      showToast(`Balance updated for ${addFundsModal.name}`);
      setAddFundsModal(null); setAddAmt(''); setAddNote('');
      fetchWallets();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!txFrom || !txTo || !txAmt || txFrom === txTo) return;
    setSaving(true);
    try {
      const amt = parseFloat(txAmt);
      const fromW = wallets.find((w) => w.name === txFrom);
      const toW = wallets.find((w) => w.name === txTo);
      if (!fromW || !toW) return;
      await updateRowColumns(SHEET, fromW.rowIndex, { 'current balance': fromW.current - amt, 'last updated': nowStr() });
      await updateRowColumns(SHEET, toW.rowIndex, { 'current balance': toW.current + amt, 'last updated': nowStr() });
      showToast(`Transferred ${fmt(amt)} from ${txFrom} to ${txTo}`);
      setTransferModal(false); setTxFrom(''); setTxTo(''); setTxAmt(''); setTxNote('');
      fetchWallets();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const filtered = wallets.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, w) => sum + w.current, 0);

  return (
    <div className="admin-page">
      
      {/* Hero Header Section */}
      <div className="admin-hero admin-hero--wallet">
        <div className="admin-hero-main">
          <div className="admin-hero-label">NET WALLET BALANCE</div>
          <div className="admin-hero-amount">
            <span className="admin-hero-currency">₹</span>
            {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="admin-hero-meta-card">
          <Wallet size={32} opacity={0.9} />
          <div>
            <div className="admin-hero-meta-value">{wallets.length}</div>
            <div className="admin-hero-meta-label">ACTIVE WALLETS</div>
          </div>
        </div>
      </div>

      {/* Message Banners */}
      {toast && (
        <div className="admin-banner admin-banner--success">
          <CheckCircle size={18} />
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="admin-banner admin-banner--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <h2 className="admin-toolbar-title">
          Wallet Balances
          <button type="button" onClick={fetchWallets} className="admin-toolbar-refresh" title="Reload Data">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </h2>
        
        <div className="admin-toolbar-actions">
          <div className="admin-search">
            <Search size={18} className="admin-search-icon" />
            <input 
              type="text"
              placeholder="Search wallets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
          
          <button type="button" onClick={() => setTransferModal(true)} className="admin-tool-btn admin-tool-btn--green">
            <ArrowRightLeft size={16} /> Transfer
          </button>
          
          <button type="button" onClick={() => setHistoryModal(true)} className="admin-tool-btn">
            <History size={16} /> History
          </button>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="admin-data-card">
        {loading ? (
          <div className="admin-loading">
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading wallets...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Wallet size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#64748B' }}>No wallets found</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>Click the + button to create a new wallet.</div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>WALLET NAME</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>OPENING BALANCE</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>CURRENT BALANCE</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>LAST UPDATED</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>STATUS</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }} className="expense-row">
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1E293B', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                          <CreditCard size={16} />
                        </div>
                        {w.name}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: w.opening < 0 ? '#EF4444' : '#64748B', textAlign: 'right' }}>
                      {fmt(w.opening)}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '16px', fontWeight: '800', color: w.current < 0 ? '#EF4444' : '#059669', textAlign: 'right' }}>
                      {fmt(w.current)}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B' }}>
                      {w.updated}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px',
                        backgroundColor: w.status?.toLowerCase().includes('needs update') ? '#FEF2F2' : '#ECFDF5', 
                        color: w.status?.toLowerCase().includes('needs update') ? '#EF4444' : '#10B981' 
                      }}>
                        {w.status?.toLowerCase().includes('needs update') ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                        {w.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => { setAddFundsModal(w); setAddAmt(''); setAddNote(''); }}
                        style={{ background: '#ECFDF5', border: 'none', cursor: 'pointer', color: '#10B981', padding: '8px 12px', borderRadius: '8px', fontWeight: '600', transition: 'background 0.2s', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setAddModal(true)}
        className="admin-fab admin-fab--green"
      >
        <Plus size={32} />
      </button>

      {/* MODALS */}
      
      {/* 1. Add Wallet Modal */}
      {addModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#10B981" /> Add New Wallet
              </h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddWallet} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Wallet Name *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. BANK, Cash, CSC…" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Opening Balance (₹)</label>
                <input type="number" step="0.01" value={newOpening} onChange={e => setNewOpening(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setAddModal(false)} style={{ flex: 1, height: '48px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving || !newName.trim()} style={{ flex: 2, height: '48px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                  {saving ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Transfer Funds Modal */}
      {transferModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={20} color="#10B981" /> Transfer Funds
              </h3>
              <button onClick={() => setTransferModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleTransfer} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>From Wallet *</label>
                <select value={txFrom} onChange={e => setTxFrom(e.target.value)} style={inputStyle} required>
                  <option value="">— Select —</option>
                  {wallets.map(w => <option key={w.id} value={w.name}>{w.name} ({fmt(w.current)})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>To Wallet *</label>
                <select value={txTo} onChange={e => setTxTo(e.target.value)} style={inputStyle} required>
                  <option value="">— Select —</option>
                  {wallets.filter(w => w.name !== txFrom).map(w => <option key={w.id} value={w.name}>{w.name} ({fmt(w.current)})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Amount (₹) *</label>
                <input type="number" step="0.01" value={txAmt} onChange={e => setTxAmt(e.target.value)} placeholder="0.00" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Note (Optional)</label>
                <input type="text" value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="Optional note" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setTransferModal(false)} style={{ flex: 1, height: '48px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving || !txFrom || !txTo || !txAmt || txFrom === txTo} style={{ flex: 2, height: '48px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                  {saving ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Funds Modal */}
      {addFundsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#10B981" /> Adjust Balance
              </h3>
              <button onClick={() => setAddFundsModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddFunds} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '600' }}>{addFundsModal.name} Balance</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: addFundsModal.current < 0 ? '#EF4444' : '#10B981' }}>{fmt(addFundsModal.current)}</span>
              </div>

              <div>
                <label style={labelStyle}>Amount (Use - to debit) *</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#94A3B8' }} />
                  <input type="number" step="0.01" value={addAmt} onChange={e => setAddAmt(e.target.value)} placeholder="+500 or -200" style={{...inputStyle, paddingLeft: '44px'}} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Note (Optional)</label>
                <input type="text" value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="Reason for adjustment" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setAddFundsModal(null)} style={{ flex: 1, height: '48px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving || !addAmt} style={{ flex: 2, height: '48px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                  {saving ? 'Updating...' : 'Update Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. History Modal */}
      {historyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#64748B" /> Transaction History
              </h3>
              <button onClick={() => setHistoryModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <History size={48} style={{ color: '#E2E8F0', marginBottom: '16px' }} />
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
                Full transaction log will appear here once wallet history tracking is fully configured in Google Sheets ("Wallet History" tab).
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .expense-row:hover { background-color: #F8FAFC !important; }
      `}</style>
    </div>
  );
}
