import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api, { saveSession } from '../api';

export default function AdminLogin({ onAdminLogin }) {
  const navigate = useNavigate();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(phone, password);
      if (!data.user.is_admin) {
        setError('This account does not have admin access.');
        return;
      }
      saveSession(data.token, data.user);
      onAdminLogin(data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: 'linear-gradient(135deg, #1A1F2E 0%, #2D3346 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', padding: '40px',
        width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            backgroundColor: '#E53935', width: '56px', height: '56px',
            borderRadius: '14px', display: 'inline-flex',
            justifyContent: 'center', alignItems: 'center', marginBottom: '16px'
          }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#1A1F2E' }}>TrustBase Admin</h1>
          <p style={{ margin: '8px 0 0', color: '#8B9099', fontSize: '14px' }}>Sign in to the control panel</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Admin Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="08000000000"
              required
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #E0E0E0', borderRadius: '8px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%', padding: '12px 40px 12px 14px',
                  border: '1.5px solid #E0E0E0', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#C62828' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              backgroundColor: '#E53935', color: 'white', border: 'none',
              padding: '14px', borderRadius: '8px', fontSize: '15px',
              fontWeight: '600', cursor: 'pointer', marginTop: '4px',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#BBB' }}>
          Demo: 08000000000 / admin123
        </p>
      </div>
    </div>
  );
}
