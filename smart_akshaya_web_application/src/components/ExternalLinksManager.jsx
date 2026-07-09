import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, Link as LinkIcon, ExternalLink, Database, Cloud, Star, Monitor, AppWindow, Cpu, Rocket, Loader2, Megaphone, Trash2 } from 'lucide-react';
import { getRows, appendRow, deleteRow } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

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

export default function ExternalLinksManager({ userSession }) {
  const role = userSession?.role || 'staff';
  const isAdminOrAccountant = role === 'admin' || role === 'accountant';

  const [activeTab, setActiveTab] = useState('links'); // 'links' | 'announcements'

  // Links State
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [linksError, setLinksError] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  
  // Link Form
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Globe');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annSubtitle, setAnnSubtitle] = useState('');
  const [annPoints, setAnnPoints] = useState('');
  const [isTargetAll, setIsTargetAll] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState([]);

  useEffect(() => {
    if (activeTab === 'links') {
      fetchLinks();
    } else if (activeTab === 'announcements' && isAdminOrAccountant) {
      fetchAnnouncements();
      fetchStaffList();
    }
  }, [activeTab, isAdminOrAccountant]);

  // --- External Links Methods ---
  const fetchLinks = async () => {
    setLoadingLinks(true);
    setLinksError(null);
    try {
      const rows = await getRows('External Links');
      if (rows && rows.length > 0) {
        let startIndex = 1;
        let nameIdx = 0, urlIdx = 1, iconIdx = 2, colorIdx = 3;
        const firstRow = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        
        if (firstRow.includes('name') || firstRow.includes('url')) {
          nameIdx = firstRow.indexOf('name') !== -1 ? firstRow.indexOf('name') : 0;
          urlIdx = firstRow.indexOf('url') !== -1 ? firstRow.indexOf('url') : 1;
          iconIdx = firstRow.indexOf('icon') !== -1 ? firstRow.indexOf('icon') : 2;
          colorIdx = firstRow.indexOf('color') !== -1 ? firstRow.indexOf('color') : 3;
        } else {
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
      setLinksError('Failed to load external links. Ensure the "External Links" sheet exists.');
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
    if (!linkName || !linkUrl) return;
    setSavingLink(true);
    try {
      await appendRow('External Links', [linkName, linkUrl, selectedIcon, selectedColor]);
      setShowLinkModal(false);
      setLinkName('');
      setLinkUrl('');
      setSelectedIcon('Globe');
      setSelectedColor(COLOR_OPTIONS[0].value);
      await fetchLinks();
    } catch (err) {
      console.error(err);
      alert('Failed to save the link. Ensure the sheet exists and has headers: Name, URL, Icon, Color.');
    } finally {
      setSavingLink(false);
    }
  };

  const handleDeleteLink = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await deleteRow('External Links', rowIndex);
      await fetchLinks();
    } catch (err) {
      console.error(err);
      alert('Failed to delete the link.');
    }
  };

  // --- Announcements Methods ---
  const fetchStaffList = async () => {
    try {
      const rows = await getRows(SHEETS_CONFIG.staffSheetName);
      if (rows && rows.length > 1) {
        // Find "Name" column from header row; fallback to col index 1 (same as StaffManagement)
        const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : 1;
        const staff = rows.slice(1).map(r => (r[nameIdx] || '').trim()).filter(Boolean);
        setStaffList(staff);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    setAnnouncementsError(null);
    try {
      const rows = await getRows(SHEETS_CONFIG.announcementsSheetName);
      if (rows && rows.length > 1) {
        const parsed = [];
        // Assuming headers: Title, Subtitle, Points, Target Staff, Date, Status
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0 || !r[0]) continue;
          parsed.push({
            rowIndex: i + 1,
            title: r[0] || '',
            subtitle: r[1] || '',
            points: r[2] || '',
            targetStaff: r[3] || 'All',
            date: r[4] || '',
            status: r[5] || 'Active'
          });
        }
        setAnnouncements(parsed);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error(err);
      setAnnouncementsError(`Failed to load announcements. Ensure sheet "${SHEETS_CONFIG.announcementsSheetName}" exists with headers: Title, Subtitle, Points, Target Staff, Date, Status.`);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle) return;
    if (!isTargetAll && selectedStaff.length === 0) {
      alert('Please select at least one staff member, or choose "All Staff".');
      return;
    }
    setSavingAnnouncement(true);
    try {
      const targetValue = isTargetAll ? 'All' : selectedStaff.join(', ');
      const date = new Date().toISOString();
      await appendRow(SHEETS_CONFIG.announcementsSheetName, [
        annTitle,
        annSubtitle,
        annPoints,
        targetValue,
        date,
        'Active'
      ]);
      setShowAnnouncementModal(false);
      setAnnTitle('');
      setAnnSubtitle('');
      setAnnPoints('');
      setIsTargetAll(true);
      setSelectedStaff([]);
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Failed to save announcement. Please check sheet structure.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteRow(SHEETS_CONFIG.announcementsSheetName, rowIndex);
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Failed to delete announcement.');
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
      
      {/* Header & Tabs */}
      <div style={{ marginBottom: '28px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(16,185,129,0.3)'
          }}>
            <Rocket size={24} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>Quick Hub</h2>
            <p style={{ color: '#64748B', fontSize: '13.5px', marginTop: '4px', margin: '4px 0 0' }}>
              Manage external tools &amp; broadcast announcements to staff.
            </p>
          </div>
        </div>

        {/* Modern Pill Tab Bar */}
        {isAdminOrAccountant && (
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F1F5F9',
            borderRadius: '14px',
            padding: '5px',
            gap: '4px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
          }}>
            {[
              { id: 'links', label: 'Quick Links', emoji: '🔗' },
              { id: 'announcements', label: 'Announcements', emoji: '📢' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : '#64748B',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? '0 4px 12px rgba(16,185,129,0.35)' : 'none',
                    letterSpacing: isActive ? '-0.1px' : '0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{tab.emoji}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* --- LINKS TAB --- */}
      {activeTab === 'links' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowLinkModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Add Tool
            </button>
          </div>

          {linksError && (
            <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', marginBottom: '24px' }}>
              {linksError}
            </div>
          )}

          {loadingLinks ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <Loader2 size={32} className="spin" color="#10B981" />
            </div>
          ) : links.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <ExternalLink size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#475569' }}>No External Tools Found</h3>
              <p style={{ color: '#94A3B8', marginTop: '8px', marginBottom: '24px' }}>Create your first external tool to show on the dashboard.</p>
              <button className="btn btn-primary" onClick={() => setShowLinkModal(true)}>Add Tool</button>
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
                          onClick={() => handleDeleteLink(link.rowIndex)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px' }}
                          title="Delete Tool"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- ANNOUNCEMENTS TAB --- */}
      {activeTab === 'announcements' && isAdminOrAccountant && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowAnnouncementModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
            >
              <Megaphone size={18} /> New Announcement
            </button>
          </div>

          {announcementsError && (
            <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', marginBottom: '24px' }}>
              {announcementsError}
            </div>
          )}

          {loadingAnnouncements ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <Loader2 size={32} className="spin" color="#F59E0B" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Megaphone size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#475569' }}>No Active Announcements</h3>
              <p style={{ color: '#94A3B8', marginTop: '8px', marginBottom: '24px' }}>Broadcast updates or information to staff members.</p>
              <button className="btn btn-primary" onClick={() => setShowAnnouncementModal(true)} style={{ background: '#F59E0B', border: 'none' }}>Create Announcement</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {announcements.map((ann, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0F172A' }}>{ann.title}</h3>
                    {ann.subtitle && <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748B' }}>{ann.subtitle}</p>}
                    {ann.points && (
                      <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-line', marginBottom: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                        {ann.points}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', gap: '16px' }}>
                      <span>Target: <strong>{ann.targetStaff}</strong></span>
                      <span>Date: {new Date(ann.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.rowIndex)}
                    style={{ background: '#FEF2F2', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                    title="Delete Announcement"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- LINK CREATION MODAL --- */}
      {showLinkModal && (
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
              </div>
              <button 
                onClick={() => setShowLinkModal(false)}
                style={{
                  background: 'white', border: '1px solid #E2E8F0', borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveLink} style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>TOOL NAME</label>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', border: '2px solid #E2E8F0', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>VISITING URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', border: '2px solid #E2E8F0', outline: 'none' }}
                />
              </div>

              {/* Icons and Colors omitted for brevity but keeping same structure */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>SELECT ICON</label>
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
                          cursor: 'pointer', color: isSelected ? '#3B82F6' : '#64748B'
                        }}
                      >
                        <IconCmp size={22} strokeWidth={isSelected ? 2.5 : 2} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>BACKGROUND COLOR</label>
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
                        }}
                        title={opt.label}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowLinkModal(false)} className="btn" style={{ background: 'white', border: '1px solid #E2E8F0' }}>Cancel</button>
                <button type="submit" disabled={savingLink} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {savingLink ? <Loader2 size={18} className="spin" /> : 'Save Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ANNOUNCEMENT CREATION MODAL --- */}
      {showAnnouncementModal && (
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
            border: '1px solid rgba(255, 255, 255, 0.8)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              padding: '24px 32px',
              borderBottom: '1px solid #FCD34D',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#92400E', margin: 0 }}>Create Announcement</h2>
              </div>
              <button 
                onClick={() => setShowAnnouncementModal(false)}
                style={{
                  background: 'white', border: '1px solid #FCD34D', borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#92400E'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Scrollable body */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '24px 32px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>TITLE</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                  placeholder="e.g. Important Meeting"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', border: '2px solid #E2E8F0', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>SUBTITLE (Optional)</label>
                <input
                  type="text"
                  value={annSubtitle}
                  onChange={(e) => setAnnSubtitle(e.target.value)}
                  placeholder="e.g. Regarding new policy"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', border: '2px solid #E2E8F0', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>POINTS / CONTENT</label>
                <textarea
                  value={annPoints}
                  onChange={(e) => setAnnPoints(e.target.value)}
                  rows={4}
                  placeholder="Enter details here..."
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', border: '2px solid #E2E8F0', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>TARGET STAFF</label>

                {/* All Staff toggle row */}
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `2px solid ${isTargetAll ? '#10B981' : '#E2E8F0'}`,
                    background: isTargetAll ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : '#F8FAFC',
                    cursor: 'pointer',
                    marginBottom: isTargetAll ? '0' : '10px',
                    transition: 'all 0.18s',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isTargetAll}
                    onChange={(e) => {
                      setIsTargetAll(e.target.checked);
                      if (e.target.checked) setSelectedStaff([]);
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: isTargetAll ? '#065F46' : '#334155' }}>
                    🌐 All Staff
                  </span>
                  {isTargetAll && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '600', color: '#10B981', background: '#A7F3D0', padding: '2px 8px', borderRadius: '20px' }}>
                      Everyone
                    </span>
                  )}
                </label>

                {/* Individual staff checkboxes */}
                {!isTargetAll && (
                  <div style={{
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                    {staffList.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                        No staff found. Loading...
                      </div>
                    ) : (
                      staffList.map((staff, idx) => {
                        const isChecked = selectedStaff.includes(staff);
                        return (
                          <label
                            key={idx}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '11px 14px',
                              cursor: 'pointer',
                              background: isChecked ? '#F0FDF4' : (idx % 2 === 0 ? '#ffffff' : '#F8FAFC'),
                              borderBottom: idx < staffList.length - 1 ? '1px solid #F1F5F9' : 'none',
                              transition: 'background 0.12s',
                              userSelect: 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedStaff(prev =>
                                  isChecked
                                    ? prev.filter(s => s !== staff)
                                    : [...prev, staff]
                                );
                              }}
                              style={{ width: '16px', height: '16px', accentColor: '#10B981', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: isChecked ? '600' : '400' }}>
                              {staff}
                            </span>
                            {isChecked && (
                              <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: '700', color: '#10B981' }}>✓</span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selection summary */}
                {!isTargetAll && selectedStaff.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedStaff.map((s, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', fontWeight: '600', color: '#065F46',
                        background: '#D1FAE5', padding: '3px 10px', borderRadius: '20px'
                      }}>
                        {s}
                        <button
                          type="button"
                          onClick={() => setSelectedStaff(prev => prev.filter(x => x !== s))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', padding: 0, lineHeight: 1, fontSize: '13px' }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              </div>

              {/* Sticky footer — always visible */}
              <div style={{ 
                display: 'flex', justifyContent: 'flex-end', gap: '12px',
                padding: '16px 32px',
                borderTop: '1px solid #E2E8F0',
                background: '#ffffff',
                flexShrink: 0
              }}>
                <button type="button" onClick={() => setShowAnnouncementModal(false)} className="btn" style={{ background: 'white', border: '1px solid #E2E8F0' }}>Cancel</button>
                <button type="submit" disabled={savingAnnouncement} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {savingAnnouncement ? <Loader2 size={18} className="spin" /> : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
