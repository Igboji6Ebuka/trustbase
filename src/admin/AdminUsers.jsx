import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Search, Users, ShieldCheck } from 'lucide-react';
import api, { clearSession } from '../api';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers({ onLogout }) {
  const navigate = useNavigate();
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]       = useState(1);

  const load = async (pg = 1, q = search) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (q) params.q = q;
      const data = await api.adminGetUsers(params);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, search); }, []);

  const handleSearch = () => { setSearch(searchInput); load(1, searchInput); };
  const handleLogout = () => { clearSession(); onLogout?.(); navigate('/admin-login'); };

  const verifBadge = (status) => {
    if (!status) return null;
    const map = { approved: { color: '#388E3C', label: '✅ Verified' }, pending: { color: '#F57C00', label: '⏳ Pending' }, rejected: { color: '#C62828', label: '❌ Rejected' } };
    const s = map[status] || { color: '#8B9099', label: status };
    return <span style={{ fontSize: '11px', fontWeight: '600', color: s.color }}>{s.label}</span>;
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div style={{ backgroundColor: 'white', padding: '20px 32px', borderBottom: '1px solid #EAECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1A1F2E' }}>Registered Users</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8B9099' }}>{total} total users</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#8B9099' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or phone..."
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={handleSearch} style={{ padding: '10px 18px', background: '#E53935', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Search
          </button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#8B9099' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #EAECF0', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading users...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA' }}>
                  {['#', 'Name', 'Phone', 'Reports', 'Trust Points', 'Verification', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8B9099', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#8B9099' }}>{u.id}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A1F2E', fontWeight: '600' }}>{u.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#546E7A' }}>{u.phone}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: u.report_count > 0 ? '#E53935' : '#8B9099', fontWeight: u.report_count > 0 ? '700' : '400' }}>{u.report_count}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#388E3C', fontWeight: '600' }}>⭐ {u.trust_points}</td>
                    <td style={{ padding: '14px 16px' }}>{verifBadge(u.verif_status) || <span style={{ fontSize: '11px', color: '#B0BEC5' }}>—</span>}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#8B9099', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8B9099' }}>No users found.</div>
          )}
        </div>

        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button disabled={page <= 1} onClick={() => load(page - 1)} style={{ padding: '8px 14px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', background: 'white' }}>← Prev</button>
            <span style={{ padding: '8px 14px', fontSize: '13px', color: '#8B9099' }}>Page {page} of {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => load(page + 1)} style={{ padding: '8px 14px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', background: 'white' }}>Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
