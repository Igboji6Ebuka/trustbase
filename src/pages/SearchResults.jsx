import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ShieldCheck, Search, CheckCircle2, XCircle, Info } from 'lucide-react';
import api from '../api';

export default function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, []);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.search(q.trim());
      setResults(data);
      setQuery(q.trim());
    } catch (e) {
      setError(e.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => doSearch(searchInput);
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const riskConfig = {
    high:    { color: '#E53935', bg: '#FFF5F5', label: 'HIGH RISK', icon: XCircle },
    medium:  { color: '#FF9800', bg: '#FFF8F0', label: 'CAUTION',   icon: AlertTriangle },
    caution: { color: '#FF9800', bg: '#FFF8F0', label: 'CAUTION',   icon: AlertTriangle },
    safe:    { color: '#00C853', bg: '#F0FFF4', label: 'SAFE',      icon: CheckCircle2 },
  };

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
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: '0 0 16px 0' }}>Search Results</h1>

        {/* Search bar */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '14px' }}>
              <Search size={18} color="#B0BEC5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search phone or business..."
              style={{ flex: 1, border: 'none', padding: '12px 12px 12px 42px', borderRadius: '12px', fontSize: '14px', outline: 'none', background: 'transparent' }}
            />
            <button onClick={handleSearch} style={{ background: 'linear-gradient(135deg, #E53935, #C62828)', border: 'none', borderRadius: '10px', padding: '9px 14px', cursor: 'pointer', color: 'white', fontWeight: '700', fontSize: '13px', margin: '4px' }}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', marginTop: '-20px', padding: '24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', minHeight: 'calc(100vh - 200px)' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #ECEFF1', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#8896A5', fontSize: '14px' }}>Checking TrustBase database...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#C62828' }}>
            <p style={{ fontSize: '14px' }}>⚠️ {error}</p>
          </div>
        )}

        {!loading && !error && !results && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#1A2B3C', marginBottom: '8px' }}>Search for a number or business</p>
            <p style={{ fontSize: '13px', color: '#8896A5' }}>Enter a phone number or business name to check for scam reports</p>
          </div>
        )}

        {!loading && results && (() => {
          const risk = riskConfig[results.riskLevel] || riskConfig.safe;
          const RiskIcon = risk.icon;
          return (
            <>
              {/* Risk Card */}
              <div style={{ background: risk.bg, borderRadius: '16px', padding: '20px', marginBottom: '20px', border: `1.5px solid ${risk.color}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <RiskIcon size={28} color={risk.color} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: risk.color, letterSpacing: '1px' }}>{risk.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#1A2B3C' }}>{query}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: risk.color }}>{results.riskScore}</div>
                    <div style={{ fontSize: '10px', color: '#8896A5' }}>Risk Score</div>
                  </div>
                </div>

                {results.verified && (
                  <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <ShieldCheck size={16} color="#388E3C" />
                    <span style={{ fontSize: '13px', color: '#388E3C', fontWeight: '600' }}>
                      ✅ Verified {results.verified.entity_type}: {results.verified.entity_name}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: risk.color }}>{results.totalReports}</div>
                    <div style={{ fontSize: '10px', color: '#8896A5' }}>Reports</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#E53935' }}>
                      {results.totalLost > 0 ? `₦${(results.totalLost / 1000).toFixed(0)}k` : '₦0'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#8896A5' }}>Total Lost</div>
                  </div>
                </div>
              </div>

              {/* Reports list */}
              {results.reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#8896A5' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1A2B3C', marginBottom: '4px' }}>No scam reports found</p>
                  <p style={{ fontSize: '13px' }}>This number/business appears clean in our database.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A2B3C', marginBottom: '12px' }}>
                    {results.reports.length} Report{results.reports.length > 1 ? 's' : ''} Found
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {results.reports.map(r => (
                      <div key={r.id} style={{ background: '#F8F9FA', borderRadius: '12px', padding: '14px', border: '1px solid #ECEFF1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#E53935', background: '#FFF5F5', padding: '2px 8px', borderRadius: '20px' }}>{r.scam_type}</span>
                          <span style={{ fontSize: '11px', color: '#B0BEC5' }}>{getTimeAgo(r.created_at)}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#546E7A', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                          {r.description.length > 120 ? r.description.slice(0, 120) + '…' : r.description}
                        </p>
                        {r.amount_lost > 0 && (
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#E53935' }}>
                            ₦{r.amount_lost.toLocaleString()} lost
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
