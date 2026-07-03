import React, { useState } from 'react';
import { Settings, Lock, Mail, Eye, EyeOff, Loader2, Database } from 'lucide-react';
import { authenticateLogin } from '../services/googleSheetsAuth';
import { getSpreadsheetId, setSpreadsheetId } from '../config/sheetsConfig';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sheet config state
  const [showConfig, setShowConfig] = useState(false);
  const [sheetIdInput, setSheetIdInput] = useState(getSpreadsheetId());
  const [configSuccess, setConfigSuccess] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await authenticateLogin(email, password);
      if (result.success) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (sheetIdInput.trim()) {
      setSpreadsheetId(sheetIdInput.trim());
      setConfigSuccess(true);
      setTimeout(() => {
        setConfigSuccess(false);
        setShowConfig(false);
      }, 1200);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #42A5F5 100%)',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Background Decorative Circles / Blobs to match CustomPainter */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.05)',
          top: '-100px',
          left: '-100px',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          bottom: '-150px',
          right: '-150px',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
          bottom: '10%',
          left: '5%',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />

      {/* Top right gear for database settings */}


      {/* Main Content Area */}
      {!showConfig ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', zIndex: 2 }}>

          {/* Actual Akshaya Logo */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
              marginBottom: '20px',
              animation: 'fadeIn 0.5s ease-out',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src="/akshaya_logo.png"
              alt="Akshaya Logo"
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
          </div>

          {/* Title */}
          <h1
            style={{
              color: '#ffffff',
              fontSize: '26px',
              fontWeight: '800',
              letterSpacing: '-0.5px',
              textShadow: '0 4px 10px rgba(0,0,0,0.26)',
              marginBottom: '8px',
              animation: 'fadeIn 0.5s ease-out',
              textAlign: 'center',
              padding: '0 20px',
            }}
          >
            Welcome to Akshaya Pookiparamb
          </h1>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '15px',
              fontWeight: '500',
              textAlign: 'center',
              marginBottom: '28px',
              animation: 'fadeIn 0.5s ease-out',
              padding: '0 20px',
            }}
          >
            Please enter your details to access the management software
          </p>

          {/* Login Card */}
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '40px 32px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              borderRadius: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              animation: 'fadeIn 0.6s ease-out',
              color: '#000000'
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A237E', marginBottom: '24px' }}>
              Sign In
            </h2>

            {errorMessage && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#dc2626',
                  marginBottom: '20px',
                  lineHeight: 1.4,
                  fontWeight: '500'
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              {/* Email Field */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label
                  className="form-label"
                  style={{ color: '#1A237E', fontWeight: '700', fontSize: '14px', marginBottom: '10px', display: 'block' }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      paddingLeft: '48px',
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      height: '48px',
                      borderRadius: '16px',
                      color: '#0f172a'
                    }}
                    required
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#1A237E' }} />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  className="form-label"
                  style={{ color: '#1A237E', fontWeight: '700', fontSize: '14px', marginBottom: '10px', display: 'block' }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      paddingLeft: '48px',
                      paddingRight: '44px',
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      height: '48px',
                      borderRadius: '16px',
                      color: '#0f172a'
                    }}
                    required
                  />
                  {/* Eye Toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#1A237E' }} />
                </div>
              </div>

              {/* Remember Me Checkbox */}


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#1A237E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A237E'}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>


          </div>
        </div>
      ) : (
        /* Configuration Panel */

        <div></div>


      )
      }
    </div >
  );
}
