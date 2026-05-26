'use client'

export default function NavBar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(11,12,16,0.96)',
      borderBottom: '1px solid rgba(212,175,55,0.1)',
      backdropFilter: 'blur(14px)',
      padding: '1rem 2.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: "'Crimson Pro', serif",
    }}>
      <a href="/" style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.45rem', fontWeight: 700,
        color: '#D4AF37', textDecoration: 'none', letterSpacing: '0.02em',
      }}>
        NyayaTech
        <span style={{ color: 'rgba(251,249,245,0.45)', fontWeight: 400, fontSize: '0.82rem', marginLeft: '0.5rem', verticalAlign: 'middle' }}>
          ODR Platform
        </span>
      </a>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <a href="/file-case" className="nav-link">File a Case</a>
        <a href="/dashboard" className="nav-link">Dashboard</a>
        <a href="/file-case" className="btn-gold" style={{ padding: '0.5rem 1.3rem', fontSize: '0.9rem' }}>
          File Dispute →
        </a>
      </div>
      <style>{`
        .nav-link {
          color: rgba(251,249,245,0.65);
          text-decoration: none;
          font-size: 0.92rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #D4AF37; }
      `}</style>
    </nav>
  )
}
