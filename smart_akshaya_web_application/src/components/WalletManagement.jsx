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

// ── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{ padding: '28px', minWidth: '380px', maxWidth: '480px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Input helper ─────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

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

  const [txHistory, setTxHistory] = useState([]);

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

  const handleAddWallet = async () => {
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

  const handleAddFunds = async () => {
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

  const handleTransfer = async () => {
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

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10b981',
          color: '#fff', padding: '12px 20px', borderRadius: '10px', zIndex: 2000,
          fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
        }}>
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="tool-header">
        <h2 className="tool-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Wallet size={26} style={{ color: 'var(--secondary)' }} />
          Wallet Management
        </h2>
        <p className="tool-description">
          Welcome, <strong>{localStorage.getItem('smart_akshaya_session') ? JSON.parse(localStorage.getItem('smart_akshaya_session')).name : 'Admin'}</strong> — Manage your wallets, balances, and fund transfers.
        </p>
      </div>

      {/* Action bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by wallet name..."
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <button className="btn btn-primary" style={{ gap: '6px' }} onClick={() => setAddModal(true)}>
            <Plus size={15} /> Add Wallet
          </button>
          <button className="btn btn-secondary" style={{ gap: '6px' }} onClick={() => setTransferModal(true)}>
            <ArrowRightLeft size={15} /> Transfer
          </button>
          <button className="btn btn-outline" style={{ gap: '6px' }} onClick={() => setHistoryModal(true)}>
            <History size={15} /> History
          </button>
          <button className="btn btn-outline" style={{ gap: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
            <Trash2 size={15} /> Delete
          </button>
          <button className="btn btn-outline" style={{ gap: '6px' }} onClick={fetchWallets} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '14px 18px', color: '#f87171', fontSize: '13px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Wallet Name', 'Opening Balance', 'Current Balance', 'Last Updated', 'Status', 'Actions'].map((col) => (
                  <th key={col} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ display: 'inline' }} /> &nbsp;Loading…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No wallets found. Add one above.
                </td></tr>
              ) : filtered.map((w, idx) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>{w.name}</td>
                  <td style={{ padding: '14px 16px', color: w.opening < 0 ? '#f87171' : 'var(--text-secondary)' }}>{fmt(w.opening)}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: w.current < 0 ? '#f87171' : 'var(--primary)' }}>{fmt(w.current)}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>{w.updated}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      padding: '3px 10px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '11px', 
                      fontWeight: '600', 
                      backgroundColor: w.status?.toLowerCase().includes('needs update') ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', 
                      color: w.status?.toLowerCase().includes('needs update') ? '#ef4444' : 'var(--primary)' 
                    }}>
                      {w.status?.toLowerCase().includes('needs update') ? (
                        <AlertCircle size={11} style={{ display: 'inline', marginRight: '4px' }} />
                      ) : (
                        <CheckCircle size={11} style={{ display: 'inline', marginRight: '4px' }} />
                      )}
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '5px 14px', fontSize: '12px', gap: '5px' }}
                      onClick={() => { setAddFundsModal(w); setAddAmt(''); setAddNote(''); }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Wallet Modal ── */}
      {addModal && (
        <Modal title="Add New Wallet" onClose={() => setAddModal(false)}>
          <Field label="Wallet Name *" value={newName} onChange={setNewName} placeholder="e.g. BANK, Cash, CSC…" />
          <Field label="Opening Balance" type="number" value={newOpening} onChange={setNewOpening} placeholder="0.00" />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddWallet} disabled={saving || !newName.trim()}>
            {saving ? 'Saving…' : 'Create Wallet'}
          </button>
        </Modal>
      )}

      {/* ── Transfer Modal ── */}
      {transferModal && (
        <Modal title="Transfer Funds" onClose={() => setTransferModal(false)}>
          <div className="form-group">
            <label className="form-label">From Wallet *</label>
            <select className="form-input" value={txFrom} onChange={(e) => setTxFrom(e.target.value)}>
              <option value="">— Select —</option>
              {wallets.map((w) => <option key={w.id} value={w.name}>{w.name} ({fmt(w.current)})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">To Wallet *</label>
            <select className="form-input" value={txTo} onChange={(e) => setTxTo(e.target.value)}>
              <option value="">— Select —</option>
              {wallets.filter((w) => w.name !== txFrom).map((w) => <option key={w.id} value={w.name}>{w.name} ({fmt(w.current)})</option>)}
            </select>
          </div>
          <Field label="Amount *" type="number" value={txAmt} onChange={setTxAmt} placeholder="0.00" />
          <Field label="Note" value={txNote} onChange={setTxNote} placeholder="Optional note" />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleTransfer}
            disabled={saving || !txFrom || !txTo || !txAmt || txFrom === txTo}>
            {saving ? 'Transferring…' : 'Confirm Transfer'}
          </button>
        </Modal>
      )}

      {/* ── Add Funds Modal ── */}
      {addFundsModal && (
        <Modal title={`Add Funds — ${addFundsModal.name}`} onClose={() => setAddFundsModal(null)}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
            Current Balance: <strong style={{ color: addFundsModal.current < 0 ? '#f87171' : 'var(--primary)' }}>{fmt(addFundsModal.current)}</strong>
          </div>
          <Field label="Amount (use negative to debit)" type="number" value={addAmt} onChange={setAddAmt} placeholder="+500 or -200" />
          <Field label="Note" value={addNote} onChange={setAddNote} placeholder="Reason for adjustment" />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddFunds} disabled={saving || !addAmt}>
            {saving ? 'Updating…' : 'Update Balance'}
          </button>
        </Modal>
      )}

      {/* ── History Modal ── */}
      {historyModal && (
        <Modal title="Wallet Transaction History" onClose={() => setHistoryModal(false)}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Full transaction log will appear here once wallet history tracking is set up in Google Sheets ("Wallet History" tab).
          </p>
        </Modal>
      )}
    </div>
  );
}
