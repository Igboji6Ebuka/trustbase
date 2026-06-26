import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FileText, ShieldCheck, Users, Flag, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api, { clearSession } from '../api';
import { useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
  const map = {
    pending:      { color: '#F57C00', bg: '#FFF3E0', label: 'Pending' },
    published:    { color: '#388E3C', bg: '#E8F5E9', label: 'Published' },
    rejected:     { color: '#C62828', bg: '#FFEBEE', label: 'Rejected' },
    under_review: { color: '#1976D2', bg: '#E3F2FD', label: 'Under Review' },
    docs_received:{ color: '#7B1FA2', bg: '#F3E5F5', label: 'Docs Received' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
};

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [reports, setReports] = useState([]);
  const [verifs, setVerifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, v] = await Promise.all([
          api.adminStats(),
          api.adminGetReports({ limit: 5 }),
          api.adminGetVerifications({ status: 'pending' }),
        ]);
        setStats(s);
        setReports(r.reports || []);
        setVerifs((v.verifications || []).slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleVerifAction = async (id, status) => {
    try {
      await api.adminUpdateVerification(id, status);
      setVerifs(prev => prev.filter(v => v.id !== id));
      if (stats) setStats(prev => ({ ...prev, pendingVerifs: Math.max(0, prev.pendingVerifs - 1) }));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLogout = () => {
    clearSession();
    onLogout?.();
    navigate('/admin-login');
  };

  const statCards = stats ? [
    { label: 'Total Reports',         value: stats.totalReports.toLocaleString(),   change: `+${stats.newReportsToday} today`, icon: FileText,    color: '#E53935', bg: '#FFF3F3' },
    { label: 'Pending Verifications', value: stats.pendingVerifs.toString(),         change: 'Needs action',                   icon: ShieldCheck,  color: '#1976D2', bg: '#E3F2FD' },
    { label: 'Registered Users',      value: stats.totalUsers.toLocaleString(),      change: `+${stats.newUsersToday} today`,  icon: Users,        color: '#388E3C', bg: '#E8F5E9' },
    { label: 'Flagged Numbers',       value: stats.flaggedNumbers.toLocaleString(),  change: 'Published reports',              icon: Flag,         color: '#F57C00', bg: '#FFF3E0' },
  ] : [];

  return (
    <AdminLayout onLogout={handleLogout}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', padding: '20px 32px', borderBottom: '1px solid #EAECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1A1F2E' }}>Dashboard Overview</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8B9099' }}>{new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#E53935', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>A</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1F2E' }}>Admin</div>
            <div style={{ fontSize: '11px', color: '#8B9099' }}>admin@trustbase.ng</div>
          </div>
          <button onClick={handleLogout} style={{ fontSize: '12px', color: '#E53935', background: 'none', border: '1px solid #E53935', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '32px', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8B9099' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #EAECF0', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            Loading dashboard data...
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              {statCards.map(({ label, value, change, icon: Icon, color, bg }) => (
                <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#8B9099', fontWeight: '500' }}>{label}</p>
                      <h2 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 'bold', color: '#1A1F2E' }}>{value}</h2>
                      <p style={{ margin: 0, fontSize: '12px', color: '#388E3C', fontWeight: '500' }}>{change}</p>
                    </div>
                    <div style={{ backgroundColor: bg, width: '44px', height: '44px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Icon size={22} color={color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Two columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
              {/* Recent Reports Table */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1A1F2E' }}>Recent Reports</h3>
                  <a href="/admin/reports" style={{ fontSize: '13px', color: '#E53935', textDecoration: 'none', fontWeight: '500' }}>View All</a>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAFAFA' }}>
                      {['ID', 'Target', 'Category', 'Amount', 'Status', 'Time'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8B9099', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} style={{ borderTop: '1px solid #F5F5F5', cursor: 'pointer' }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#E53935', fontWeight: '600' }}>#{r.id}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A1F2E', fontWeight: '500' }}>{r.target_business || r.target_phone || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#555' }}>{r.scam_type}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A1F2E', fontWeight: '600' }}>{r.amount_lost > 0 ? `₦${r.amount_lost.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '14px 16px' }}>{statusBadge(r.status)}</td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#8B9099' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pending Verifications */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1A1F2E' }}>Pending Verifications</h3>
                  <span style={{ backgroundColor: '#FFF3F3', color: '#E53935', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px' }}>
                    {stats?.pendingVerifs || 0}
                  </span>
                </div>
                <div style={{ padding: '12px' }}>
                  {verifs.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#8B9099', padding: '20px', fontSize: '13px' }}>No pending verifications 🎉</p>
                  ) : verifs.map((v, i) => (
                    <div key={v.id} style={{ padding: '14px', borderRadius: '10px', backgroundColor: i % 2 === 0 ? '#FAFAFA' : 'white', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1A1F2E' }}>{v.entity_name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8B9099' }}>{v.entity_type} · {v.applicant_name}</p>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#388E3C' }}>{v.entity_type === 'business' ? '₦5,000' : '₦2,000'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleVerifAction(v.id, 'approved')} style={{ flex: 1, backgroundColor: '#E8F5E9', color: '#388E3C', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button onClick={() => handleVerifAction(v.id, 'rejected')} style={{ flex: 1, backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
