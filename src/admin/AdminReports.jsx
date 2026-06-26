import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Search, CheckCircle2, XCircle, Eye, Filter } from 'lucide-react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../api';

const STATUS_OPTIONS = ['', 'pending', 'published', 'rejected'];
const STATUS_LABELS  = { '': 'All', pending: 'Pending', published: 'Published', rejected: 'Rejected' };

const statusBadge = (status) => {
  const map = {
    pending:   { color: '#F57C00', bg: '#FFF3E0', label: 'Pending' },
    published: { color: '#388E3C', bg: '#E8F5E9', label: 'Published' },
    rejected:  { color: '#C62828', bg: '#FFEBEE', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: s.color, backgroundColor: s.bg }}>{s.label}</span>;
};

export default function AdminReports({ onLogout }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(null);

  const load = async (pg = 1, st = statusFilter, q = search) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (st) params.status = st;
      if (q)  params.q = q;
      const data = await api.adminGetReports(params);
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, statusFilter, search); }, [statusFilter]);

  const handleSearch = () => { setSearch(searchInput); load(1, statusFilter, searchInput); };

  const handleUpdateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.adminUpdateReport(id, status);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => { clearSession(); onLogout?.(); navigate('/admin-login'); };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div style={{ backgroundColor: 'white', padding: '20px 32px', borderBottom: '1px solid #EAECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1A1F2E' }}>Scam Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8B9099' }}>{total} total reports</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#8B9099' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search phone or business..."
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button onClick={handleSearch} style={{ padding: '10px 18px', background: '#E53935', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Search
          </button>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#8B9099' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #EAECF0', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading reports...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA' }}>
                  {['#', 'Target', 'Scam Type', 'Amount', 'Reporter', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8B9099', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#E53935', fontWeight: '600' }}>#{r.id}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A1F2E', fontWeight: '500', maxWidth: '160px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.target_business || r.target_phone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#555', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.scam_type}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: r.amount_lost > 0 ? '#E53935' : '#8B9099', fontWeight: '600' }}>{r.amount_lost > 0 ? `₦${r.amount_lost.toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#8B9099' }}>{r.reporter_name || 'Anon'}</td>
                    <td style={{ padding: '14px 16px' }}>{statusBadge(r.status)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#8B9099', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {r.status !== 'published' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'published')}
                            disabled={updating === r.id}
                            style={{ backgroundColor: '#E8F5E9', color: '#388E3C', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <CheckCircle2 size={12} /> Publish
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'rejected')}
                            disabled={updating === r.id}
                            style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && reports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8B9099' }}>No reports found.</div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button disabled={page <= 1} onClick={() => load(page - 1)} style={{ padding: '8px 14px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', background: 'white', color: page <= 1 ? '#ccc' : '#1A1F2E' }}>← Prev</button>
            <span style={{ padding: '8px 14px', fontSize: '13px', color: '#8B9099' }}>Page {page} of {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => load(page + 1)} style={{ padding: '8px 14px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', background: 'white', color: page >= Math.ceil(total / 20) ? '#ccc' : '#1A1F2E' }}>Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
