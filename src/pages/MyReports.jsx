import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';
import api from '../api';

const STATUS_CONFIG = {
  pending:      { color: '#FF9800', bg: '#FFF8F0', label: 'Pending Review' },
  published:    { color: '#00C853', bg: '#F0FFF4', label: 'Published' },
  rejected:     { color: '#E53935', bg: '#FFF5F5', label: 'Rejected' },
};

export default function MyReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyReports()
      .then(data => setReports(data.reports || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)} days ago`;
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
          <button onClick={() => navigate('/report-scam')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} color="white" />
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>New Report</span>
          </button>
        </div>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>My Reports</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
          {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', marginTop: '-20px', padding: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', minHeight: 'calc(100vh - 160px)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #ECEFF1', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#8896A5' }}>Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#1A2B3C', marginBottom: '8px' }}>No reports yet</p>
            <p style={{ fontSize: '13px', color: '#8896A5', marginBottom: '24px' }}>Help protect your community by reporting scammers.</p>
            <button
              onClick={() => navigate('/report-scam')}
              className="btn-primary"
              style={{ borderRadius: '12px', padding: '14px 28px' }}
            >
              Report a Scam
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((report, idx) => {
              const cfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
              return (
                <div key={report.id} style={{ background: '#F8F9FA', borderRadius: '14px', padding: '16px', border: '1px solid #ECEFF1', animation: `fadeInUp 0.3s ease ${idx * 0.05}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A2B3C', margin: '0 0 2px 0' }}>
                        {report.target_business || report.target_phone || 'Unknown target'}
                      </p>
                      <span style={{ fontSize: '11px', color: '#8896A5' }}>{report.scam_type}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: cfg.bg, color: cfg.color, flexShrink: 0, marginLeft: '8px' }}>
                      {cfg.label}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#546E7A', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                    {report.description.length > 100 ? report.description.slice(0, 100) + '…' : report.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {report.amount_lost > 0 && (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#E53935' }}>₦{report.amount_lost.toLocaleString()}</span>
                      )}
                      {report.anonymous ? <span style={{ fontSize: '11px', color: '#8896A5' }}>🥷 Anonymous</span> : null}
                    </div>
                    <span style={{ fontSize: '11px', color: '#B0BEC5' }}>{getTimeAgo(report.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
