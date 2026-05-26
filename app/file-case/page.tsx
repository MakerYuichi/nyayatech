'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.45)', marginBottom: '0.45rem', fontFamily: "'Crimson Pro', serif" }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function FileCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    party_a_name: '', party_a_email: '', party_a_phone: '',
    party_b_name: '', party_b_email: '', party_b_phone: '', party_b_address: '',
    dispute_type: 'property', dispute_amount: '', dispute_description: '',
  })

  // Name fields get title-cased on blur; other fields stored as-is
  const NAME_FIELDS = new Set(['party_a_name', 'party_b_name'])
  const titleCase = (s: string) => s.replace(/\b\w/g, l => l.toUpperCase())

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const blur = (k: keyof typeof form) => () =>
    NAME_FIELDS.has(k) && setForm(f => ({ ...f, [k]: titleCase(f[k]) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone: strip non-digits, must be exactly 10
    if (form.party_a_phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number for yourself.')
      return
    }
    if (form.party_b_phone && form.party_b_phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number for the opposing party.')
      return
    }
    // Validate email format
    if (form.party_b_email && !form.party_b_email.includes('@')) {
      setError('Please enter a valid email address for the opposing party.')
      return
    }

    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.from('cases').insert([form]).select()
    if (err) {
      setError('Could not submit your case. Please check your connection and try again.')
      console.error(err)
      setLoading(false)
      return
    }
    router.push(`/case/${data[0].id}`)
  }

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(212,175,55,0.1)',
    borderRadius: '8px', padding: '2rem', marginBottom: '1.5rem',
  }

  return (
    <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", minHeight: '100vh', background: 'linear-gradient(180deg, #0B0C10 0%, #14171E 100%)', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '660px', margin: '0 auto' }}>

        {/* Header */}
        <div className="anim-fade-down" style={{ marginBottom: '3rem' }}>
          <span style={{ display: 'inline-block', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', padding: '0.3rem 1rem', borderRadius: '2px', marginBottom: '1.25rem' }}>
            Dispute Intake
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#FBF9F5', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            File Your Dispute
          </h1>
          <p style={{ color: 'rgba(251,249,245,0.58)', fontSize: '1.05rem', lineHeight: 1.65 }}>
            A trained paralegal will review your case within 24 hours and dispatch a formal legal notice under the Mediation Act, 2023.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* YOUR DETAILS */}
          <div style={sectionStyle} className="anim-fade-up anim-delay-1">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 600, color: '#D4AF37', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>👤</span> Your Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Full Name">
                <input className="nt-input" placeholder="e.g. Priya Sharma" required value={form.party_a_name} onChange={set('party_a_name')} onBlur={blur('party_a_name')} />
              </Field>
              <Field label="Email Address">
                <input className="nt-input" type="email" placeholder="you@example.com" required value={form.party_a_email} onChange={set('party_a_email')} />
              </Field>
              <Field label="Phone Number">
                <input className="nt-input" type="tel" placeholder="10-digit mobile number" required value={form.party_a_phone} onChange={set('party_a_phone')} />
              </Field>
            </div>
          </div>

          {/* OPPOSING PARTY */}
          <div style={sectionStyle} className="anim-fade-up anim-delay-2">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 600, color: '#D4AF37', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>⚖️</span> Opposing Party
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Their Full Name">
                <input className="nt-input" placeholder="e.g. Rajesh Kumar" required value={form.party_b_name} onChange={set('party_b_name')} onBlur={blur('party_b_name')} />
              </Field>
              <Field label="Their Email (if known)">
                <input className="nt-input" type="email" placeholder="them@example.com" value={form.party_b_email} onChange={set('party_b_email')} />
              </Field>
              <Field label="Their Phone (if known)">
                <input className="nt-input" type="tel" placeholder="10-digit mobile number" value={form.party_b_phone} onChange={set('party_b_phone')} />
              </Field>
              <Field label="Their Address (for Speed Post notice)">
                <textarea className="nt-input" style={{ height: '90px', resize: 'vertical' }} placeholder="Flat / House No., Street, City, State, PIN" value={form.party_b_address} onChange={set('party_b_address')} />
              </Field>
            </div>
          </div>

          {/* DISPUTE DETAILS */}
          <div style={sectionStyle} className="anim-fade-up anim-delay-3">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 600, color: '#D4AF37', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>📋</span> Dispute Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Dispute Type">
                <select className="nt-input" style={{ cursor: 'pointer' }} value={form.dispute_type} onChange={set('dispute_type')}>
                  <option value="property" style={{ background: '#14171E' }}>Property / Tenancy</option>
                  <option value="payment"  style={{ background: '#14171E' }}>Payment Default</option>
                  <option value="contract" style={{ background: '#14171E' }}>Contract Breach</option>
                  <option value="society"  style={{ background: '#14171E' }}>Society Dispute</option>
                </select>
              </Field>
              <Field label="Amount in Dispute (₹)">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(212,175,55,0.7)', fontWeight: 600, pointerEvents: 'none' }}>₹</span>
                  <input className="nt-input" style={{ paddingLeft: '2rem' }} type="number" placeholder="50000" required value={form.dispute_amount} onChange={set('dispute_amount')} />
                </div>
              </Field>
              <Field label="Describe Your Dispute">
                <textarea className="nt-input" style={{ height: '140px', resize: 'vertical' }} placeholder="Include dates, amounts, what happened, and what resolution you seek..." required value={form.dispute_description} onChange={set('dispute_description')} />
              </Field>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', color: '#FCA5A5', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? 'rgba(212,175,55,0.45)' : '#D4AF37',
              color: '#0B0C10', padding: '1rem', borderRadius: '4px', border: 'none',
              fontFamily: "'Crimson Pro', serif", fontSize: '1.1rem', fontWeight: 700,
              letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s', marginBottom: '1rem',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#F3E5AB'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,175,55,0.3)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = loading ? 'rgba(212,175,55,0.45)' : '#D4AF37'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(11,12,16,0.3)', borderTopColor: '#0B0C10', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Submitting Your Case...
              </span>
            ) : 'Submit My Case →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(251,249,245,0.28)', lineHeight: 1.55 }}>
            By submitting, you agree to our Terms of Service. NyayaTech does not provide legal advice and operates as a technology infrastructure provider under the Mediation Act, 2023.
          </p>
        </form>
      </div>
    </div>
  )
}
