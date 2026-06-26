import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ShieldCheck, AlertTriangle, TrendingUp, ChevronRight, Star, Zap, Users, Shield } from 'lucide-react';
import api from '../api';

export default function Home({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, flagged: 0, verified: 0 });
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [reportsData, notifData] = await Promise.all([
          api.getReports(1, 5),
          api.getNotifications(),
        ]);
        setReports(reportsData.reports || []);
        setStats({
          total:   reportsData.total || 0,
          flagged: Math.round((reportsData.total || 0) * 0.26),
          verified: 0,
        });
        setUnread(notifData.unreadCount || 0);
      } catch (e) {
        console.error('Home load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const displayName = user?.name?.split(' ')[0] || 'there';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ background: '#F5F6FA', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
        padding: '20px 20px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
        <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginBottom: '2px' }}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'} 👋
            </p>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '800' }}>Hi, {displayName}!</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => navigate('/notifications')} style={{
              width: '38px', height: '38px',
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: '50%', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(10px)',
              position: 'relative',
            }}>
              <Bell size={18} color="white" />
              {unread > 0 && (
                <div style={{
                  position: 'absolute', top: '6px', right: '6px',
                  width: '8px', height: '8px',
                  background: '#FFD700', borderRadius: '50%',
                  border: '2px solid #C62828',
                }}/>
              )}
            </button>
            <div onClick={() => navigate('/profile')} style={{
              width: '38px', height: '38px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '14px', color: 'white',
            }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '4px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color={searchFocused ? '#E53935' : '#B0BEC5'} />
            </div>
            <input
              type="text"
              placeholder="Search phone number or business..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1, border: 'none',
                padding: '14px 16px 14px 46px',
                borderRadius: '14px', fontSize: '14px', outline: 'none',
                color: '#1A2B3C', fontFamily: 'Inter, sans-serif', background: 'transparent',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                background: 'linear-gradient(135deg, #E53935, #C62828)',
                border: 'none', borderRadius: '12px', padding: '10px 16px',
                cursor: 'pointer', color: 'white', fontWeight: '700',
                fontSize: '13px', whiteSpace: 'nowrap', margin: '4px',
              }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: 'white', padding: '16px 20px', display: 'flex', borderBottom: '1px solid #ECEFF1' }}>
        {[
          { value: loading ? '…' : `${stats.total}+`, label: 'Reports', color: '#E53935', emoji: '📊' },
          { value: loading ? '…' : `${stats.flagged}+`, label: 'Flagged', color: '#FF9800', emoji: '🚩' },
          { value: '850+', label: 'Verified Biz', color: '#00C853', emoji: '✅' },
        ].map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <div style={{ width: '1px', background: '#ECEFF1', margin: '0 4px' }}/>}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#8896A5', fontWeight: '500', marginTop: '2px' }}>{stat.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '20px 20px 0' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1A2B3C', marginBottom: '12px' }}>Quick Actions</h2>
        <div className="grid-2">
          {[
            { icon: '⚠️', title: 'Report a Scam', desc: 'Flag suspicious activity', bg: '#FFF5F5', border: '#FFE0E0', action: '/report-scam' },
            { icon: '🔍', title: 'Bulk Check', desc: 'Search multiple numbers', bg: '#F0F4FF', border: '#D6E0FF', action: '/search-results' },
            { icon: '✅', title: 'Get Verified', desc: 'Build your trust score', bg: '#F0FFF4', border: '#C6F6D5', action: '/get-verified' },
            { icon: '📋', title: 'My Reports', desc: 'View your submissions', bg: '#FFFAF0', border: '#FEEBC8', action: '/my-reports' },
          ].map(item => (
            <div
              key={item.title}
              onClick={() => navigate(item.action)}
              style={{
                background: item.bg, border: `1.5px solid ${item.border}`,
                borderRadius: '16px', padding: '16px', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A2B3C', marginBottom: '2px' }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: '#8896A5' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1A2B3C' }}>Latest Reports</h2>
          <span onClick={() => navigate('/reports-list')} style={{ fontSize: '13px', color: '#E53935', fontWeight: '600', cursor: 'pointer' }}>
            See all
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#B0BEC5' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid #ECEFF1', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
            Loading reports...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reports.map((report, idx) => (
              <div
                key={report.id}
                onClick={() => navigate('/reports-list')}
                style={{
                  background: 'white', borderRadius: '14px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #ECEFF1', transition: 'all 0.2s ease',
                  animation: `fadeInUp 0.4s ease ${idx * 0.1}s both`,
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AlertTriangle size={20} color="#E53935" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A2B3C', margin: 0, marginBottom: '2px' }}>
                      {report.target_business || report.target_phone || 'Unknown'}
                    </p>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#FFF5F5', color: '#E53935', flexShrink: 0, marginLeft: '8px' }}>
                      {report.scam_type?.split(' ')[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {report.amount_lost > 0 && (
                      <span style={{ fontSize: '12px', color: '#E53935', fontWeight: '600' }}>
                        ₦{report.amount_lost.toLocaleString()}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: '#B0BEC5' }}>{getTimeAgo(report.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Banner */}
      <div style={{ padding: '20px', paddingBottom: '0' }}>
        <div
          onClick={() => navigate('/get-verified')}
          style={{
            background: 'linear-gradient(135deg, #1A2B3C 0%, #0D1B2A 100%)',
            borderRadius: '18px', padding: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(229,57,53,0.15)' }}/>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(229,57,53,0.2)', borderRadius: '20px', padding: '3px 10px', marginBottom: '8px' }}>
              <Zap size={12} color="#E53935" />
              <span style={{ fontSize: '11px', color: '#E53935', fontWeight: '700' }}>NEW</span>
            </div>
            <p style={{ color: 'white', fontWeight: '700', fontSize: '15px', margin: '0 0 4px 0' }}>Get Your Business Verified</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>Build trust and get more customers</p>
          </div>
          <div style={{ background: '#E53935', borderRadius: '12px', padding: '10px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="white" />
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>Verify</span>
          </div>
        </div>
      </div>

      <div style={{ height: '100px' }}/>
    </div>
  );
}
