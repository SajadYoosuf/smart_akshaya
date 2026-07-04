import React, { useState, useEffect } from 'react';
import { Search, FileText, ExternalLink, FolderOpen, X, AlertCircle, Download, Printer, Share2 } from 'lucide-react';
import { getAccessToken } from '../services/googleSheetsAuth';
import { getDriveFolderId } from '../config/sheetsConfig';

function AdobePdfIcon({ filename, mimeType }) {
  const extension = (filename || '').split('.').pop().toLowerCase();
  const isPdf = extension === 'pdf' || mimeType === 'application/pdf';
  
  const mainColor = isPdf ? '#e52521' : '#1d4ed8';
  const darkColor = isPdf ? '#b71c1c' : '#172554';
  const label = extension.toUpperCase() || 'PDF';

  return (
    <div
      style={{
        position: 'relative',
        width: '80px',
        height: '96px',
        backgroundColor: mainColor,
        borderRadius: '8px',
        clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginBottom: '4px'
      }}
    >
      {/* Folded Corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '18px',
          height: '18px',
          backgroundColor: darkColor,
          clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
        }}
      />
      {/* Under Fold Shadow */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          right: '18px',
          width: '3px',
          height: '3px',
          backgroundColor: 'rgba(0,0,0,0.15)',
          filter: 'blur(1px)',
        }}
      />

      {/* Document Frame */}
      <div
        style={{
          width: '34px',
          height: '38px',
          border: '2.5px solid white',
          borderRadius: '3px',
          marginTop: '16px',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '0.5px' }} />
            <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '0.5px' }} />
          </div>
          <div style={{ width: '10px', height: '8px', backgroundColor: 'white' }} />
        </div>
        <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '0.5px' }} />
        <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '0.5px' }} />
        <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '0.5px' }} />
      </div>

      {/* Label */}
      <div
        style={{
          marginTop: '6px',
          color: 'white',
          fontSize: '13px',
          fontWeight: '900',
          letterSpacing: '0.5px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function QuickDocumentFinder({ search, setSearch }) {
  const [forms, setForms] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const closePreview = () => {
    setPreviewFile(null);
    setShowShare(false);
  };
  
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
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000`;
        
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
          filename: f.name,
          mime_type: f.mimeType,
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
                    className="glow-card"
                    style={{
                      position: 'relative',
                      padding: '24px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: '0.85',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      textAlign: 'center',
                      backgroundColor: '#F3F4F6'
                    }}
                    onClick={() => setPreviewFile(form)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = '#9CA3AF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }}
                  >
                    {/* Adobe-style PDF/Word Icon representation */}
                    <AdobePdfIcon filename={form.filename} mimeType={form.mime_type} />

                    {/* Text */}
                    <div style={{ width: '100%', overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#1F2937',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
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
                  onClick={closePreview}
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
              gap: '12px',
              position: 'relative'
            }}>
              {copied && (
                <div style={{
                  position: 'absolute',
                  left: '24px',
                  backgroundColor: '#1E293B',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  animation: 'fadeIn 0.2s'
                }}>
                  Link copied to clipboard!
                </div>
              )}

              <button
                onClick={() => handleDownloadAndPrint(previewFile, 'download')}
                disabled={isDownloading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '42px',
                  padding: '0 20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  fontWeight: '600',
                  borderRadius: '21px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <Download size={16} />
                {isDownloading ? 'Processing...' : 'Download PDF'}
              </button>

              <button
                onClick={() => handleDownloadAndPrint(previewFile, 'print')}
                disabled={isDownloading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '42px',
                  padding: '0 20px',
                  backgroundColor: '#0F172A',
                  color: '#ffffff',
                  fontWeight: '600',
                  borderRadius: '21px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <Printer size={16} />
                {isDownloading ? 'Processing...' : 'Print Form'}
              </button>

              {/* Share button container */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowShare(!showShare)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '42px',
                    padding: '0 20px',
                    backgroundColor: '#059669', // Green
                    color: '#ffffff',
                    fontWeight: '600',
                    borderRadius: '21px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <Share2 size={16} />
                  Share PDF
                </button>

                {showShare && (
                  <div style={{
                    position: 'absolute',
                    bottom: '50px',
                    right: 0,
                    width: '160px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 10000,
                    padding: '6px 0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <button
                      onClick={() => {
                        setShowShare(false);
                        const shareText = `Here is the application form "${previewFile.title}": ${previewFile.drive_link}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                      }}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#1F2937'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg viewBox="0 0 24 24" fill="#25D366" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-11.592c-.222-.112-1.316-.65-1.52-.723-.203-.073-.35-.11-.5.115-.15.223-.578.724-.708.874-.13.15-.258.168-.48.056-.222-.112-.936-.345-1.783-1.107-.66-.588-1.106-1.314-1.236-1.537-.13-.223-.014-.343.097-.455.1-.102.222-.258.333-.387.112-.128.149-.223.223-.372.074-.149.037-.28-.018-.392-.056-.113-.5-1.206-.685-1.652-.18-.435-.36-.377-.5-.384-.127-.006-.273-.007-.42-.007-.147 0-.385.056-.588.278-.203.223-.777.758-.777 1.848 0 1.09.794 2.14 1.05 2.48.256.34 1.562 2.385 3.785 3.346.529.228.941.365 1.266.468.53.169.98.145 1.348.09.412-.06 1.316-.539 1.501-1.058.185-.52.185-.965.13-1.058-.056-.093-.203-.15-.425-.262z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        setShowShare(false);
                        const shareText = `Here is the application form "${previewFile.title}": ${previewFile.drive_link}`;
                        const subject = `Application Form: ${previewFile.title}`;
                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
                      }}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#1F2937'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                        <path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6l8 5 8-5v12H4V6z" />
                      </svg>
                      Gmail
                    </button>
                    <button
                      onClick={() => {
                        setShowShare(false);
                        navigator.clipboard.writeText(previewFile.drive_link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#1F2937'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ color: '#6B7280', fontWeight: 'bold' }}>🔗</span>
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
