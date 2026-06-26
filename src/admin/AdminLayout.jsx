import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ShieldCheck, Users,
  Flag, Settings, LogOut, ChevronRight
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Reports', icon: FileText, path: '/admin/reports' },
  { label: 'Verifications', icon: ShieldCheck, path: '/admin/verifications' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Flagged Numbers', icon: Flag, path: '/admin/flagged' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Inter, sans-serif', backgroundColor: '#F4F6FA' }}>
      {/* Sidebar */}
      <div style={{
        width: '240px', flexShrink: 0,
        backgroundColor: '#1A1F2E',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#E53935', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ShieldCheck size={18} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>TrustBase</div>
              <div style={{ color: '#8B9099', fontSize: '11px' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'white' : '#8B9099',
                backgroundColor: isActive ? '#E53935' : 'transparent',
                fontWeight: isActive ? '600' : '400',
                fontSize: '14px',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'none', border: 'none', color: '#8B9099',
              fontSize: '14px', cursor: 'pointer', width: '100%', padding: '8px 12px', borderRadius: '8px'
            }}
          >
            <LogOut size={18} />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
