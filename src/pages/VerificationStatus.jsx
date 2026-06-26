import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Circle, ShieldCheck, Phone } from 'lucide-react';
import api from '../api';

const STATUS_MAP = {
  pending:       { label: 'Pending Review',  color: '#FF9800', bg: '#FFF8F0', step: 1 },
  under_review:  { label: 'Under Review',    color: '#1976D2', bg: '#E3F2FD', step: 2 },
  docs_received: { label: 'Docs Received',   color: '#7B1FA2', bg: '#F3E5F5', step: 2 },
  approved:      { label: 'Approved ✅',     color: '#00C853', bg: '#F0FFF4', step: 4 },
  rejected:      { label: 'Rejected ❌',     color: '#E53935', bg: '#FFF5F5', step: 0 },
};

const STATUS_CONFIG = {
  done:    { bg: '#00C853',  icon: <CheckCircle2 size={20} color="white" /> },
  current: { bg: '#FF9800',  icon: <Clock size={18} color="white" /> },
  pending: { bg: '#E0E4EC',  icon: null },
};

export default function VerificationStatus() {
  const navigate = useNavigate();
  const [verif, setVerif]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVerificationStatus()
      .then(data => setVerif(data.verification))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F6FA' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #ECEFF1', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#8896A5', fontSize: '14px' }}>Loading status...</p>
        </div>
      </div>
    );
  }

  if (!verif) {
    return (
      <div style={{ background: '#F5F6FA', minHeight: '100vh' }}>
        <div style={{ background: 'linear-gradient(135deg, #1A2B3C 0%, #0D1B2A 100%)', padding: '20px 20px 40px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '16px' }}>
            <ArrowLeft size={20} color="white" />
          </button>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: 0 }}>Verification Status</h1>
        </div>
        <div style={{ background: 'white', borderRadius: '24px 24px 0 0', marginTop: '-20px', padding: '40px 24px', textAlign: 'center', minHeight: 'calc(100vh - 120px)' }}>
          <ShieldCheck size={60} color="#ECEFF1" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A2B3C', marginBottom: '8px' }}>No verification application</h2>
          <p style={{ fontSize: '14px', color: '#8896A5', marginBottom: '24px' }}>You haven't applied for verification yet. Get verified to build trust with your customers.</p>
          <button className="btn-primary" onClick={() => navigate('/get-verified')} style={{ borderRadius: '12px' }}>
            Apply for Verification
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[verif.status] || STATUS_MAP.pending;
  const currentStep = statusInfo.step;

  const steps = [
    { id: 1, title: 'Application Submitted', desc: `Your verification application for "${verif.entity_name}" was received.`, time: new Date(verif.submitted_at).toLocaleString() },
    { id: 2, title: 'Under Review', desc: 'Our team is currently verifying your identity and documents. This usually takes 1-2 business days.', time: currentStep >= 2 ? 'In progress' : 'Pending' },
    { id: 3, title: 'Verification Call', desc: 'We may schedule a brief call to confirm your details.', time: currentStep >= 3 ? 'Completed' : 'Pending' },
    { id: 4, title: 'Approved & Verified', desc: 'Your verified badge will be active and visible on all searches.', time: verif.reviewed_at ? new Date(verif.reviewed_at).toLocaleString() : 'Pending' },
  ];


  return (
    <div style={{ background: '#F5F6FA', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A2B3C 0%, #0D1B2A 100%)',
        padding: '20px 20px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '16px' }}
        >
          <ArrowLeft size={20} color="white" />
        </button>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>
          Verification Status
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
          Track your verification progress
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', marginTop: '-20px', padding: '24px', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 120px)' }}>
        
        {/* Status Banner */}
        <div style={{
          background: statusInfo.bg,
          border: `1.5px solid ${statusInfo.color}33`,
          borderRadius: '16px', padding: '16px',
          display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '24px',
        }}>
          <div style={{ width: '52px', height: '52px', background: statusInfo.color, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '800', color: statusInfo.color, margin: '0 0 2px 0' }}>{statusInfo.label}</p>
            <p style={{ fontSize: '12px', color: '#8896A5', margin: '0 0 6px 0' }}>Application #{verif.id} · {verif.entity_name}</p>
            <div style={{ background: `${statusInfo.color}22`, borderRadius: '6px', padding: '3px 10px', display: 'inline-block' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: statusInfo.color }}>Est. 1-2 Business Days</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1A2B3C' }}>Verification Progress</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: statusInfo.color }}>{currentStep} of 4 steps</span>
          </div>
          <div style={{ height: '8px', background: '#ECEFF1', borderRadius: '4px' }}>
            <div style={{ width: `${(currentStep / 4) * 100}%`, height: '100%', background: `linear-gradient(90deg, #00C853, ${statusInfo.color})`, borderRadius: '4px', transition: 'width 1s ease' }}/>
          </div>
        </div>

        {/* Timeline */}
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A2B3C', marginBottom: '16px' }}>Step-by-Step Progress</h3>
        <div style={{ position: 'relative' }}>
          {/* Connector line */}
          <div style={{
            position: 'absolute',
            left: '20px', top: '24px', bottom: '60px',
            width: '2px',
            background: 'linear-gradient(180deg, #00C853 50%, #ECEFF1 50%)',
            zIndex: 0,
          }}/>

          {steps.map((step) => {
            const stepStatus = step.id < currentStep ? 'done' : step.id === currentStep ? 'current' : 'pending';
            const conf = STATUS_CONFIG[stepStatus];
            return (
              <div key={step.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: conf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: stepStatus !== 'pending' ? `0 4px 14px ${conf.bg}55` : 'none', border: stepStatus === 'pending' ? '2px solid #ECEFF1' : 'none', zIndex: 2 }}>
                  {conf.icon || <span style={{ fontSize: '14px', fontWeight: '700', color: '#B0BEC5' }}>{step.id}</span>}
                </div>
                <div style={{ flex: 1, background: stepStatus === 'current' ? '#FFF8F0' : stepStatus === 'done' ? '#F0FFF4' : 'white', border: `1.5px solid ${stepStatus === 'current' ? 'rgba(255,152,0,0.25)' : stepStatus === 'done' ? 'rgba(0,200,83,0.2)' : '#ECEFF1'}`, borderRadius: '14px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: stepStatus === 'pending' ? '#B0BEC5' : '#1A2B3C', margin: 0 }}>{step.title}</h4>
                    {stepStatus === 'done' && <span style={{ fontSize: '10px', background: '#E8F5E9', color: '#00C853', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>DONE</span>}
                    {stepStatus === 'current' && <span style={{ fontSize: '10px', background: '#FFF3E0', color: '#FF9800', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>IN PROGRESS</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: '#B0BEC5', margin: '0 0 6px 0' }}>{step.time}</p>
                  <p style={{ fontSize: '13px', color: stepStatus === 'pending' ? '#B0BEC5' : '#546E7A', margin: 0, lineHeight: '1.5' }}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* What's Next */}
        <div style={{
          background: 'linear-gradient(135deg, #1A2B3C, #0D1B2A)',
          borderRadius: '18px',
          padding: '20px',
          marginTop: '8px',
          marginBottom: '24px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Phone size={18} color="#FFD700" />
            <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>What Happens Next?</p>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            Our verification team may call you on <strong style={{ color: 'white' }}>08012345678</strong> for a quick 5-minute confirmation call.
            Please keep your phone available during business hours (Mon–Fri, 9AM–5PM).
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate('/get-verified')}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px',
            background: '#F5F6FA', border: '1.5px solid #ECEFF1',
            color: '#546E7A', fontWeight: '700', fontSize: '14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <ShieldCheck size={18} color="#E53935" />
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}
