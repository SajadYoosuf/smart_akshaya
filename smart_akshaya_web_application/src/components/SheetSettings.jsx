import React, { useState, useEffect } from 'react';
import { Database, Users, Save, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { getSpreadsheetId, setSpreadsheetId, getDriveFolderId, setDriveFolderId } from '../config/sheetsConfig';
import { getRows } from '../services/googleSheetsService';

export default function SheetSettings() {
  const [sheetId, setSheetId] = useState('');
  const [folderId, setFolderId] = useState('');
  const [staffList, setStaffList] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    setSheetId(getSpreadsheetId());
    setFolderId(getDriveFolderId());
    fetchStaffAccounts();
  }, []);

  const fetchStaffAccounts = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const rows = await getRows('Staff Details');
      if (rows && rows.length > 1) {
        const headers = rows[0].map(h => h.trim().toLowerCase());
        const idIdx = headers.indexOf('id');
        const nameIdx = headers.indexOf('name');
        const emailIdx = headers.indexOf('email');
        const typeIdx = headers.indexOf('user type');
        const statusIdx = headers.indexOf('status');

        const list = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          list.push({
            id: idIdx !== -1 ? row[idIdx] : i,
            name: nameIdx !== -1 ? row[nameIdx] : 'Unknown',
            email: emailIdx !== -1 ? row[emailIdx] : 'N/A',
            role: typeIdx !== -1 ? row[typeIdx] : 'staff',
            status: statusIdx !== -1 ? row[statusIdx] : 'active'
          });
        }
        setStaffList(list);
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.message || 'Failed to fetch staff accounts. Please check credentials or Spreadsheet ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveId = (e) => {
    e.preventDefault();
    setSpreadsheetId(sheetId.trim());
    setDriveFolderId(folderId.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    fetchStaffAccounts();
  };

  return (
    <div style={{ animation: 'var(--transition-normal) fadeIn' }}>
      <div className="tool-header">
        <h2 className="tool-title">Google Sheet Configuration</h2>
        <p className="tool-description">Manage Google Drive spreadsheet ID settings and view authorized staff access records.</p>
      </div>

      <div className="tool-grid">
        {/* Left Form: Edit Spreadsheet ID */}
        <div className="glass-panel glow-card" style={{ padding: '24px' }}>
          <h3 className="card-title"><Database size={16} style={{ color: 'var(--primary)' }} /> Spreadsheet Link Settings</h3>
          
          <form onSubmit={handleSaveId}>
            <div className="form-group">
              <label className="form-label">Active Spreadsheet ID</label>
              <textarea
                className="form-input"
                rows={2}
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                placeholder="Paste your Google Spreadsheet ID here"
                style={{ fontFamily: 'monospace', fontSize: '13px', resize: 'none' }}
                required
              />
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                💡 Tip: Share the sheet with your service account email listed in `google_sheets_credentials.json` as an Editor.
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Application Forms Google Drive Folder ID</label>
              <input
                className="form-input"
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                placeholder="Paste your Google Drive Folder ID here"
                style={{ fontFamily: 'monospace', fontSize: '13px', height: '40px' }}
              />
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                💡 Tip: Share this folder with your service account email as a Viewer. Copy the folder ID from the Google Drive URL.
              </span>
            </div>

            {saveSuccess && (
              <div 
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={14} />
                <span>Spreadsheet configuration updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px' }}
            >
              <Save size={16} />
              Save Configuration
            </button>
          </form>
        </div>

        {/* Right Info: Fetch accounts and check connectivity */}
        <div className="glass-panel glow-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <h3 className="card-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              <Users size={16} style={{ color: 'var(--secondary)' }} /> Staff Account List
            </h3>
            <button
              onClick={fetchStaffAccounts}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', gap: '4px' }}
            >
              <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
              Reload
            </button>
          </div>

          {fetchError ? (
            <div 
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                color: '#f87171',
                fontSize: '13px',
                lineHeight: 1.4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                <AlertCircle size={16} />
                <span>Failed to Fetch Accounts</span>
              </div>
              <p>{fetchError}</p>
            </div>
          ) : isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Querying Google Sheets...</span>
            </div>
          ) : staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No active profiles found. Configure your Spreadsheet ID first.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px 12px 12px 12px' }}>Name</th>
                    <th style={{ padding: '8px 12px 12px 12px' }}>Email</th>
                    <th style={{ padding: '8px 12px 12px 12px' }}>Role</th>
                    <th style={{ padding: '8px 12px 12px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((st, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{st.name}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{st.email}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                        <span 
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            backgroundColor: st.role === 'admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: st.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
                            fontWeight: '600'
                          }}
                        >
                          {st.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span 
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            backgroundColor: st.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: st.status === 'active' ? 'var(--primary)' : '#ef4444',
                            fontWeight: '600'
                          }}
                        >
                          {st.status}
                        </span>
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
