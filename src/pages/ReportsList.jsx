import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Filter } from 'lucide-react';
import api from '../api';

const SCAM_TYPES = ['All', 'Online Marketplace Scam', 'Fake Product / Non-delivery', 'POS Fraud', 'Investment / Ponzi', 'Romantic Scam', 'Loan / Finance Fraud', 'Job / Recruitment Scam', 'Other'];

export default function ReportsList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const data = await api.getReports(pg, 20);
      setReports(pg === 1 ? (data.reports || []) : prev => [...prev, ...(data.reports || [])]);
      setTotal(data.total || 0);
      setPage(pg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const filtered = filter === 'All' ? reports : reports.filter(r => r.scam_type === filter);

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ background: '#F5F6FA', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', padding: '20px 20px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
        <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '16px' }}>
          <ArrowLeft size={20} color="white" />
        </button>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>Scam Reports</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>{total} reports in the database</p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', marginTop: '-20px', padding: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', minHeight: 'calc(100vh - 160px)' }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
          {SCAM_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none',
                background: filter === type ? '#E53935' : '#F5F6FA',
                color: filter === type ? 'white' : '#546E7A',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #ECEFF1', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#8896A5', fontSize: '14px' }}>Loading reports...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map((report, idx) => (
                <div
                  key={report.id}
                  style={{
                    background: '#F8F9FA', borderRadius: '14px', padding: '14px 16px',
                    border: '1px solid #ECEFF1', animation: `fadeInUp 0.3s ease ${idx * 0.05}s both`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#E53935', background: '#FFF5F5', padding: '2px 8px', borderRadius: '20px' }}>
                      {report.scam_type}
                    </span>
                    <span style={{ fontSize: '11px', color: '#B0BEC5' }}>{getTimeAgo(report.created_at)}</span>
                  </div>

                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A2B3C', margin: '0 0 4px 0' }}>
                    {report.target_business || report.target_phone || 'Unknown'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#546E7A', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                    {report.description.length > 100 ? report.description.slice(0, 100) + '…' : report.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {report.amount_lost > 0 && (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#E53935' }}>₦{report.amount_lost.toLocaleString()}</span>
                      )}
                      {report.reporter_name && (
                        <span style={{ fontSize: '11px', color: '#8896A5' }}>by {report.reporter_name}</span>
                      )}
                    </div>
                    <AlertTriangle size={16} color="#E53935" />
                  </div>
                </div>
              ))}
            </div>

            {filtered.length < total && (
              <button
                onClick={() => load(page + 1)}
                disabled={loading}
                style={{
                  width: '100%', marginTop: '16px', padding: '14px',
                  background: '#F5F6FA', border: '1.5px solid #ECEFF1', borderRadius: '12px',
                  fontSize: '13px', fontWeight: '600', color: '#546E7A', cursor: 'pointer',
                }}
              >
                {loading ? 'Loading...' : 'Load more reports'}
              </button>
            )}

            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8896A5' }}>
                <p>No reports found for this category.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
