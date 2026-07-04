import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle, ExternalLink, X, Briefcase, Globe, DollarSign, Wallet, Search } from 'lucide-react';
import { getRows, appendRow, updateRow, clearRow } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields & Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // 2-indexed row number
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [deptFee, setDeptFee] = useState('0.00');
  const [serviceCharge, setServiceCharge] = useState('0.00');
  const [commission, setCommission] = useState('0.00');
  const [allowEdit, setAllowEdit] = useState(false);
  const [followupDays, setFollowupDays] = useState('0');
  const [wallet, setWallet] = useState('CASH');
  const [hasIdColumn, setHasIdColumn] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(services);
    } else {
      const q = search.toLowerCase();
      setFiltered(services.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.wallet || '').toLowerCase().includes(q)
      ));
    }
  }, [search, services]);

  const fetchServices = async () => {
    setIsLoading(true);
    setError('');
    try {
      const rows = await getRows(SHEETS_CONFIG.serviceSheetName);
      if (rows && rows.length > 0) {
        const list = [];
        const headers = rows[0];
        const clean = h => (h || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedHeaders = headers.map(clean);

        const getIdx = (keys, defaultVal) => {
          for (const key of keys) {
            const idx = normalizedHeaders.indexOf(key);
            if (idx !== -1) return idx;
          }
          return defaultVal;
        };

        const idIdx = getIdx(['id', 'serviceid', 'srvid'], -1);
        setHasIdColumn(idIdx !== -1);
        const nameIdx = getIdx(['servicename', 'name', 'service'], idIdx === -1 ? 0 : 1);
        const websiteIdx = getIdx(['website', 'url', 'link'], idIdx === -1 ? 1 : 2);
        const deptFeeIdx = getIdx(['departmentfee', 'deptfee'], idIdx === -1 ? 2 : 3);
        const serviceChargeIdx = getIdx(['servicecharge', 'srvcharge'], idIdx === -1 ? 3 : 4);
        const commissionIdx = getIdx(['commission'], idIdx === -1 ? 4 : 5);
        const allowEditIdx = getIdx(['allowedit', 'allowediting'], idIdx === -1 ? 5 : 6);
        const followupIdx = getIdx(['followupdays', 'followup'], idIdx === -1 ? 6 : 7);
        const walletIdx = getIdx(['defaultwallet', 'wallet'], idIdx === -1 ? 7 : 8);

        // The first row is headers
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || (row[nameIdx] || '').toString().trim() === '') continue;

          list.push({
            rowIndex: i + 1,
            name: row[nameIdx] || '',
            website: row[websiteIdx] || '',
            deptFee: row[deptFeeIdx] || '0.00',
            serviceCharge: row[serviceChargeIdx] || '0.00',
            commission: row[commissionIdx] || '0.00',
            allowEdit: (row[allowEditIdx] || '').toString().toLowerCase() === 'true',
            followupDays: row[followupIdx] || '0',
            wallet: row[walletIdx] || 'CASH',
            originalId: row[idIdx] || `SRV-${i}`
          });
        }
        setServices(list);
        setFiltered(list);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load services.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (s) => {
    setIsEditing(true);
    setEditingIndex(s.rowIndex);
    setName(s.name);
    setWebsite(s.website);
    setDeptFee(s.deptFee);
    setServiceCharge(s.serviceCharge);
    setCommission(s.commission);
    setAllowEdit(s.allowEdit);
    setFollowupDays(s.followupDays);
    setWallet(s.wallet);
    setShowFormModal(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setName('');
    setWebsite('');
    setDeptFee('0.00');
    setServiceCharge('0.00');
    setCommission('0.00');
    setAllowEdit(false);
    setFollowupDays('0');
    setWallet('CASH');
    setShowFormModal(false);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Are you sure you want to delete "${s.name}"?`)) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateRow(SHEETS_CONFIG.serviceSheetName, s.rowIndex, ['', '', '', '', '', '', '', '', '']);
      setSuccess('Service deleted successfully!');
      await fetchServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const newId = isEditing
        ? services.find(s => s.rowIndex === editingIndex)?.originalId || `SRV-${editingIndex - 1}`
        : `SRV-${Date.now()}`;

      const rowValues = hasIdColumn ? [
        newId,
        name.trim(),
        website.trim(),
        deptFee.trim() || '0.00',
        serviceCharge.trim() || '0.00',
        commission.trim() || '0.00',
        allowEdit ? 'true' : 'false',
        followupDays.trim() || '0',
        wallet
      ] : [
        name.trim(),
        website.trim(),
        deptFee.trim() || '0.00',
        serviceCharge.trim() || '0.00',
        commission.trim() || '0.00',
        allowEdit ? 'true' : 'false',
        followupDays.trim() || '0',
        wallet
      ];

      if (isEditing) {
        await updateRow(SHEETS_CONFIG.serviceSheetName, editingIndex, rowValues);
        setSuccess('Service updated successfully!');
      } else {
        await appendRow(SHEETS_CONFIG.serviceSheetName, rowValues);
        setSuccess('Service added successfully!');
      }

      handleCancel();
      await fetchServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save service.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper colors for default wallets
  const getBadgeStyle = (label) => {
    let bg = '#EFF6FF'; let text = '#3B82F6'; // Default (Blue)
    if (label === 'EDISTRICT') { bg = '#DCFCE7'; text = '#15803D'; } // Green
    if (label === 'GATEWAY') { bg = '#E0E7FF'; text = '#4338CA'; } // Indigo
    if (label === 'CASH') { bg = '#F1F5F9'; text = '#475569'; } // Slate
    if (label === 'SBI') { bg = '#FEF3C7'; text = '#B45309'; } // Amber

    return {
      display: 'inline-flex',
      padding: '4px 10px',
      background: bg,
      color: text,
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600'
    };
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', position: 'relative', minHeight: 'calc(100vh - 70px)' }}>
      
      {/* Hero Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)', 
        borderRadius: '20px', 
        padding: '32px 40px', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '1px', opacity: 0.8, marginBottom: '8px' }}>
            TOTAL SERVICES
          </div>
          <div style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {services.length}
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Briefcase size={32} opacity={0.9} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{filtered.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '500' }}>RECORDS FOUND</div>
          </div>
        </div>
      </div>

      {/* Message Banners */}
      {success && (
        <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '12px 16px', color: '#059669', fontSize: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 16px', color: '#DC2626', fontSize: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1E293B', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Service List
          <button onClick={fetchServices} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }} title="Reload Data">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </h2>
        
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '12px', color: '#94A3B8' }} />
          <input 
            type="text"
            placeholder="Search by name or wallet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', height: '44px', padding: '0 40px 0 44px', 
              borderRadius: '22px', border: '1px solid #E2E8F0', outline: 'none', 
              fontSize: '14px', backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box'
            }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Modern Data Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading services...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Briefcase size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#64748B' }}>No services found</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>Click the + button to add a new service.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>SERVICE NAME</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>WALLET</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>DEPT FEE</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>SRV CHARGE</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>COMMISSION</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }} className="expense-row">
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {s.name}
                        {s.allowEdit && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} title="Editable"></span>}
                      </div>
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6', textDecoration: 'none', marginTop: '4px' }}>
                          Visit Portal <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={getBadgeStyle(s.wallet)}>
                        {s.wallet}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#475569', textAlign: 'right' }}>
                      ₹{s.deptFee}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#475569', textAlign: 'right' }}>
                      ₹{s.serviceCharge}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#0F172A', textAlign: 'right' }}>
                      ₹{s.commission}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => handleEdit(s)}
                        style={{ background: '#EFF6FF', border: 'none', cursor: 'pointer', color: '#3B82F6', marginRight: '8px', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s)}
                        style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
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
        onClick={() => { handleCancel(); setShowFormModal(true); }}
        style={{
          position: 'fixed', bottom: '40px', right: '40px', width: '64px', height: '64px',
          borderRadius: '32px', backgroundColor: '#6366F1', color: 'white', border: 'none',
          boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, background-color 0.2s', zIndex: 100
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'; e.currentTarget.style.backgroundColor = '#4F46E5'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.backgroundColor = '#6366F1'; }}
      >
        <Plus size={32} />
      </button>

      {/* Glassmorphic Overlay Modal */}
      {showFormModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#6366F1" />
                {isEditing ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '32px' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={labelStyle}>Service Name *</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                    <input 
                      type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Passport Application"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Webpage URL (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                    <input 
                      type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..."
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Dept Fee (₹)</label>
                    <input type="number" step="0.01" value={deptFee} onChange={e => setDeptFee(e.target.value)} style={inputStyleNum} />
                  </div>
                  <div>
                    <label style={labelStyle}>Srv Charge (₹)</label>
                    <input type="number" step="0.01" value={serviceCharge} onChange={e => setServiceCharge(e.target.value)} style={inputStyleNum} />
                  </div>
                  <div>
                    <label style={labelStyle}>Commission (₹)</label>
                    <input type="number" step="0.01" value={commission} onChange={e => setCommission(e.target.value)} style={inputStyleNum} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Default Wallet</label>
                    <div style={{ position: 'relative' }}>
                      <Wallet size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                      <select value={wallet} onChange={e => setWallet(e.target.value)} style={{ ...inputStyleNum, paddingLeft: '44px', color: '#1E293B' }}>
                        <option value="CASH">CASH</option>
                        <option value="EDISTRICT">EDISTRICT</option>
                        <option value="GATEWAY">GATEWAY</option>
                        <option value="SBI">SBI</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Followup Days</label>
                    <input type="number" value={followupDays} onChange={e => setFollowupDays(e.target.value)} style={{ ...inputStyleNum, paddingLeft: '16px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', marginTop: '4px' }}>
                  <input type="checkbox" id="allowEditModal" checked={allowEdit} onChange={e => setAllowEdit(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#6366F1' }} />
                  <label htmlFor="allowEditModal" style={{ fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                    Allow Editing of Fees
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button type="button" onClick={handleCancel}
                    style={{ flex: 1, height: '52px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving}
                    style={{ flex: 2, height: '52px', background: '#6366F1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isSaving ? <RefreshCw size={20} className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Add Service')}
                  </button>
                </div>
              </form>
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

const labelStyle = {
  fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block'
};

const inputStyle = {
  width: '100%', height: '48px', padding: '0 16px 0 44px', borderRadius: '12px', 
  border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box'
};

const inputStyleNum = {
  width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', 
  border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box'
};
