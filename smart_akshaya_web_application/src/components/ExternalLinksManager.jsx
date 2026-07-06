import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, Link as LinkIcon, ExternalLink, Database, Cloud, Star, Monitor, AppWindow, Cpu, Rocket, Loader2 } from 'lucide-react';
import { getRows, appendRow, deleteRow } from '../services/googleSheetsService';

const ICON_OPTIONS = [
  { id: 'Globe', Icon: Globe },
  { id: 'Link', Icon: LinkIcon },
  { id: 'ExternalLink', Icon: ExternalLink },
  { id: 'Database', Icon: Database },
  { id: 'Cloud', Icon: Cloud },
  { id: 'Star', Icon: Star },
  { id: 'Monitor', Icon: Monitor },
  { id: 'AppWindow', Icon: AppWindow },
  { id: 'Cpu', Icon: Cpu },
  { id: 'Rocket', Icon: Rocket },
];

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Blue', value: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' },
  { id: 'teal', label: 'Teal', value: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)' },
  { id: 'green', label: 'Green', value: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' },
  { id: 'purple', label: 'Purple', value: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)' },
  { id: 'pink', label: 'Pink', value: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' },
  { id: 'rose', label: 'Rose', value: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)' },
  { id: 'amber', label: 'Amber', value: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' },
  { id: 'indigo', label: 'Indigo', value: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)' },
];

export default function ExternalLinksManager() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Globe');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getRows('External Links');
      if (rows && rows.length > 0) {
        let startIndex = 1;
        let nameIdx = 0, urlIdx = 1, iconIdx = 2, colorIdx = 3;
        
        const firstRow = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        
        // If we detect header keywords, use them
        if (firstRow.includes('name') || firstRow.includes('url')) {
          nameIdx = firstRow.indexOf('name') !== -1 ? firstRow.indexOf('name') : 0;
          urlIdx = firstRow.indexOf('url') !== -1 ? firstRow.indexOf('url') : 1;
          iconIdx = firstRow.indexOf('icon') !== -1 ? firstRow.indexOf('icon') : 2;
          colorIdx = firstRow.indexOf('color') !== -1 ? firstRow.indexOf('color') : 3;
        } else {
          // No headers found, treat first row as data
          startIndex = 0;
        }
        
        const parsedLinks = [];
        for (let i = startIndex; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0 || (!r[nameIdx] && !r[urlIdx])) continue;
          parsedLinks.push({
            rowIndex: i + 1,
            name: r[nameIdx] || '',
            url: r[urlIdx] || '',
            icon: r[iconIdx] || 'Globe',
            color: r[colorIdx] || COLOR_OPTIONS[0].value,
          });
        }
        setLinks(parsedLinks);
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load external links. Ensure the "External Links" sheet exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !url) return;
    
    setSaving(true);
    try {
      await appendRow('External Links', [name, url, selectedIcon, selectedColor]);
      setShowModal(false);
      setName('');
      setUrl('');
      setSelectedIcon('Globe');
      setSelectedColor(COLOR_OPTIONS[0].value);
      await fetchLinks();
    } catch (err) {
      console.error(err);
      alert('Failed to save the link. Ensure the sheet exists and has headers: Name, URL, Icon, Color.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await deleteRow('External Links', rowIndex);
      await fetchLinks();
    } catch (err) {
      console.error(err);
      alert('Failed to delete the link.');
    }
  };

  const renderIcon = (iconName, color) => {
    const iconObj = ICON_OPTIONS.find(i => i.id === iconName) || ICON_OPTIONS[0];
    const IconCmp = iconObj.Icon;
    return (
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <IconCmp size={20} color="#ffffff" strokeWidth={2.5} />
      </div>
    );
  };

  return (
    <div className="settings-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>External Tools</h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Manage external quick-launch links for the dashboard.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add Tool
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={32} className="spin" color="#10B981" />
        </div>
      ) : links.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <ExternalLink size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#475569' }}>No External Tools Found</h3>
          <p style={{ color: '#94A3B8', marginTop: '8px', marginBottom: '24px' }}>Create your first external tool to show on the dashboard.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Tool</button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tool</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>URL</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {renderIcon(link.icon, link.color)}
                      <span style={{ fontWeight: '600', color: '#1E293B' }}>{link.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                      {link.url}
                    </a>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(link.rowIndex)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px' }}
                      title="Delete Tool"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="modal-content glass-panel glow-card" style={{ 
            maxWidth: '520px', width: '100%', backgroundColor: '#ffffff',
            borderRadius: '24px', overflow: 'hidden', padding: 0,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              padding: '24px 32px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Add External Tool</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Configure a new shortcut for your dashboard</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'white', border: '1px solid #E2E8F0',
                  borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748B', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tool Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Canva, ChatGPT"
                  required
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: '15px',
                    borderRadius: '12px', border: '2px solid #E2E8F0',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    backgroundColor: '#F8FAFC', color: '#0F172A', fontWeight: '500'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visiting URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: '15px',
                    borderRadius: '12px', border: '2px solid #E2E8F0',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    backgroundColor: '#F8FAFC', color: '#0F172A', fontWeight: '500'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Icon</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {ICON_OPTIONS.map((opt) => {
                    const IconCmp = opt.Icon;
                    const isSelected = selectedIcon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedIcon(opt.id)}
                        style={{
                          width: '48px', height: '48px', borderRadius: '12px',
                          border: isSelected ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#EFF6FF' : '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: isSelected ? '#3B82F6' : '#64748B',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
                        }}
                        onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                        onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = '#ffffff'; }}
                      >
                        <IconCmp size={22} strokeWidth={isSelected ? 2.5 : 2} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map((opt) => {
                    const isSelected = selectedColor === opt.value;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedColor(opt.value)}
                        style={{
                          width: '42px', height: '42px', borderRadius: '50%',
                          background: opt.value, cursor: 'pointer',
                          border: isSelected ? '3px solid #1E293B' : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 0 3px #ffffff inset, 0 4px 12px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                        }}
                        title={opt.label}
                        onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.transform = 'scale(1)'; }}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  disabled={saving}
                  style={{
                    padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0',
                    backgroundColor: 'white', color: '#64748B', fontWeight: '600', fontSize: '15px',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{
                    padding: '12px 24px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white', fontWeight: '700', fontSize: '15px',
                    cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                  onMouseEnter={(e) => { if(!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'; } }}
                  onMouseLeave={(e) => { if(!saving) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'; } }}
                >
                  {saving ? <Loader2 size={18} className="spin" /> : 'Save Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
