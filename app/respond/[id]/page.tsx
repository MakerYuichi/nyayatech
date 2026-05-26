'use client'
import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { capitalize } from '@/lib/utils'

const DISPUTE_LABELS: Record<string, string> = {
  property: 'Property / Tenancy',
  payment:  'Payment Default',
  contract: 'Contract Breach',
  society:  'Society Dispute',
}

/* ── Countdown timer ── */
function useCountdown(createdAt: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, expired: false })

  useEffect(() => {
    if (!createdAt) return
    const deadline = new Date(createdAt).getTime() + 14 * 24 * 60 * 60 * 1000

    const tick = () => {
      const diff = deadline - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, expired: true })
        return
      }
      setTimeLeft({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        expired: false,
      })
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [createdAt])

  return timeLeft
}

type Option = 'resolve' | 'contest' | 'info' | null
type Step   = 'choose' | 'form' | 'done'

export default function RespondPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params)
  const shortId   = 'NYT-' + id.slice(0, 8).toUpperCase()

  const [caseData, setCaseData]   = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [option, setOption]       = useState<Option>(null)
  const [step, setStep]           = useState<Step>('choose')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  // Form fields
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')

  const countdown = useCountdown(caseData?.created_at ?? null)

  useEffect(() => {
    supabase.from('cases').select('*').eq('id', id).single()
      .then(({ data }) => { setCaseData(data); setLoading(false) })
  }, [id])

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setSubmitting(true); setError('')

    const nextStatus   = option === 'resolve' ? 'mediation' : 'contested'
    const responseText = option === 'resolve'
      ? `Party B (${name}) agreed to mediation. Contact: ${phone} / ${email}`
      : option === 'contest'
      ? `Party B (${name}) contests the facts: ${message}`
      : `Party B (${name}) requested more information. Contact: ${phone} / ${email}`

    const { error: err } = await supabase.from('cases').update({
      party_b_response:     responseText,
      party_b_responded_at: new Date().toISOString(),
      status: option === 'info' ? caseData.status : nextStatus,
    }).eq('id', id)

    if (err) { setError('Submission failed. Please try again.'); setSubmitting(false); return }
    setStep('done')
    setSubmitting(false)
  }

  /* ── Shared styles ── */
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(212,175,55,0.12)',
    borderRadius: '8px', padding: '1.75rem',
  }
  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(212,175,55,0.2)', borderRadius: '4px',
    padding: '0.7rem 1rem', color: '#FBF9F5',
    fontFamily: "'Crimson Pro', serif", fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0C10', color: 'rgba(251,249,245,0.4)', fontFamily: "'Crimson Pro', serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚖️</div>
        Loading notice details...
      </div>
    </div>
  )

  if (!caseData) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0C10', color: 'rgba(251,249,245,0.4)', fontFamily: "'Crimson Pro', serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        Notice not found. Please check the URL in your letter.
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0B0C10 0%, #14171E 100%)', fontFamily: "'Crimson Pro', Georgia, serif", padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          {/* Legitimacy badge */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {['Official Dispute Notice', 'Mediation Act 2023', 'Case Verified'].map(b => (
              <span key={b} style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', padding: '0.25rem 0.75rem', borderRadius: '2px' }}>{b}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#FBF9F5', lineHeight: 1.1, marginBottom: '0.6rem' }}>
            You Have Received<br />a <em style={{ color: '#D4AF37' }}>Legal Notice</em>
          </h1>
          <p style={{ color: 'rgba(251,249,245,0.3)', fontSize: '0.82rem', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
            Case Reference: {shortId}
          </p>
        </div>

        {/* ── Notice summary card ── */}
        <div style={{ ...card, marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '1.25rem' }}>Notice Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Filed By',      value: capitalize(caseData.party_a_name) },
              { label: 'Dispute Type',  value: DISPUTE_LABELS[caseData.dispute_type] || caseData.dispute_type },
              { label: 'Amount Claimed', value: `₹${Number(caseData.dispute_amount).toLocaleString('en-IN')}` },
              { label: 'Date Filed',    value: new Date(caseData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.38)', marginBottom: '0.3rem' }}>{item.label}</div>
                <div style={{ color: '#FBF9F5', fontWeight: 600, fontSize: '0.95rem' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div style={{
            background: countdown.expired ? 'rgba(239,68,68,0.08)' : 'rgba(212,175,55,0.06)',
            border: `1px solid ${countdown.expired ? 'rgba(239,68,68,0.3)' : 'rgba(212,175,55,0.25)'}`,
            borderRadius: '6px', padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: countdown.expired ? '#FCA5A5' : '#D4AF37', marginBottom: '0.25rem' }}>
                Response Deadline
              </div>
              {countdown.expired
                ? <div style={{ color: '#FCA5A5', fontWeight: 700, fontSize: '0.95rem' }}>Response window closed — case proceeding to filing</div>
                : <div style={{ color: '#FBF9F5', fontSize: '0.9rem' }}>
                    You have <strong style={{ color: '#D4AF37' }}>{countdown.days}d {countdown.hours}h {countdown.minutes}m</strong> remaining to respond
                  </div>
              }
            </div>
            {!countdown.expired && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { val: countdown.days,    label: 'Days' },
                  { val: countdown.hours,   label: 'Hours' },
                  { val: countdown.minutes, label: 'Min' },
                ].map(t => (
                  <div key={t.label} style={{ textAlign: 'center', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '4px', padding: '0.4rem 0.6rem', minWidth: '44px' }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>{String(t.val).padStart(2, '0')}</div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(251,249,245,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Already responded ── */}
        {caseData.party_b_responded_at && step !== 'done' && (
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <div>
              <div style={{ color: '#4ADE80', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>You have already responded to this notice.</div>
              <div style={{ color: 'rgba(251,249,245,0.5)', fontSize: '0.85rem' }}>Responded on {new Date(caseData.party_b_responded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        )}

        {/* ── Done state ── */}
        {step === 'done' && (
          <div style={{ ...card, textAlign: 'center', marginBottom: '1.25rem', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#4ADE80', marginBottom: '0.75rem' }}>Response Recorded</h2>
            <p style={{ color: 'rgba(251,249,245,0.65)', fontSize: '1rem', lineHeight: 1.65 }}>
              {option === 'resolve' && 'You have agreed to mediation. A NyayaTech representative will contact you within 24 hours to schedule your session.'}
              {option === 'contest' && 'Your contestation has been recorded and forwarded to the paralegal team for review. You will be contacted within 48 hours.'}
              {option === 'info'    && 'Your request for information has been received. Our team will reach out to you within 24 hours.'}
            </p>
          </div>
        )}

        {/* ── Choose option ── */}
        {step === 'choose' && !caseData.party_b_responded_at && !countdown.expired && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', marginBottom: '1rem' }}>
              How would you like to respond?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'resolve' as Option, icon: '🤝', title: 'I want to resolve this', desc: 'Agree to online mediation. A certified neutral mediator will facilitate a fair resolution.', color: '#4ADE80', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.2)' },
                { key: 'contest' as Option, icon: '📝', title: 'I contest the facts',    desc: 'Dispute the claims made against you. Your response will be reviewed by the paralegal team.', color: '#FB923C', bg: 'rgba(251,146,60,0.06)', border: 'rgba(251,146,60,0.2)' },
                { key: 'info'    as Option, icon: '❓', title: 'I need more information', desc: 'Request clarification before deciding. Our team will contact you within 24 hours.', color: '#60A5FA', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)' },
              ].map(opt => (
                <div key={opt.key} onClick={() => { setOption(opt.key); setStep('form') }}
                  style={{
                    background: option === opt.key ? opt.bg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${option === opt.key ? opt.border : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '8px', padding: '1.25rem 1.5rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = opt.border; e.currentTarget.style.background = opt.bg }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                >
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{opt.icon}</span>
                  <div>
                    <div style={{ color: opt.color, fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{opt.title}</div>
                    <div style={{ color: 'rgba(251,249,245,0.55)', fontSize: '0.88rem', lineHeight: 1.55 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Response form ── */}
        {step === 'form' && option && (
          <div style={{ ...card, marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#D4AF37', fontWeight: 600 }}>
                {option === 'resolve' ? '🤝 Agree to Mediation' : option === 'contest' ? '📝 Contest the Facts' : '❓ Request Information'}
              </h2>
              <button onClick={() => { setStep('choose'); setOption(null); setError('') }}
                style={{ background: 'none', border: 'none', color: 'rgba(251,249,245,0.35)', cursor: 'pointer', fontSize: '1.1rem' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FBF9F5')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(251,249,245,0.35)')}
              >← Back</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { label: 'Your Full Name', val: name, set: setName, type: 'text', required: true },
                { label: 'Your Phone Number', val: phone, set: setPhone, type: 'tel', required: false },
                { label: 'Your Email Address', val: email, set: setEmail, type: 'email', required: false },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', marginBottom: '0.4rem' }}>
                    {f.label}{f.required && ' *'}
                  </label>
                  <input style={inp} type={f.type} value={f.val}
                    onChange={e => f.set(e.target.value)}
                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                  />
                </div>
              ))}

              {option === 'contest' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', marginBottom: '0.4rem' }}>
                    Your Response *
                  </label>
                  <textarea style={{ ...inp, height: '120px', resize: 'vertical' }}
                    placeholder="Explain your side of the dispute. Include any facts, dates, or evidence you wish to put on record."
                    value={message} onChange={e => setMessage(e.target.value)}
                    onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                  />
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', padding: '0.75rem 1rem', color: '#FCA5A5', fontSize: '0.88rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting}
                style={{
                  width: '100%', background: submitting ? 'rgba(212,175,55,0.4)' : '#D4AF37',
                  color: '#0B0C10', padding: '0.9rem', borderRadius: '4px', border: 'none',
                  fontFamily: "'Crimson Pro', serif", fontSize: '1rem', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#F3E5AB' }}
                onMouseLeave={e => { e.currentTarget.style.background = submitting ? 'rgba(212,175,55,0.4)' : '#D4AF37' }}
              >
                {submitting
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(11,12,16,0.3)', borderTopColor: '#0B0C10', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Submitting...
                    </span>
                  : option === 'resolve' ? 'Confirm — I Agree to Mediation →'
                  : option === 'contest' ? 'Submit My Response →'
                  : 'Request Information →'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Non-response warning ── */}
        {!caseData.party_b_responded_at && step !== 'done' && (
          <div style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ color: 'rgba(251,146,60,0.85)', fontSize: '0.88rem', lineHeight: 1.65 }}>
              If you do not respond within the deadline, your non-participation will be formally documented and presented to the presiding judge as grounds for exemplary costs under Section 35-A of the Code of Civil Procedure, 1908. This is not a threat — it is a factual statement of the legal process.
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(251,249,245,0.2)', lineHeight: 1.6, marginTop: '1rem' }}>
          NyayaTech Infrastructure Pvt Ltd &nbsp;·&nbsp; Mediation Act, 2023 Compliant &nbsp;·&nbsp; Not a law firm &nbsp;·&nbsp; Does not provide legal advice
        </p>
      </div>
    </div>
  )
}
