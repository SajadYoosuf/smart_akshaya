import React, { useState, useEffect } from 'react';
import { Users, Save, Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
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

  // Form Fields
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
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Are you sure you want to delete staff account "${s.name}"?`)) return;
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      // In Windows: clearRow(spreadsheetId, 'Staff Details', rowIndex, 8)
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

  return (
    <div style={{ animation: 'var(--transition-normal) fadeIn' }}>
      <div className="tool-header">
        <h2 className="tool-title">Staff Management</h2>
        <p className="tool-description">Manage and configure staff login profiles, user roles, passwords, and status indicators.</p>
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
            <Users size={16} style={{ color: 'var(--primary)' }} />
            {isEditing ? 'Edit Staff Profile' : 'Add New Staff'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Address</label>
              <input
                className="form-input"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, City"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input
                  className="form-input"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="10-digit number"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. name@mail.com"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">User Role</label>
                <select
                  className="form-input"
                  value={userType}
                  onChange={e => setUserType(e.target.value)}
                  style={{ height: '40px' }}
                >
                  <option value="staff">Staff User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{ height: '40px' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">
                {isEditing ? 'New Password (leave empty to keep current)' : 'Password (leave empty for default)'}
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEditing ? 'Enter new password' : 'Default password: [firstname]akshaya'}
              />
            </div>

            {password && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

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
                    {isEditing ? 'Save Profile' : 'Add Staff'}
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
              placeholder="Search staff..."
              style={{ maxWidth: '300px', height: '36px' }}
            />
            <button
              onClick={fetchStaff}
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
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Querying Staff sheet...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                No accounts found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>ID / Name</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Email / Mobile</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Role</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '10px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600' }}>ID: {s.id}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{s.email}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.mobile || 'No Mobile'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          backgroundColor: s.userType === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: s.userType === 'admin' ? '#60a5fa' : 'var(--text-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          textTransform: 'capitalize'
                        }}>{s.userType}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          backgroundColor: s.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: s.status === 'Active' ? '#34d399' : '#f87171',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>{s.status}</span>
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
                        <button
                          onClick={() => handleDelete(s)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', color: '#f87171' }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
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
