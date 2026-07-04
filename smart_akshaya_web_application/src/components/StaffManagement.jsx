import React, { useState, useEffect } from 'react';
import { Users, Save, Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle, Plus, X, Search, Shield, User, Mail, Phone, MapPin } from 'lucide-react';
import { getRows, appendRow, updateRow, clearRow } from '../services/googleSheetsService';
import { sha256 } from '../services/googleSheetsAuth';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields & Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // 2-indexed row number
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('staff');
  const [status, setStatus] = useState('Active');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(staff);
    } else {
      const q = search.toLowerCase();
      setFiltered(staff.filter(s => 
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q)
      ));
    }
  }, [search, staff]);

  const fetchStaff = async () => {
    setIsLoading(true);
    setError('');
    try {
      const rows = await getRows('Staff Details');
      if (rows && rows.length > 0) {
        const list = [];
        // The first row is headers
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || (row[0] || '').toString().trim() === '') continue;
          
          list.push({
            rowIndex: i + 1,
            id: row[0],
            name: row.length > 1 ? row[1] : 'Unknown',
            address: row.length > 2 ? row[2] : '',
            mobile: row.length > 3 ? row[3] : '',
            email: row.length > 4 ? row[4] : '',
            userType: row.length > 5 ? row[5].toString().toLowerCase() : 'staff',
            status: row.length > 6 ? row[6] : 'Active',
            password: row.length > 7 ? row[7] : ''
          });
        }
        setStaff(list);
        setFiltered(list);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load staff accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (s) => {
    setIsEditing(true);
    setEditingIndex(s.rowIndex);
    setStaffId(s.id);
    setName(s.name);
    setAddress(s.address);
    setMobile(s.mobile);
    setEmail(s.email);
    setUserType(s.userType);
    setStatus(s.status);
    setPassword('');
    setConfirmPassword('');
    setShowFormModal(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setStaffId('');
    setName('');
    setAddress('');
    setMobile('');
    setEmail('');
    setUserType('staff');
    setStatus('Active');
    setPassword('');
    setConfirmPassword('');
    setShowFormModal(false);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Are you sure you want to delete staff account "${s.name}"?`)) return;
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await clearRow('Staff Details', s.rowIndex, 8);
      setSuccess('Staff profile deleted successfully!');
      await fetchStaff();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete staff profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !mobile.trim() || !email.trim()) {
      setError('Name, Address, Mobile, and Email are required.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      let computedPassword = password.trim();
      const oldStaff = isEditing ? staff.find(s => s.rowIndex === editingIndex) : null;

      // Handle default password generation like Windows side
      if (!isEditing && !computedPassword) {
        const firstName = name.trim().split(' ')[0].toLowerCase();
        computedPassword = `${firstName}akshaya`;
      } else if (computedPassword && computedPassword !== confirmPassword.trim()) {
        throw new Error('Passwords do not match.');
      }

      let passwordHash = '';
      if (isEditing) {
        passwordHash = computedPassword ? await sha256(computedPassword) : oldStaff.password;
      } else {
        passwordHash = await sha256(computedPassword);
      }

      // Generate Staff ID matching Windows nextId reduction logic
      let finalId = staffId.trim();
      if (!isEditing) {
        let nextId = 1;
        if (staff.length > 0) {
          const ids = staff.map(s => parseInt(s.id) || 0);
          nextId = Math.max(...ids) + 1;
        }
        finalId = String(nextId);
      }

      const rowValues = [
        finalId,
        name.trim(),
        address.trim(),
        mobile.trim(),
        email.trim(),
        userType,
        status,
        passwordHash
      ];

      if (isEditing) {
        await updateRow('Staff Details', editingIndex, rowValues);
        setSuccess('Staff account updated successfully!');
      } else {
        await appendRow('Staff Details', rowValues);
        setSuccess('Staff account added successfully!');
      }

      handleCancel();
      await fetchStaff();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save staff account.');
    } finally {
      setIsSaving(false);
    }
  };

  const labelStyle = { fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' };
  const inputStyle = { width: '100%', height: '48px', padding: '0 16px 0 44px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };

  return (
    <div className="admin-page">
      
      {/* Hero Header Section */}
      <div className="admin-hero admin-hero--staff">
        <div className="admin-hero-main">
          <div className="admin-hero-label">STAFF PROFILES</div>
          <div className="admin-hero-amount">{staff.length}</div>
        </div>
        
        <div className="admin-hero-meta-card">
          <Users size={32} opacity={0.9} />
          <div>
            <div className="admin-hero-meta-value">{filtered.length}</div>
            <div className="admin-hero-meta-label">ACTIVE ACCOUNTS</div>
          </div>
        </div>
      </div>

      {/* Message Banners */}
      {success && (
        <div className="admin-banner admin-banner--success">
          <CheckCircle size={18} />
          <span>{success}</span>
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
          Staff Directory
          <button type="button" onClick={fetchStaff} className="admin-toolbar-refresh" title="Reload Data">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </h2>
        
        <div className="admin-search" style={{ flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} className="admin-search-icon" />
          <input 
            type="text"
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-search-input"
            style={{ paddingRight: search ? '40px' : '16px' }}
          />
          {search && (
            <button 
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="admin-data-card">
        {isLoading ? (
          <div className="admin-loading">
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#EC4899', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading staff...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Users size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#64748B' }}>No staff members found</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>Click the + button to add a new staff account.</div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--staff">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>STAFF ID</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>NAME</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>CONTACT</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>ROLE</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>STATUS</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }} className="expense-row">
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748B', fontWeight: '600' }}>
                      #{s.id}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1E293B', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FCE7F3', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        {s.name}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Mail size={12} color="#94A3B8" /> {s.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} color="#94A3B8" /> {s.mobile || 'No Mobile'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
                        backgroundColor: s.userType === 'admin' ? '#EFF6FF' : '#F1F5F9', 
                        color: s.userType === 'admin' ? '#3B82F6' : '#64748B' 
                      }}>
                        {s.userType}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: s.status === 'Active' ? '#ECFDF5' : '#FEF2F2', 
                        color: s.status === 'Active' ? '#10B981' : '#EF4444' 
                      }}>
                        {s.status}
                      </span>
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
        type="button"
        onClick={() => { handleCancel(); setShowFormModal(true); }}
        className="admin-fab admin-fab--pink"
      >
        <Plus size={32} />
      </button>

      {/* Glassmorphic Overlay Modal */}
      {showFormModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Users size={20} color="#EC4899" />
                {isEditing ? 'Edit Staff Profile' : 'Add New Staff'}
              </h3>
              <button type="button" onClick={handleCancel} className="admin-modal-close" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            
            <div className="admin-modal-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Address *</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} required placeholder="e.g. 123 Main St, City" style={inputStyle} />
                  </div>
                </div>

                <div className="admin-form-grid-2">
                  <div>
                    <label style={labelStyle}>Mobile *</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                      <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="10-digit number" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@mail.com" style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div className="admin-form-grid-2">
                  <div>
                    <label style={labelStyle}>User Role</label>
                    <div style={{ position: 'relative' }}>
                      <Shield size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                      <select value={userType} onChange={e => setUserType(e.target.value)} style={{ ...inputStyle, paddingLeft: '44px' }}>
                        <option value="staff">Staff User</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Account Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, paddingLeft: '16px' }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '8px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>{isEditing ? 'New Password' : 'Password'}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isEditing ? "Leave empty to keep current" : "Leave empty for default: [firstname]akshaya"} style={{ ...inputStyle, paddingLeft: '16px' }} />
                  </div>
                  
                  {password && (
                    <div>
                      <label style={labelStyle}>Confirm Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required style={{ ...inputStyle, paddingLeft: '16px' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button type="button" onClick={handleCancel} style={{ flex: 1, height: '52px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} style={{ flex: 2, height: '52px', background: '#EC4899', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isSaving ? <RefreshCw size={20} className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Add Staff')}
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
