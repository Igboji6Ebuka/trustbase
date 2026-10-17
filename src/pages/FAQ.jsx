import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, ChevronDown, ChevronUp, 
  HelpCircle, ShieldCheck, AlertTriangle, MessageSquare, 
  Sparkles, CheckCircle, ExternalLink, Shield 
} from 'lucide-react';

export const FAQ_DATA = [
  {
    id: 1,
    category: 'General',
    question: 'What is TrustBase?',
    answer: 'TrustBase is a trust and reputation platform that helps people verify businesses and individuals, read real reviews, and report scams before doing business.'
  },
  {
    id: 2,
    category: 'General',
    question: 'Why should I use TrustBase?',
    answer: 'Search for a person or business before you transact to check available verification, reviews, reputation, and scam reports and make a more informed decision.'
  },
  {
    id: 3,
    category: 'General',
    question: 'Who can join TrustBase?',
    answer: 'Anyone can join. Businesses, individuals, vendors, freelancers, artisans, professionals, and service providers can create a profile and build their reputation on TrustBase.'
  },
  {
    id: 4,
    category: 'Verification',
    question: 'Why should I verify my profile?',
    answer: 'Verification helps you establish credibility and gives customers or other users more confidence when dealing with you. Verified profiles receive the TrustBase Verified badge.'
  },
  {
    id: 5,
    category: 'Verification',
    question: "Does the Verified badge guarantee that I won't be scammed?",
    answer: "No. Verification is a trust signal, not a guarantee. Users should still verify transaction details and take appropriate precautions before making payments."
  },
  {
    id: 6,
    category: 'Verification',
    question: "What if I can't find a business or person on TrustBase?",
    answer: 'They may not have joined yet. Encourage them to create a TrustBase account and get verified so people can easily find them and view their available trust information.'
  },
  {
    id: 7,
    category: 'Scam Reports',
    question: 'Can I report a scam?',
    answer: 'Yes. You can report suspected scams, fake accounts, fraudulent businesses, dishonest sellers, non-delivery, or other suspicious activity. Reports should be truthful and supported with available evidence.'
  },
  {
    id: 8,
    category: 'Scam Reports',
    question: 'What happens after I report a scam?',
    answer: 'TrustBase may review the report and supporting information. Where appropriate, it may contribute to warnings, reputation information, or action against accounts that violate TrustBase policies.'
  },
  {
    id: 9,
    category: 'Reviews',
    question: 'Can I leave a review?',
    answer: 'Yes. After dealing with a business or individual, you can share your genuine experience. Real reviews help others make better decisions and help good businesses build their reputation.'
  },
  {
    id: 10,
    category: 'Reviews',
    question: 'Can businesses respond to reviews or dispute reports?',
    answer: "Yes. Businesses and individuals may be able to respond to reviews or provide additional information when disputing a review or report, subject to TrustBase's policies."
  },
  {
    id: 11,
    category: 'Reviews',
    question: 'Can TrustBase remove negative reviews?',
    answer: 'Negative reviews are not removed simply because they are negative. Content that is fake, abusive, misleading, irrelevant, or violates TrustBase policies may be restricted or removed.'
  },
  {
    id: 12,
    category: 'General',
    question: 'Is TrustBase a payment platform?',
    answer: 'No. TrustBase is a trust, verification, review, and scam-reporting platform. It does not replace payment providers or guarantee transactions.'
  },
  {
    id: 13,
    category: 'Verification',
    question: 'How can TrustBase help my business?',
    answer: 'A verified TrustBase profile can help you build credibility, collect genuine reviews, strengthen your reputation, and give potential customers more confidence before they do business with you.'
  },
  {
    id: 14,
    category: 'Safety',
    question: 'How can I protect myself from scams?',
    answer: "Before paying, search on TrustBase, check the verification status, read reviews, look for scam reports, and confirm the person's or business's details. If something feels suspicious, stop and investigate before proceeding."
  },
  {
    id: 15,
    category: 'Community',
    question: 'How can I help build a safer Nigeria?',
    answer: 'Join TrustBase, verify your profile, leave honest reviews, check profiles before transactions, and report suspected scams. Together, businesses and individuals can build a stronger and more trusted digital economy in Nigeria.'
  }
];

const CATEGORIES = ['All', 'General', 'Verification', 'Scam Reports', 'Reviews', 'Safety', 'Community'];

