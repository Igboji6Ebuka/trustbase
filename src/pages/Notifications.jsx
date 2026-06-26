import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowLeft, Info, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import api from '../api';

const TYPE_CONFIG = {
  report:       { icon: FileText,   color: '#E53935', bg: '#FFF5F5' },
  verification: { icon: ShieldCheck, color: '#1976D2', bg: '#E3F2FD' },
  warning:      { icon: AlertTriangle, color: '#FF9800', bg: '#FFF8F0' },
  system:       { icon: Info,       color: '#546E7A', bg: '#F5F6FA' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ background: '#F5F6FA', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', padding: '20px 20px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={20} color="white" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <CheckCheck size={16} color="white" />
              <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>Mark all read</span>
            </button>
          )}
        </div>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Notifications</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', marginTop: '-20px', padding: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', minHeight: 'calc(100vh - 160px)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #ECEFF1', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#8896A5' }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Bell size={48} color="#ECEFF1" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#1A2B3C', marginBottom: '8px' }}>No notifications yet</p>
            <p style={{ fontSize: '13px', color: '#8896A5' }}>We'll notify you about your reports and verification status.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map((notif, idx) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markRead(notif.id)}
                  style={{
                    background: notif.read ? '#F8F9FA' : 'white',
                    borderRadius: '14px', padding: '14px',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    border: notif.read ? '1px solid #F0F0F0' : `1.5px solid ${cfg.color}22`,
                    cursor: notif.read ? 'default' : 'pointer',
                    position: 'relative',
                    animation: `fadeInUp 0.3s ease ${idx * 0.05}s both`,
                    boxShadow: notif.read ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A2B3C', margin: 0 }}>{notif.title}</p>
                      <span style={{ fontSize: '10px', color: '#B0BEC5', flexShrink: 0, marginLeft: '8px' }}>{getTimeAgo(notif.created_at)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#8896A5', margin: 0, lineHeight: '1.5' }}>{notif.body}</p>
                  </div>
                  {!notif.read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: '4px' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
