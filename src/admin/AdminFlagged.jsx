import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { AlertTriangle } from 'lucide-react';
import api, { clearSession } from '../api';
import { useNavigate } from 'react-router-dom';

export default function AdminFlagged({ onLogout }) {
  const navigate = useNavigate();
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetFlagged()
      .then(data => setFlagged(data.flagged || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { clearSession(); onLogout?.(); navigate('/admin-login'); };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div style={{ backgroundColor: 'white', padding: '20px 32px', borderBottom: '1px solid #EAECF0' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1A1F2E' }}>Flagged Numbers & Businesses</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8B9099' }}>Entities with 2 or more published scam reports</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8B9099' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #EAECF0', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading flagged entities...
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {flagged.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8B9099' }}>No flagged entities found. 🎉</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    {['Entity', 'Reports', 'Total Lost', 'Last Reported'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8B9099', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((f, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #F5F5F5' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={18} color="#E53935" />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1A1F2E' }}>{f.business || f.phone || '—'}</p>
                            {f.phone && f.business && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8B9099' }}>{f.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: '#FFF5F5', color: '#E53935' }}>
                          {f.report_count} reports
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#E53935' }}>
                        {f.total_lost > 0 ? `₦${parseInt(f.total_lost).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#8B9099' }}>
                        {new Date(f.last_reported).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
