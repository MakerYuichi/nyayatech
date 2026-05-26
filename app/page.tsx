'use client'
import { useEffect, useRef, useState } from 'react'

/* ── Animated counter hook ── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return value
}

/* ── Particle canvas ── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const GOLD = 'rgba(212,175,55,'
    const count = 80
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.5 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = GOLD + p.a + ')'
        ctx.fill()
      })
      // draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = GOLD + (0.08 * (1 - dist / 100)) + ')'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      opacity: 0.55, zIndex: 1, pointerEvents: 'none'
    }} />
  )
}

/* ── Reveal on scroll ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } })
    }, { threshold: 0.15 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ── Stats section with animated numbers ── */
function StatsSection() {
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); io.disconnect() } }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const c1 = useCountUp(55, 1600, started)
  const c2 = useCountUp(12, 1400, started)
  const c3 = useCountUp(14, 1200, started)
  const c4 = useCountUp(0, 800, started)

  return (
    <section ref={ref} style={{ background: '#D4AF37', padding: '3.5rem 2rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', textAlign: 'center' }}>
        {[
          { val: `${c1}M+`, label: 'Pending Court Cases in India' },
          { val: `7–${c2}`, label: 'Years Average Resolution Time' },
          { val: `${c3} Days`, label: 'Our Mediation Window' },
          { val: `₹${c4}`, label: 'Upfront Legal Fees' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#0B0C10', lineHeight: 1, marginBottom: '0.4rem' }}>{s.val}</div>
            <div style={{ color: 'rgba(10,15,30,0.65)', fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  useReveal()

  return (
    <div style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: '92vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '6rem 2rem 4rem', overflow: 'hidden',
      }}>
        {/* Photo background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `linear-gradient(rgba(11,12,16,0.55), rgba(11,12,16,0.78)), url('/law.jpg') center/cover no-repeat`,
          filter: 'brightness(0.9) contrast(1.08) saturate(1.1)',
        }} />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(212,175,55,0.09) 0%, transparent 70%)',
        }} />
        {/* Particles */}
        <ParticleCanvas />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '860px' }}>
          <div className="anim-fade-down" style={{
            display: 'inline-block', fontFamily: "'Crimson Pro', serif",
            fontSize: '0.8rem', letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#D4AF37', border: '1px solid rgba(212,175,55,0.35)',
            padding: '0.4rem 1.2rem', borderRadius: '2px', marginBottom: '2rem',
          }}>
            India's First AI-Assisted Online Dispute Resolution Platform
          </div>

          <h1 className="anim-fade-up anim-delay-1" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(3rem, 7.5vw, 5.8rem)', fontWeight: 900, lineHeight: 1.05,
            color: '#FBF9F5', marginBottom: '1.5rem',
          }}>
            Justice Shouldn't<br />Take <em style={{ color: '#D4AF37', fontStyle: 'italic' }}>20 Years.</em>
          </h1>

          <p className="anim-fade-up anim-delay-2" style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: 'rgba(251,249,245,0.72)',
            maxWidth: '560px', margin: '0 auto 2.5rem', fontWeight: 300, lineHeight: 1.7,
          }}>
            India has <strong style={{ color: '#D4AF37', fontWeight: 600 }}>55 million pending court cases.</strong> Yours doesn't have to be one of them.
          </p>

          <div className="anim-fade-up anim-delay-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <a href="/file-case" className="btn-gold">File My Dispute →</a>
            <a href="/dashboard" className="btn-outline">Paralegal Dashboard</a>
          </div>

          <div className="anim-fade-up anim-delay-4" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Mediation Act 2023 Compliant', 'Human-in-the-Loop Verified', 'PDF Notice Generation', '24hr Paralegal Review'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.5)' }}>
                <span style={{ color: '#D4AF37', fontSize: '0.9rem' }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.45 }}>
          <div style={{ width: '22px', height: '36px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '11px', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)',
              width: '3px', height: '6px', background: '#D4AF37', borderRadius: '2px',
              animation: 'scrollDot 1.8s ease infinite',
            }} />
          </div>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.5)' }}>Scroll</span>
        </div>
      </section>

      <style>{`
        @keyframes scrollDot {
          0%  { top: 5px;  opacity: 1; }
          80% { top: 18px; opacity: 0; }
          100%{ top: 5px;  opacity: 0; }
        }
      `}</style>

      <div className="gradient-divider" />

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: '#14171E', padding: '7rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <span style={{ fontSize: '0.76rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4AF37', display: 'block', marginBottom: '1rem' }}>The Process</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, color: '#FBF9F5' }}>
              Four Steps. One Resolution.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              { num: '01', icon: '📋', title: 'File Your Case', desc: 'Fill in your details, the opposing party, dispute type, and amount. Takes under 5 minutes.', href: '/file-case', cta: 'File Now →', delay: '0s' },
              { num: '02', icon: '🔍', title: 'Paralegal Review', desc: 'A trained paralegal reviews your case within 24 hours, verifies details, and flags any issues.', href: '/dashboard', cta: 'View Dashboard →', delay: '0.15s' },
              { num: '03', icon: '📬', title: 'Legal Notice Sent', desc: 'A formal notice under the Mediation Act 2023 is generated and dispatched to the opposing party.', href: null, cta: null, delay: '0.3s' },
              { num: '04', icon: '⚖️', title: 'Track & Resolve', desc: 'Monitor your case status in real time. From submission to mediation to resolution.', href: null, cta: null, delay: '0.45s' },
            ].map(step => (
              <div key={step.num} className="glass-card reveal" style={{ padding: '2.5rem 2rem', position: 'relative', transitionDelay: step.delay }}>
                <div style={{
                  position: 'absolute', top: '-1px', right: '1.5rem',
                  fontFamily: "'Playfair Display', serif", fontSize: '4.5rem', fontWeight: 900,
                  color: 'rgba(212,175,55,0.06)', lineHeight: 1, pointerEvents: 'none',
                }}>{step.num}</div>
                <div style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>{step.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#D4AF37', marginBottom: '0.75rem' }}>{step.title}</h3>
                <p style={{ color: 'rgba(251,249,245,0.62)', fontSize: '0.95rem', lineHeight: 1.65 }}>{step.desc}</p>
                {step.href && (
                  <a href={step.href} style={{ display: 'inline-block', marginTop: '1.25rem', color: '#D4AF37', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.04em', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >{step.cta}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANIMATED STATS ── */}
      <StatsSection />

      {/* ── DISPUTE TYPES ── */}
      <section style={{ background: '#0B0C10', padding: '7rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.76rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4AF37', display: 'block', marginBottom: '1rem' }}>We Handle</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, color: '#FBF9F5' }}>
              All Types of Civil Disputes
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '🏠', title: 'Property & Tenancy', desc: 'Rent disputes, eviction, property damage' },
              { icon: '💰', title: 'Payment Default', desc: 'Unpaid invoices, loan recovery, dues' },
              { icon: '📝', title: 'Contract Breach', desc: 'Service agreements, vendor disputes' },
              { icon: '🏢', title: 'Society Disputes', desc: 'Maintenance, parking, common areas' },
            ].map((d, i) => (
              <div key={d.title} className="glass-card reveal" style={{ padding: '2rem', textAlign: 'center', transitionDelay: `${i * 0.1}s`, cursor: 'pointer' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{d.icon}</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', color: '#FBF9F5', marginBottom: '0.5rem' }}>{d.title}</h3>
                <p style={{ color: 'rgba(251,249,245,0.5)', fontSize: '0.88rem' }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '7rem 2rem', textAlign: 'center',
        background: 'linear-gradient(135deg, #8B6914 0%, #D4AF37 40%, #E2BC6A 70%, #C9A84C 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 700, color: '#0B0C10', marginBottom: '1rem' }}>
            Ready to Resolve Your Dispute?
          </h2>
          <p style={{ color: 'rgba(10,15,30,0.7)', fontSize: '1.15rem', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem' }}>
            File your case in under 5 minutes. A paralegal will review it within 24 hours.
          </p>
          <a href="/file-case" style={{
            background: '#0B0C10', color: '#D4AF37',
            padding: '1rem 2.5rem', borderRadius: '4px',
            fontFamily: "'Crimson Pro', serif", fontSize: '1.1rem', fontWeight: 700,
            textDecoration: 'none', letterSpacing: '0.05em', display: 'inline-block',
            border: '2px solid #0B0C10', transition: 'all 0.25s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#14171E'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0B0C10'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            File My Dispute Now →
          </a>
        </div>
      </section>
    </div>
  )
}
