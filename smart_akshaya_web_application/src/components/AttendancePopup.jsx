import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Loader2, X, Calendar, User } from 'lucide-react';
import { checkTodayAttendance, markAttendanceIn } from '../services/attendanceService';

export default function AttendancePopup({ userSession }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userSession || userSession.role === 'admin') {
      setIsLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const existing = await checkTodayAttendance(userSession.name);
        if (!existing) {
          setIsVisible(true);
        }
      } catch (err) {
        console.error("Attendance check failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userSession]);

  const handleMarkAttendance = async () => {
    setIsMarking(true);
    try {
      await markAttendanceIn();
      setSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 2500);
    } catch (err) {
      console.error("Failed to mark attendance", err);
      alert("Failed to mark attendance. Please check network connection.");
    } finally {
      setIsMarking(false);
    }
  };

  if (isLoading || !isVisible) return null;

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1E293B, #0F172A)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        position: 'relative',
        color: '#ffffff',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: '#10B981', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: '#3B82F6', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }} />

        {/* Close button removed to enforce attendance marking */}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header Icon */}
          <div style={{
            width: '80px', height: '80px',
            borderRadius: '50%',
            background: success ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))',
            border: `1px solid ${success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: success ? '0 0 20px rgba(16, 185, 129, 0.2)' : '0 0 20px rgba(59, 130, 246, 0.2)'
          }}>
            {success ? (
              <CheckCircle2 size={40} color="#10B981" />
            ) : (
              <Clock size={40} color="#3B82F6" />
            )}
          </div>

          <h2 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            {success ? 'Checked In!' : 'Good Morning'}
          </h2>
          
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            margin: '0 0 24px 0', padding: '8px 16px', background: 'rgba(255,255,255,0.03)', 
            borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <User size={14} color="#94A3B8" />
            <span style={{ fontSize: '15px', color: '#E2E8F0', fontWeight: '500' }}>{userSession.name}</span>
          </div>

          {/* Time & Date Display */}
          {!success && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '-1px', color: '#F8FAFC', lineHeight: '1', marginBottom: '12px' }}>
                {timeString}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94A3B8', fontSize: '14px', fontWeight: '500' }}>
                <Calendar size={16} />
                {dateString}
              </div>
            </div>
          )}

          {success && (
            <p style={{ margin: '0 0 32px 0', fontSize: '16px', color: '#94A3B8', lineHeight: '1.6' }}>
              Your attendance has been recorded for today.<br/>Have a great shift!
            </p>
          )}

          {!success && (
            <button
              onClick={handleMarkAttendance}
              disabled={isMarking}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isMarking ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: isMarking ? 0.9 : 1,
                boxShadow: '0 10px 20px -10px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
                transform: isMarking ? 'scale(0.98)' : 'scale(1)'
              }}
              onMouseEnter={e => { if(!isMarking) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { if(!isMarking) e.currentTarget.style.transform = 'translateY(0)'; }}
              onMouseDown={e => { if(!isMarking) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { if(!isMarking) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            >
              {isMarking ? (
                <>
                  <Loader2 size={20} className="spin-animation" />
                  Recording Attendance...
                </>
              ) : (
                'Mark Attendance (In)'
              )}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
