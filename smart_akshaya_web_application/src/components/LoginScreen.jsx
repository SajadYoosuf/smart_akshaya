import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authenticateLogin } from '../services/googleSheetsAuth';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #42A5F5 100%)', // Blue Akshaya Theme
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className="glass-panel glow-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '20px',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px'
      }}>
        {/* Logo */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}>
          <img src="/akshaya_logo.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#1E293B',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          Welcome Back
        </h1>
        <p style={{
          color: '#64748B',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Sign in to Smart Akshaya Management
        </p>

        {errorMessage && (
          <div style={{
            width: '100%',
            backgroundColor: '#FEF2F2',
            border: '1px solid #EF4444',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#EF4444',
            marginBottom: '24px',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ width: '100%' }}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#1E293B', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  color: '#1E293B',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ color: '#1E293B', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 42px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  color: '#1E293B',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(79, 70, 229, 0.3)',
              transition: 'transform 0.2s, opacity 0.2s',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
