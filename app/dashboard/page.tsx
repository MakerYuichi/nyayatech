'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { capitalize } from '@/lib/utils'

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  submitted:    { bg: 'rgba(212,175,55,0.12)',  color: '#D4AF37',  label: 'Submitted' },
  under_review: { bg: 'rgba(251,146,60,0.12)',  color: '#FB923C',  label: 'Under Review' },
  notice_sent:  { bg: 'rgba(34,197,94,0.12)',   color: '#4ADE80',  label: 'Notice Sent' },
  mediation:    { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA',  label: 'Mediation' },
  contested:    { bg: 'rgba(239,68,68,0.12)',   color: '#F87171',  label: 'Contested' },
  resolved:     { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8',  label: 'Resolved' },
}

const DISPUTE_LABELS: Record<string, string> = {
  property: 'Property / Tenancy',
  payment:  'Payment Default',
  contract: 'Contract Breach',
  society:  'Society Dispute',
}

type FilterType = 'all' | 'pending' | 'done'

const DASHBOARD_PW = process.env.NEXT_PUBLIC_DASHBOARD_PW ?? 'nyaya2024'

/* ── Password gate as its own component so Dashboard hooks are never skipped ── */
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [shake, setShake] = useState(false)
  const [wrong, setWrong] = useState(false)

  const attempt = () => {
    if (pw === DASHBOARD_PW) {
      onAuth()
    } else {
      setPw('')
      setWrong(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #0B0C10 0%, #14171E 100%)',
      fontFamily: "'Crimson Pro', Georgia, serif", padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: '8px', padding: '2.5rem',
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚖️</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#FBF9F5', marginBottom: '0.5rem' }}>
            Paralegal Access
          </h1>
          <p style={{ color: 'rgba(251,249,245,0.45)', fontSize: '0.9rem' }}>
            Enter your access code to continue
          </p>
        </div>
        <input
          type="password"
          className="nt-input"
          placeholder="Access code"
          value={pw}
          autoFocus
          onChange={e => { setPw(e.target.value); setWrong(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ marginBottom: wrong ? '0.5rem' : '1rem' }}
        />
        {wrong && (
          <div style={{ color: '#FCA5A5', fontSize: '0.82rem', marginBottom: '0.75rem', textAlign: 'center' }}>
            Incorrect access code. Try again.
          </div>
        )}
        <button
          onClick={attempt}
          style={{
            width: '100%', background: '#D4AF37', color: '#0B0C10',
            padding: '0.85rem', borderRadius: '4px', border: 'none',
            fontFamily: "'Crimson Pro', serif", fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3E5AB' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#D4AF37' }}
        >
          Enter Dashboard →
        </button>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

export default function Dashboard() {
  /* ── All hooks declared unconditionally at the top ── */
  const [authed, setAuthed]           = useState(false)
  const [cases, setCases]             = useState<any[]>([])
  const [selected, setSelected]       = useState<any>(null)
  const [notes, setNotes]             = useState('')
  const [generating, setGenerating]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [filter, setFilter]           = useState<FilterType>('all')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [toast, setToast]             = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  const fetchCases = useCallback(async () => {
    const { data, error } = await supabase
      .from('cases').select('*').order('created_at', { ascending: false })
    if (!error) { setCases(data || []); setLastRefresh(new Date()) }
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchCases()
    const interval = setInterval(fetchCases, 10000)
    return () => clearInterval(interval)
  }, [authed, fetchCases])

  useEffect(() => {
    if (selected) {
      const updated = cases.find(c => c.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [cases])

  /* ── Early return AFTER all hooks ── */
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  const handleVerify = async (id: string, nextStatus: string) => {
    setSaving(true)
    const { error } = await supabase.from('cases').update({
      paralegal_verified: true,
      paralegal_notes: notes,
      status: nextStatus,
    }).eq('id', id)
    if (error) { showToast('❌ Update failed — check console'); console.error(error) }
    else { showToast(nextStatus === 'notice_sent' ? '✅ Case verified & notice sent' : '🚩 Case flagged for review') }
    setSaving(false)
    setSelected(null)
    setNotes('')
    fetchCases()
  }

  const handleGenerateNotice = async (caseId: string) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `notice-NYT-${caseId.slice(0, 8).toUpperCase()}.pdf`
      a.click(); URL.revokeObjectURL(url)
      showToast('📄 PDF downloaded')
    } catch (e) {
      showToast('❌ PDF generation failed')
      console.error(e)
    }
    setGenerating(false)
  }

  const filtered = cases.filter(c =>
    filter === 'pending' ? !c.paralegal_verified :
    filter === 'done'    ? c.paralegal_verified : true
  )
  const pendingCount = cases.filter(c => !c.paralegal_verified).length

  return (
    <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", minHeight: '100vh', background: '#0B0C10', padding: '3rem 1.5rem' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '1.5rem', zIndex: 200,
          background: '#14171E', border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '6px', padding: '0.85rem 1.25rem',
          color: '#FBF9F5', fontSize: '0.92rem', fontFamily: "'Crimson Pro', serif",
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeInDown 0.3s ease',
        }}>{toast}</div>
      )}

      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* Header */}
        <div className="anim-fade-down" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ display: 'inline-block', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', padding: '0.3rem 1rem', borderRadius: '2px', marginBottom: '1rem' }}>
              Internal Tool
            </span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: '#FBF9F5', lineHeight: 1.1 }}>
              Paralegal Dashboard
            </h1>
            <p style={{ color: 'rgba(251,249,245,0.35)', fontSize: '0.82rem', marginTop: '0.4rem' }}>
              Last updated: {lastRefresh.toLocaleTimeString('en-IN')} · Auto-refreshes every 10s
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total', value: cases.length, highlight: false },
              { label: 'Pending', value: pendingCount, highlight: true },
              { label: 'Done', value: cases.length - pendingCount, highlight: false },
            ].map(s => (
              <div key={s.label} style={{
                background: s.highlight ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${s.highlight ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '6px', padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: '80px',
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', fontWeight: 700, color: s.highlight ? '#D4AF37' : '#FBF9F5', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(251,249,245,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
            <button onClick={fetchCases} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', padding: '0.75rem 1rem', color: 'rgba(251,249,245,0.5)',
              fontFamily: "'Crimson Pro', serif", fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.color = '#D4AF37' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(251,249,245,0.5)' }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['all', 'pending', 'done'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? '#D4AF37' : 'rgba(255,255,255,0.03)',
              color: filter === f ? '#0B0C10' : 'rgba(251,249,245,0.55)',
              border: `1px solid ${filter === f ? '#D4AF37' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '4px', padding: '0.45rem 1.1rem',
              fontFamily: "'Crimson Pro', serif", fontSize: '0.88rem',
              fontWeight: filter === f ? 700 : 400, cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'capitalize', transition: 'all 0.2s',
            }}>
              {f === 'all' ? `All (${cases.length})` : f === 'pending' ? `Pending (${pendingCount})` : `Done (${cases.length - pendingCount})`}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0,1fr) minmax(0,1.15fr)' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* CASE LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(251,249,245,0.28)', fontSize: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                No cases found.
              </div>
            )}
            {filtered.map(c => {
              const meta = STATUS_META[c.status] || STATUS_META['submitted']
              const isSelected = selected?.id === c.id
              return (
                <div key={c.id} onClick={() => { setSelected(c); setNotes(c.paralegal_notes || '') }}
                  style={{
                    padding: '1.1rem 1.4rem', borderRadius: '8px',
                    border: `1px solid ${isSelected ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.06)'}`,
                    background: isSelected ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', opacity: c.paralegal_verified ? 0.55 : 1,
                    transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#FBF9F5', fontSize: '0.98rem' }}>{capitalize(c.party_a_name)}</span>
                      <span style={{ color: 'rgba(251,249,245,0.3)', fontSize: '0.8rem' }}>vs</span>
                      <span style={{ color: 'rgba(251,249,245,0.65)', fontSize: '0.92rem' }}>{capitalize(c.party_b_name)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: '#D4AF37', fontWeight: 600, fontSize: '0.9rem' }}>₹{Number(c.dispute_amount).toLocaleString('en-IN')}</span>
                      <span style={{ color: 'rgba(251,249,245,0.32)', fontSize: '0.78rem' }}>{DISPUTE_LABELS[c.dispute_type] || c.dispute_type}</span>
                      <span style={{ color: 'rgba(251,249,245,0.22)', fontSize: '0.78rem' }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}22`, flexShrink: 0 }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* DETAIL PANEL */}
          {selected && (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: '8px', padding: '2rem', position: 'sticky', top: '80px',
              animation: 'fadeInUp 0.3s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#D4AF37', fontWeight: 600 }}>Case Review</h2>
                  <p style={{ color: 'rgba(251,249,245,0.28)', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>NYT-{selected.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(251,249,245,0.35)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0.25rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FBF9F5')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(251,249,245,0.35)')}
                >✕</button>
              </div>

              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { title: 'Claimant',   name: capitalize(selected.party_a_name), email: selected.party_a_email, phone: selected.party_a_phone },
                  { title: 'Respondent', name: capitalize(selected.party_b_name), email: selected.party_b_email, phone: selected.party_b_phone },
                ].map(p => (
                  <div key={p.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.9rem' }}>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '0.5rem' }}>{p.title}</div>
                    <div style={{ color: '#FBF9F5', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.2rem' }}>{p.name}</div>
                    {p.email && <div style={{ color: 'rgba(251,249,245,0.45)', fontSize: '0.8rem' }}>{p.email}</div>}
                    {p.phone && <div style={{ color: 'rgba(251,249,245,0.45)', fontSize: '0.8rem' }}>{p.phone}</div>}
                  </div>
                ))}
              </div>

              {/* Dispute info */}
              <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'rgba(251,249,245,0.45)', fontSize: '0.88rem' }}>Type</span>
                  <span style={{ color: '#FBF9F5', fontWeight: 600, fontSize: '0.88rem' }}>{DISPUTE_LABELS[selected.dispute_type] || selected.dispute_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'rgba(251,249,245,0.45)', fontSize: '0.88rem' }}>Amount</span>
                  <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '1rem' }}>₹{Number(selected.dispute_amount).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                  <div style={{ color: 'rgba(251,249,245,0.38)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Description</div>
                  <p style={{ color: 'rgba(251,249,245,0.72)', fontSize: '0.88rem', lineHeight: 1.6 }}>{selected.dispute_description}</p>
                </div>
              </div>

              {/* Party B response */}
              {selected.party_b_response && (
                <div style={{ background: selected.status === 'contested' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)', border: `1px solid ${selected.status === 'contested' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: selected.status === 'contested' ? '#F87171' : '#4ADE80', marginBottom: '0.5rem' }}>
                    {selected.status === 'contested' ? '⚠️ Party B Contested' : '✅ Party B Responded'}
                    {selected.party_b_responded_at && <span style={{ color: 'rgba(251,249,245,0.3)', marginLeft: '0.5rem', fontWeight: 400 }}>· {new Date(selected.party_b_responded_at).toLocaleDateString('en-IN')}</span>}
                  </div>
                  <p style={{ color: 'rgba(251,249,245,0.72)', fontSize: '0.85rem', lineHeight: 1.6 }}>{selected.party_b_response}</p>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.38)', marginBottom: '0.5rem' }}>
                  Paralegal Notes
                </label>
                <textarea className="nt-input" style={{ height: '90px', resize: 'vertical' }}
                  placeholder="Add notes, corrections, or flags..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {[
                    { label: '🚩 Flag for Review', status: 'under_review', bg: 'rgba(251,146,60,0.08)', color: '#FB923C', hoverBg: 'rgba(251,146,60,0.18)' },
                    { label: '✅ Verify & Send',   status: 'notice_sent',  bg: 'rgba(34,197,94,0.08)',  color: '#4ADE80', hoverBg: 'rgba(34,197,94,0.18)' },
                  ].map(btn => (
                    <button key={btn.status} disabled={saving}
                      onClick={() => handleVerify(selected.id, btn.status)}
                      style={{
                        flex: 1, background: btn.bg, color: btn.color,
                        border: `1px solid ${btn.color}44`, borderRadius: '4px', padding: '0.7rem',
                        fontFamily: "'Crimson Pro', serif", fontSize: '0.88rem', fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        opacity: saving ? 0.6 : 1,
                      }}
                      onMouseEnter={e => { if (!saving) e.currentTarget.style.background = btn.hoverBg }}
                      onMouseLeave={e => { e.currentTarget.style.background = btn.bg }}
                    >{btn.label}</button>
                  ))}
                </div>

                <button disabled={generating}
                  onClick={() => handleGenerateNotice(selected.id)}
                  style={{
                    width: '100%', background: 'rgba(212,175,55,0.08)', color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.28)', borderRadius: '4px', padding: '0.7rem',
                    fontFamily: "'Crimson Pro', serif", fontSize: '0.88rem', fontWeight: 600,
                    cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    opacity: generating ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!generating) e.currentTarget.style.background = 'rgba(212,175,55,0.18)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)' }}
                >
                  {generating ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(212,175,55,0.3)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Generating PDF...
                    </span>
                  ) : '📄 Download Legal Notice PDF'}
                </button>

                <a href={`/case/${selected.id}`} target="_blank" style={{
                  display: 'block', textAlign: 'center', color: 'rgba(251,249,245,0.32)',
                  fontSize: '0.82rem', textDecoration: 'none', padding: '0.4rem',
                  letterSpacing: '0.04em', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#D4AF37')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(251,249,245,0.32)')}
                >
                  View Case Status Page ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
