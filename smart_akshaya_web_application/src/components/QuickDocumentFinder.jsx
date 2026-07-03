import React, { useState, useEffect } from 'react';
import { Search, FileText, ExternalLink, FolderOpen, X, AlertCircle, Download, Printer } from 'lucide-react';
import { getAccessToken } from '../services/googleSheetsAuth';
import { getDriveFolderId } from '../config/sheetsConfig';

export default function QuickDocumentFinder() {
  const [forms, setForms] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  
  const folderId = getDriveFolderId();

  useEffect(() => {
    if (!folderId) {
      setError('Google Drive Folder ID is not configured. Please set it in the Sheet Config settings.');
      setLoading(false);
      return;
    }

    async function fetchDriveFiles() {
      try {
        setLoading(true);
        setError('');
        const token = await getAccessToken();
        
        // Fetch PDFs from the shared Google Drive folder
        const q = `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&pageSize=1000`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let errorText = response.statusText;
          try {
            const errData = await response.json();
            if (errData && errData.error && errData.error.message) {
              errorText = errData.error.message;
            }
          } catch (_) {}

          if (response.status === 404 || response.status === 403) {
            throw new Error(`Access denied or folder not found (${errorText || response.status}). Ensure the folder is shared with your service account email.`);
          }
          throw new Error(`Google Drive API error: ${errorText || response.status}`);
        }

        const data = await response.json();
        // Clean up extension from name if present
        const parsedFiles = (data.files || []).map(f => ({
          id: f.id,
          title: f.name.replace(/\.[^/.]+$/, ""), // remove extension
          drive_link: f.webViewLink
        }));

        // Sort files alphabetically by name
        parsedFiles.sort((a, b) => a.title.localeCompare(b.title));

        setForms(parsedFiles);
        setFiltered(parsedFiles);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError(err.message || 'Failed to fetch application forms from Google Drive.');
      } finally {
        setLoading(false);
      }
    }

    fetchDriveFiles();
  }, [folderId]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      setFiltered(forms);
    } else {
      setFiltered(
        forms.filter((f) => (f.title || '').toLowerCase().includes(q))
      );
    }
  }, [search, forms]);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAndPrint = async (file, action = 'download') => {
    try {
      setIsDownloading(true);
      const token = await getAccessToken();
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch file content');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      if (action === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.title + '.pdf';
        a.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (action === 'print') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          }, 60000); // cleanup after 1 min
        };
      }
    } catch (e) {
      console.error(e);
      alert('Action failed. The file may be too large or access was denied. We will open it in Drive for you.');
      window.open(file.drive_link, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="tool-header">
        <h2 className="tool-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FolderOpen size={26} style={{ color: 'var(--accent)' }} />
          Application Forms
        </h2>
        <p className="tool-description">
          Access official PDF application forms fetched directly from Google Drive.
        </p>
      </div>

      {/* Configuration warning when folderId is missing */}
      {!folderId ? (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px',
            padding: '24px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            maxWidth: '600px',
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontWeight: 'bold' }}>
            <AlertCircle size={20} />
            <span>Google Drive Folder Not Configured</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            To view application forms, you must configure your Google Drive folder in the settings:
          </p>
          <ol style={{ margin: '0 0 0 20px', padding: 0, color: 'var(--text-secondary)' }}>
            <li>Go to the <strong>Sheet Config</strong> page in the sidebar.</li>
            <li>Paste your Google Drive Folder ID.</li>
            <li>Ensure the folder is shared with your service account email as a <strong>Viewer</strong>.</li>
          </ol>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '560px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by form name…"
              style={{ paddingLeft: '42px', paddingRight: search ? '40px' : '16px', height: '42px' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Count badge */}
          {!loading && !error && (
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Showing <strong style={{ color: 'var(--text-secondary)' }}>{filtered.length}</strong> of{' '}
              {forms.length} application forms
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px',
                padding: '16px 20px',
                color: '#f87171',
                fontSize: '13.5px',
                maxWidth: '600px',
                lineHeight: 1.5
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Error Loading Folder:</div>
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel"
                  style={{ padding: '20px', aspectRatio: '1 / 1.414', opacity: 0.3, animation: 'pulse 1.5s ease infinite', borderRadius: '8px' }}
                />
              ))}
            </div>
          )}

          {/* Forms grid */}
          {!loading && !error && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '20px',
              }}
            >
              {filtered.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    padding: '60px 0',
                    fontSize: '14px',
                  }}
                >
                  No application forms found matching "{search}"
                </div>
              ) : (
                filtered.map((form) => (
                  <div
                    key={form.id}
                    className="glass-panel glow-card"
                    style={{
                      position: 'relative',
                      padding: '28px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: '1 / 1.414',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      border: '1px solid var(--border)',
                      borderTop: '4px solid #ef4444',
                      borderRadius: '8px',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-surface)'
                    }}
                    onClick={() => setPreviewFile(form)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.15)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.borderTopColor = '#ef4444';
                    }}
                  >
                    {/* PDF Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}>
                      PDF
                    </div>

                    {/* Icon */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginBottom: '8px'
                      }}
                    >
                      <FileText size={28} style={{ color: '#ef4444' }} />
                    </div>

                    {/* Text */}
                    <div style={{ width: '100%', overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={form.title}
                      >
                        {form.title}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ─── PDF Preview Modal (Google Drive Embed Preview) ─── */}
      {previewFile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '95vw',
            maxWidth: '750px',
            height: '88vh',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-2xl)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--bg-base)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <FileText size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {previewFile.title}
                </h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => window.open(previewFile.drive_link, '_blank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <ExternalLink size={13} />
                  Open in Drive
                </button>
                
                <button
                  onClick={() => setPreviewFile(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '50%',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF Iframe */}
            <div style={{ flex: 1, backgroundColor: 'var(--bg-base)', position: 'relative' }}>
              <iframe
                src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                title="Google Drive Document Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay"
              />
            </div>
            
            {/* Modal Footer (Bottom Action Bar) */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg-base)',
              gap: '12px'
            }}>
              <button
                className="btn btn-outline"
                onClick={() => handleDownloadAndPrint(previewFile, 'download')}
                disabled={isDownloading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} />
                {isDownloading ? 'Processing...' : 'Download PDF'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleDownloadAndPrint(previewFile, 'print')}
                disabled={isDownloading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Printer size={16} />
                {isDownloading ? 'Processing...' : 'Print Form'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
