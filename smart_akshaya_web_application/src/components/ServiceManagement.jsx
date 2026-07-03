import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { getRows, appendRow, updateRow } from '../services/googleSheetsService';

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
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
        (s.website || '').toLowerCase().includes(q)
      ));
    }
  }, [search, services]);

  const fetchServices = async () => {
    setIsLoading(true);
    setError('');
    try {
      const rows = await getRows('Services');
      if (rows && rows.length > 0) {
        const list = [];
        // The first row is headers
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || (row[0] || '').toString().trim() === '') continue;
          
          // Row index is i + 1 (1-based for Google Sheets API range)
          list.push({
            rowIndex: i + 1,
            // Since Windows app maps:
            // serviceName: row[1] (if ID column exists) or row[0]
            // Let's support both robustly. If row[1] exists, we use it, otherwise row[0]
            name: row.length > 1 ? row[1] : row[0],
            website: row.length > 2 ? row[2] : '',
            deptFee: row.length > 3 ? row[3] : '0.00',
            serviceCharge: row.length > 4 ? row[4] : '0.00',
            commission: row.length > 5 ? row[5] : '0.00',
            allowEdit: row.length > 6 ? (row[6] || '').toString().toLowerCase() === 'true' : false,
            followupDays: row.length > 7 ? row[7] : '0',
            wallet: row.length > 8 ? row[8] : 'CASH',
            // Save original row[0] to maintain ID column if it exists
            originalId: row[0]
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Row fields order: [ID, Name, Website, Dept Fee, Service Charge, Commission, Allow Edit, Followup, Wallet]
      // If there's an existing ID or originalId, we keep it. If not, generate a simple serial ID
      const newId = isEditing 
        ? services.find(s => s.rowIndex === editingIndex)?.originalId || `SRV-${editingIndex - 1}`
        : `SRV-${services.length + 1}`;

      const rowValues = [
        newId,
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
        await updateRow('Services', editingIndex, rowValues);
        setSuccess('Service updated successfully!');
      } else {
        await appendRow('Services', rowValues);
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

  return (
    <div style={{ animation: 'var(--transition-normal) fadeIn' }}>
      <div className="tool-header">
        <h2 className="tool-title">Service Management</h2>
        <p className="tool-description">Manage and configure service items, department fees, service charges, and default wallets.</p>
      </div>

      {success && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          color: 'var(--primary)',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          color: '#f87171',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="tool-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Form Panel */}
        <div className="glass-panel glow-card" style={{ padding: '24px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} style={{ color: 'var(--primary)' }} />
            {isEditing ? 'Edit Service' : 'Add New Service'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Service Name</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Passport Application"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Website (Optional)</label>
              <input
                className="form-input"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Dept. Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={deptFee}
                  onChange={e => setDeptFee(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={serviceCharge}
                  onChange={e => setServiceCharge(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Commission (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={commission}
                  onChange={e => setCommission(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up Days</label>
                <input
                  type="number"
                  className="form-input"
                  value={followupDays}
                  onChange={e => setFollowupDays(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Default Wallet</label>
              <select
                className="form-input"
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                style={{ height: '40px' }}
              >
                <option value="CASH">CASH</option>
                <option value="GPAY/UPI">GPAY/UPI</option>
                <option value="AKSHAYA WALLET">AKSHAYA WALLET</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="allowEdit"
                checked={allowEdit}
                onChange={e => setAllowEdit(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="allowEdit" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                Allow editing service charges on entry
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, height: '40px' }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <Save size={14} />
                    {isEditing ? 'Save Changes' : 'Add Service'}
                  </>
                )}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline"
                  style={{ height: '40px' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="glass-panel glow-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <input
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services..."
              style={{ maxWidth: '300px', height: '36px' }}
            />
            <button
              onClick={fetchServices}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '36px', fontSize: '12px' }}
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              Reload
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '12px' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Querying Services sheet...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                No services found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Service Name</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Dept. Fee</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Service Charge</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Wallet</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{s.name}</span>
                          {s.website && (
                            <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                              Visit Portal <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>₹{s.deptFee}</td>
                      <td style={{ padding: '12px 8px' }}>₹{s.serviceCharge}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>{s.wallet}</span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEdit(s)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', marginRight: '6px' }}
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
