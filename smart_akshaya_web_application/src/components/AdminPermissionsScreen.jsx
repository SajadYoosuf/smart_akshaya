import React, { useState, useEffect } from 'react';
import { getRows, updateRowColumns } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';
import { Shield, RefreshCw } from 'lucide-react';
import '../index.css';

function AdminPermissionsScreen({ userSession }) {
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPermissions = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const rows = await getRows(SHEETS_CONFIG.permissionsSheetName);
      if (rows && rows.length > 1) {
        const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        const idIdx = headers.indexOf('feature id');
        const nameIdx = headers.indexOf('feature name');
        const accIdx = headers.indexOf('accountant access');
        const staffIdx = headers.indexOf('staff access');
        
        if (idIdx === -1 || nameIdx === -1) {
          setError('Permissions sheet must have "Feature ID" and "Feature Name" columns.');
          setPermissions([]);
          return;
        }

        const perms = rows.slice(1).map((row, index) => {
          return {
            rowIndex: index + 2, // +1 for 0-index, +1 for header row
            id: row[idIdx] || `F-${index + 1}`,
            name: row[nameIdx] || 'Unnamed Feature',
            accountant: accIdx !== -1 ? (row[accIdx] || 'FALSE').toString().trim().toUpperCase() === 'TRUE' : false,
            staff: staffIdx !== -1 ? (row[staffIdx] || 'FALSE').toString().trim().toUpperCase() === 'TRUE' : false,
            accIdx,
            staffIdx
          };
        });
        setPermissions(perms);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = async (perm, field) => {
    setError('');
    setSuccess('');
    const isAccountant = field === 'accountant';
    const colIdx = isAccountant ? perm.accIdx : perm.staffIdx;
    
    if (colIdx === -1) {
      setError(`The column for ${isAccountant ? 'Accountant' : 'Staff'} Access was not found in the sheet.`);
      return;
    }

    const newValue = !perm[field];
    
    // Optimistic update
    setPermissions(prev => prev.map(p => 
      p.id === perm.id ? { ...p, [field]: newValue } : p
    ));

    try {
      const headerName = isAccountant ? 'Accountant Access' : 'Staff Access';
      const updates = {
        [headerName]: newValue ? 'TRUE' : 'FALSE'
      };
      
      await updateRowColumns(SHEETS_CONFIG.permissionsSheetName, perm.rowIndex, updates);
      setSuccess(`Updated access for ${perm.name}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating permission:', err);
      setError('Failed to update permission. Reverting change.');
      // Revert optimistic update
      setPermissions(prev => prev.map(p => 
        p.id === perm.id ? { ...p, [field]: !newValue } : p
      ));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-hero admin-hero--customers">
        <div className="admin-hero-top">
          <div>
            <h2 className="admin-hero-title">Role Permissions</h2>
            <p className="admin-hero-desc">Manage access to features for Staff and Accountants</p>
          </div>
          <div className="admin-hero-actions">
            <button 
              onClick={fetchPermissions} 
              className="admin-tool-btn admin-tool-btn--hero-refresh"
              aria-label="Refresh permissions"
              disabled={isLoading}
            >
              <RefreshCw size={20} className={isLoading ? "admin-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {error && (
          <div className="admin-banner admin-banner--error">
            {error}
          </div>
        )}
        {success && (
          <div className="admin-banner admin-banner--success" style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: '500' }}>
            {success}
          </div>
        )}

        <div className="admin-data-card admin-data-card--rounded">
          <div className="admin-data-card-header">
            <h2 className="admin-data-card-title">Feature Access Control</h2>
            <div className="admin-count-badge">
              {permissions.length} Features
            </div>
          </div>

          {isLoading ? (
            <div className="admin-loading">
              <div className="admin-spinner admin-spinner--teal" />
            </div>
          ) : permissions.length === 0 ? (
            <div className="admin-empty">
              <Shield size={48} className="admin-empty-icon" />
              <p>No permissions found or sheet is empty.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-table--wide">
                <thead>
                  <tr>
                    <th>Feature Name</th>
                    <th style={{ textAlign: 'center' }}>Accountant Access</th>
                    <th style={{ textAlign: 'center' }}>Staff Access</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => (
                    <tr key={perm.id}>
                      <td>
                        <span className="admin-cell-name-text" style={{ fontWeight: 500 }}>{perm.name}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <label className="admin-toggle" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={perm.accountant}
                            onChange={() => handleToggle(perm, 'accountant')}
                            style={{ 
                              width: '18px', 
                              height: '18px', 
                              cursor: 'pointer',
                              accentColor: '#0d9488'
                            }}
                          />
                        </label>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <label className="admin-toggle" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={perm.staff}
                            onChange={() => handleToggle(perm, 'staff')}
                            style={{ 
                              width: '18px', 
                              height: '18px', 
                              cursor: 'pointer',
                              accentColor: '#0d9488'
                            }}
                          />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPermissionsScreen;
