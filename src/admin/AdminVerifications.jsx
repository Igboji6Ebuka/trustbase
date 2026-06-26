import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import api, { clearSession } from '../api';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['', 'pending', 'under_review', 'docs_received', 'approved', 'rejected'];
const STATUS_LABELS  = { '': 'All', pending: 'Pending', under_review: 'Under Review', docs_received: 'Docs Received', approved: 'Approved', rejected: 'Rejected' };

const statusBadge = (status) => {
  const map = {
    pending:       { color: '#F57C00', bg: '#FFF3E0', label: 'Pending' },
    under_review:  { color: '#1976D2', bg: '#E3F2FD', label: 'Under Review' },
    docs_received: { color: '#7B1FA2', bg: '#F3E5F5', label: 'Docs Received' },
    approved:      { color: '#388E3C', bg: '#E8F5E9', label: 'Approved' },
    rejected:      { color: '#C62828', bg: '#FFEBEE', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: s.color, backgroundColor: s.bg }}>{s.label}</span>;
};

export default function AdminVerifications({ onLogout }) {
  const navigate = useNavigate();
  const [verifs, setVerifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const [updating, setUpdating] = useState(null);

  const load = async (st = filter) => {
    setLoading(true);
    try {
      const params = {};
      if (st) params.status = st;
      const data = await api.adminGetVerifications(params);
      setVerifs(data.verifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleAction = async (id, status) => {
    setUpdating(id);
    try {
      await api.adminUpdateVerification(id, status);
      setVerifs(prev => prev.map(v => v.id === id ? { ...v, status } : v));
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
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1A1F2E' }}>Verification Applications</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8B9099' }}>{verifs.length} applications</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                border: 'none', cursor: 'pointer',
                background: filter === s ? '#E53935' : '#F0F0F0',
                color: filter === s ? 'white' : '#546E7A',
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8B9099' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #EAECF0', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading verifications...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {verifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', color: '#8B9099' }}>No verifications found.</div>
            ) : verifs.map(v => (
              <div key={v.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1A1F2E' }}>{v.entity_name}</p>
                    {statusBadge(v.status)}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#8B9099' }}>👤 {v.applicant_name} · {v.applicant_phone}</span>
                    <span style={{ fontSize: '12px', color: '#8B9099' }}>🏷️ {v.entity_type} · {v.id_type}: {v.id_number}</span>
                    <span style={{ fontSize: '12px', color: '#8B9099' }}>📅 {new Date(v.submitted_at).toLocaleDateString()}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#388E3C' }}>Fee: {v.entity_type === 'business' ? '₦5,000' : '₦2,000'}</span>
                  </div>
                </div>

                {v.status !== 'approved' && v.status !== 'rejected' && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <select
                      onChange={e => e.target.value && handleAction(v.id, e.target.value)}
                      defaultValue=""
                      disabled={updating === v.id}
                      style={{ padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      <option value="">Update status…</option>
                      <option value="under_review">Under Review</option>
                      <option value="docs_received">Docs Received</option>
                      <option value="approved">Approve ✅</option>
                      <option value="rejected">Reject ❌</option>
                    </select>
                  </div>
                )}

                {(v.status === 'approved' || v.status === 'rejected') && (
                  <div style={{ flexShrink: 0 }}>
                    {v.status === 'approved' ? <CheckCircle2 size={24} color="#388E3C" /> : <XCircle size={24} color="#C62828" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
