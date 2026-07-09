import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Megaphone, CheckCheck, ChevronRight } from 'lucide-react';
import { getRows } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getReadIds(userKey) {
  try {
    return JSON.parse(localStorage.getItem(`notif_read_${userKey}`) || '[]');
  } catch {
    return [];
  }
}
function saveReadIds(userKey, ids) {
  localStorage.setItem(`notif_read_${userKey}`, JSON.stringify(ids));
}
function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── NotificationBell (top-right icon + dropdown) ─────────────────────────────
export function NotificationBell({ userSession }) {
  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds]             = useState([]);
  const [open, setOpen]                   = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const ref                               = useRef(null);
  const userKey                           = userSession?.name || 'guest';

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setReadIds(getReadIds(userKey));
    fetchAnnouncements();
    const iv = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [userKey]);

  const fetchAnnouncements = async () => {
    try {
      const rows = await getRows(SHEETS_CONFIG.announcementsSheetName);
      if (!rows || rows.length <= 1) return;
      const staffName = (userSession?.name || '').trim();
      const result = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0]) continue;
        const status = (r[5] || 'Active').toLowerCase();
        if (status !== 'active') continue;
        const target = r[3] || 'All';
        const isAll  = target.toLowerCase() === 'all' || target.toLowerCase() === 'all staff';
        // support comma-separated list
        const targets = target.split(',').map(s => s.trim());
        const isForMe = isAll || targets.includes(staffName);
        if (!isForMe) continue;
        result.push({ id: `ann-${i}`, title: r[0] || '', subtitle: r[1] || '', points: r[2] || '', date: r[4] || '' });
      }
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAnnouncements(result);
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
  };

  const unreadCount = announcements.filter(a => !readIds.includes(a.id)).length;

  const markAllRead = () => {
    const allIds = announcements.map(a => a.id);
    setReadIds(allIds);
    saveReadIds(userKey, allIds);
  };

  const markOneRead = (id) => {
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    setReadIds(next);
    saveReadIds(userKey, next);
  };

  if (announcements.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Sleek Modern Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); }}
        title="Notifications"
        style={{
          position: 'relative',
          width: '42px', height: '42px',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          background: open ? '#F1F5F9' : '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
          e.currentTarget.style.borderColor = '#CBD5E1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
        }}
      >
        <Bell size={19} color={open ? '#0F172A' : '#64748B'} strokeWidth={2} />
        {/* Pulsing Red Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            minWidth: '18px', height: '18px',
            background: 'linear-gradient(135deg, #EF4444 0%, #E11D48 100%)',
            borderRadius: '999px',
            fontSize: '10px', fontWeight: '800', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
            padding: '0 3px',
            boxShadow: '0 3px 8px rgba(239, 68, 68, 0.45)',
            animation: 'notif-pulse 2s infinite',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Modern Popover Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          width: '360px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: '0 20px 48px -10px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'notif-slide-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Light Theme Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.2px' }}>
                Notifications
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: '500' }}>
                {unreadCount > 0 ? `${unreadCount} unread message(s)` : 'No new messages'}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none',
                  fontSize: '12px', fontWeight: '600', color: '#10B981',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 8px', borderRadius: '6px', transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <CheckCheck size={14} /> Clear All
              </button>
            )}
          </div>

          {/* Messages List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {(() => {
              const unreadList = announcements.filter(a => !readIds.includes(a.id));
              if (unreadList.length === 0) {
                return (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: '#ECFDF5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#10B981',
                      fontSize: '20px'
                    }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                        All Caught Up!
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        No new notifications to show right now.
                      </div>
                    </div>
                  </div>
                );
              }

              return unreadList.map((ann, idx, filteredArr) => {
                const isUnread = true; // since we filtered out read ones
                return (
                  <div
                    key={ann.id}
                    onClick={() => {
                      markOneRead(ann.id);
                      setSelectedNotif(ann);
                      setOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      padding: '16px 20px',
                      borderBottom: idx < filteredArr.length - 1 ? '1px solid #F8FAFC' : 'none',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(255, 255, 255, 0.8) 100%)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.03)';
                    }}
                  >
                    {/* Glowing Indicator Dot for Unread */}
                    {isUnread && (
                      <span style={{
                        position: 'absolute', left: '8px', top: '22px',
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: '#10B981',
                        boxShadow: '0 0 8px #10B981'
                      }} />
                    )}

                    {/* Icon Circle */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: '#D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}>
                      <Megaphone size={16} color="#059669" />
                    </div>

                    {/* Announcement details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
                      }}>
                        <span style={{
                          fontSize: '13.5px', 
                          fontWeight: '700',
                          color: '#0F172A',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {ann.title}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {timeAgo(ann.date)}
                        </span>
                      </div>

                      {ann.subtitle && (
                        <div style={{
                          fontSize: '12px', color: '#475569', marginTop: '2px', fontWeight: '500',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {ann.subtitle}
                        </div>
                      )}

                      {ann.points && (
                        <div style={{
                          fontSize: '11.5px', color: '#64748B', marginTop: '4px',
                          background: '#F8FAFC', padding: '6px 10px', borderRadius: '8px',
                          lineHeight: '1.4', whiteSpace: 'pre-line'
                        }}>
                          {ann.points}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Total Footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #F1F5F9',
            background: '#F8FAFC',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>
              {announcements.length} announcement(s)
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Smart Akshaya Hub
            </span>
          </div>
        </div>
      )}

      {/* Detail Popup Modal (Pending Bills Style) */}
      {selectedNotif && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '85vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'notif-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 32px',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              borderBottom: '1px solid #A7F3D0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '48px', height: '48px', 
                  borderRadius: '16px', 
                  background: '#10B981', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <Megaphone size={24} color="#ffffff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#065F46', letterSpacing: '-0.3px' }}>
                    New Announcement
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#057A55', fontWeight: '500' }}>
                    Received {timeAgo(selectedNotif.date)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                style={{
                  background: 'rgba(167, 243, 208, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#046A38',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(167, 243, 208, 0.8)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(167, 243, 208, 0.5)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>
                {selectedNotif.title}
              </h3>
              {selectedNotif.subtitle && (
                <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', fontWeight: '600' }}>
                  {selectedNotif.subtitle}
                </p>
              )}
              
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '14.5px',
                color: '#334155',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedNotif.points || "No details provided."}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 32px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setSelectedNotif(null)}
                className="btn"
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#10B981',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Okay, I understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes notif-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ── Scrolling ticker strip (below TopBar) ────────────────────────────────────
export default function NotificationBanner({ userSession }) {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [isVisible, setIsVisible]         = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    const iv = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const rot = setInterval(() => setCurrentIndex(p => (p + 1) % announcements.length), 10000);
      return () => clearInterval(rot);
    }
  }, [announcements.length]);

  const fetchAnnouncements = async () => {
    try {
      const rows = await getRows(SHEETS_CONFIG.announcementsSheetName);
      if (!rows || rows.length <= 1) return;
      const staffName = (userSession?.name || '').trim();
      const result = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0]) continue;
        if ((r[5] || 'Active').toLowerCase() !== 'active') continue;
        const target  = r[3] || 'All';
        const isAll   = target.toLowerCase() === 'all' || target.toLowerCase() === 'all staff';
        const targets = target.split(',').map(s => s.trim());
        if (isAll || targets.includes(staffName)) {
          result.push({ title: r[0] || '', subtitle: r[1] || '', points: r[2] || '', date: r[4] || '' });
        }
      }
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAnnouncements(result);
    } catch (err) {
      console.error('Banner fetch error:', err);
    }
  };

  if (!isVisible || announcements.length === 0) return null;
  const cur = announcements[currentIndex];

  return (
    <div style={{
      background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
      color: 'white', padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: 40, position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <Megaphone size={16} style={{ flexShrink: 0 }} />
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: '700' }}>{cur.title}</span>
          {cur.subtitle && <span style={{ opacity: 0.9 }}>— {cur.subtitle}</span>}
          {cur.points && <span style={{ opacity: 0.8, fontSize: '13px', marginLeft: '8px' }}>({cur.points.split('\n')[0]})</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {announcements.length > 1 && (
          <div style={{ fontSize: '12px', opacity: 0.8 }}>{currentIndex + 1} / {announcements.length}</div>
        )}
        <button
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '4px', opacity: 0.8 }}
          title="Dismiss"
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