export default function FAQ() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openId, setOpenId] = useState(1); // default first item expanded

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query) ||
        faq.id.toString() === query;
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const toggleAccordion = (id) => {
    setOpenId(prev => prev === id ? null : id);
  };

  return (
    <div style={{ background: '#F5F6FA', minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A2B3C 0%, #0D1B2A 100%)',
        padding: '20px 20px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', left: '-20px', bottom: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(229,57,53,0.15)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '12px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '20px', marginBottom: '2px' }}>
              <HelpCircle size={12} color="#FF6B6B" />
              <span style={{ fontSize: '10px', color: '#FF8A80', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Help Center</span>
            </div>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: 0, lineHeight: 1.2 }}>
              Frequently Asked Questions
            </h1>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '4px 0 16px 50px', lineHeight: 1.4 }}>
          Find answers to common questions about TrustBase verification, scam reports, and safety.
        </p>

        {/* Search Input */}
        <div style={{ position: 'relative', marginTop: '12px' }}>
          <Search size={18} color="#8896A5" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search questions (e.g., verification, scams)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 16px 13px 44px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.96)',
              fontSize: '14px',
              outline: 'none',
              color: '#1A2B3C',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        background: 'white',
        borderRadius: '24px 24px 0 0',
        marginTop: '-18px',
        position: 'relative',
        zIndex: 10,
        padding: '20px',
        minHeight: 'calc(100vh - 180px)'
      }}>

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '14px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {CATEGORIES.map(category => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  background: isActive ? '#E53935' : '#F5F6FA',
                  color: isActive ? 'white' : '#546E7A',
                  border: `1.5px solid ${isActive ? '#E53935' : '#ECEFF1'}`,
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#8896A5', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            {filteredFaqs.length} {filteredFaqs.length === 1 ? 'Question' : 'Questions'} Available
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#E53935', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Clear search
            </button>
          )}
        </div>

        {/* FAQ Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div style={{
            background: '#F8F9FA',
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center',
            border: '1.5px dashed #ECEFF1'
          }}>
            <HelpCircle size={36} color="#B0BEC5" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A2B3C', margin: '0 0 6px 0' }}>No matching questions found</h3>
            <p style={{ fontSize: '13px', color: '#8896A5', margin: 0 }}>
              Try searching with different keywords or switch back to "All" categories.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    border: `1.5px solid ${isOpen ? '#E53935' : '#ECEFF1'}`,
                    borderRadius: '16px',
                    background: isOpen ? '#FFFFFF' : '#FFFFFF',
                    boxShadow: isOpen ? '0 4px 16px rgba(229, 57, 53, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Number Badge */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isOpen ? '#E53935' : '#F0F4F8',
                      color: isOpen ? 'white' : '#546E7A',
                      fontSize: '12px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}>
                      {faq.id}
                    </div>

                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: isOpen ? '#E53935' : '#1A2B3C',
                        lineHeight: 1.4,
                        display: 'block'
                      }}>
                        {faq.question}
                      </span>
                    </div>

                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isOpen ? '#FFF5F5' : '#F5F6FA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isOpen ? (
                        <ChevronUp size={16} color="#E53935" />
                      ) : (
                        <ChevronDown size={16} color="#8896A5" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 16px 18px 56px',
                      borderTop: '1px solid #FFF1F0',
                      background: '#FFFCFC'
                    }}>
                      <p style={{
                        fontSize: '13.5px',
                        lineHeight: 1.6,
                        color: '#455A64',
                        margin: '12px 0 0 0',
                        whiteSpace: 'pre-line'
                      }}>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick CTA Box */}
        <div style={{
          marginTop: '28px',
          background: 'linear-gradient(135deg, #FFF5F5 0%, #FEE8E8 100%)',
          border: '1.5px solid rgba(229,57,53,0.2)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#E53935',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1A2B3C', margin: 0 }}>
                Need more help or ready to take action?
              </h3>
              <p style={{ fontSize: '12px', color: '#546E7A', margin: '2px 0 0 0' }}>
                Join TrustBase today or submit a report to protect others.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={() => navigate('/get-verified')}
              style={{
                flex: 1,
                background: '#E53935',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Get Verified
            </button>
            <button
              onClick={() => navigate('/report-scam')}
              style={{
                flex: 1,
                background: 'white',
                color: '#E53935',
                border: '1.5px solid #E53935',
                borderRadius: '12px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Report a Scam
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
