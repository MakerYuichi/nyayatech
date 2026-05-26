'use client'
import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STATUS_STEPS = [
  { key: 'submitted',    label: 'Case Submitted',      icon: '📋', desc: 'Your case has been received and is in the queue.' },
  { key: 'under_review', label: 'Paralegal Review',    icon: '🔍', desc: 'A trained paralegal is reviewing your case details.' },
  { key: 'notice_sent',  label: 'Notice Dispatched',   icon: '📬', desc: 'A formal legal notice has been sent to the opposing party.' },
  { key: 'mediation',    label: 'Mediation Scheduled', icon: '🤝', desc: 'Both parties have been invited to a mediation session.' },
  { key: 'resolved',     label: 'Resolved',            icon: '✅', desc: 'Your dispute has been successfully resolved.' },
]

const DISPUTE_LABELS: Record<string, string> = {
  property: 'Property / Tenancy',
  payment:  'Payment Default',
  contract: 'Contract Breach',
  society:  'Society Dispute',
}

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [caseData, setCaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('cases').select('*').eq('id', id).single()
      .then(({ data }) => { setCaseData(data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Crimson Pro', serif", color: 'rgba(251,249,245,0.45)', fontSize: '1.1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚖️</div>
        <div>Loading your case...</div>
      </div>
    </div>
  )

  if (!caseData) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Crimson Pro', serif", color: 'rgba(251,249,245,0.45)', fontSize: '1.1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❌</div>
        <div>Case not found.</div>
        <a href="/file-case" style={{ display: 'inline-block', marginTop: '1.5rem', color: '#D4AF37', textDecoration: 'none' }}>← File a new case</a>
      </div>
    </div>
  )

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === caseData.status)
  const currentStep = STATUS_STEPS[Math.max(currentIdx, 0)]

  return (
    <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", minHeight: '100vh', background: 'linear-gradient(180deg, #0B0C10 0%, #14171E 100%)', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '660px', margin: '0 auto' }}>

        {/* Header */}
        <div className="anim-fade-down" style={{ marginBottom: '2.5rem' }}>
          <span style={{ display: 'inline-block', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', padding: '0.3rem 1rem', borderRadius: '2px', marginBottom: '1.25rem' }}>
            Case Tracker
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#FBF9F5', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            Your Case Status
          </h1>
          <p style={{ color: 'rgba(251,249,245,0.3)', fontSize: '0.82rem', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
            NYT-{id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Current status banner */}
        <div className="anim-fade-up anim-delay-1" style={{
          background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.28)',
          borderRadius: '8px', padding: '1.5rem 1.75rem', marginBottom: '2rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          animation: 'pulse-gold 2.5s ease infinite',
        }}>
          <span style={{ fontSize: '2rem' }}>{currentStep.icon}</span>
          <div>
            <div style={{ color: '#D4AF37', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
              {currentStep.label}
            </div>
            <div style={{ color: 'rgba(251,249,245,0.58)', fontSize: '0.92rem' }}>{currentStep.desc}</div>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="anim-fade-up anim-delay-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '8px', padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#D4AF37', marginBottom: '1.75rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            Progress
          </h2>
          <div style={{ position: 'relative' }}>
            {/* vertical track */}
            <div style={{ position: 'absolute', left: '15px', top: '16px', bottom: '16px', width: '2px', background: 'rgba(212,175,55,0.08)' }} />
            {/* filled portion */}
            <div style={{
              position: 'absolute', left: '15px', top: '16px',
              width: '2px',
              height: `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%`,
              background: 'linear-gradient(to bottom, #D4AF37, rgba(212,175,55,0.3))',
              transition: 'height 1s ease',
            }} />

            {STATUS_STEPS.map((step, i) => {
              const done = i < currentIdx
              const active = i === currentIdx
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: i < STATUS_STEPS.length - 1 ? '1.75rem' : 0, position: 'relative' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.82rem', fontWeight: 700,
                    background: done ? '#D4AF37' : active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${done ? '#D4AF37' : active ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                    color: done ? '#0B0C10' : active ? '#D4AF37' : 'rgba(251,249,245,0.2)',
                    boxShadow: active ? '0 0 0 4px rgba(212,175,55,0.15), 0 0 16px rgba(212,175,55,0.25)' : 'none',
                    transition: 'all 0.4s ease',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ paddingTop: '5px' }}>
                    <div style={{ fontWeight: active ? 600 : 400, color: done || active ? '#FBF9F5' : 'rgba(251,249,245,0.28)', fontSize: '1rem', marginBottom: '0.15rem' }}>
                      {step.label}
                    </div>
                    {active && <div style={{ fontSize: '0.85rem', color: 'rgba(251,249,245,0.48)' }}>{step.desc}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Case summary */}
        <div className="anim-fade-up anim-delay-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '8px', padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#D4AF37', marginBottom: '1.25rem', fontWeight: 600 }}>Case Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Dispute Type',    value: DISPUTE_LABELS[caseData.dispute_type] || caseData.dispute_type },
              { label: 'Amount',          value: `₹${Number(caseData.dispute_amount).toLocaleString('en-IN')}` },
              { label: 'Opposing Party',  value: caseData.party_b_name },
              { label: 'Date Filed',      value: new Date(caseData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.38)', marginBottom: '0.4rem' }}>{item.label}</div>
                <div style={{ color: '#FBF9F5', fontWeight: 600, fontSize: '0.98rem' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Paralegal note */}
        {caseData.paralegal_notes && (
          <div className="anim-fade-up" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: '8px', padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#93C5FD', marginBottom: '0.6rem', fontWeight: 600 }}>
              📝 Paralegal Note
            </h3>
            <p style={{ color: 'rgba(147,197,253,0.82)', fontSize: '0.92rem', lineHeight: 1.65 }}>{caseData.paralegal_notes}</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/file-case" style={{ color: 'rgba(251,249,245,0.35)', fontSize: '0.88rem', textDecoration: 'none', letterSpacing: '0.04em', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#D4AF37')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(251,249,245,0.35)')}
          >← File Another Case</a>
        </div>
      </div>
    </div>
  )
}
