'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to send'); return }
    setSent(true)
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)'}}>
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <span style={{fontFamily:'var(--font-logo)', fontSize:'1.5rem', letterSpacing:'0.02em', color:'#1e1b4b'}}>
              PLAY<span style={{color:'#e91e8c'}}>QUIZ</span>
            </span>
          </Link>
          <Link href="/login" style={{fontFamily:'var(--font-body)', fontSize:'0.9rem', fontWeight:600, color:'#7c3aed', border:'1px solid rgba(124,58,237,0.35)', background:'rgba(124,58,237,0.07)', padding:'0.5rem 1.25rem', borderRadius:'0.75rem', textDecoration:'none'}}>
            Sign in
          </Link>
        </div>
      </header>

      <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem 1rem', minHeight:'calc(100vh - 65px)'}}>
        <div style={{width:'100%', maxWidth:'380px'}}>
          <div style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'2rem', backdropFilter:'blur(8px)'}}>
            {sent ? (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'1rem'}}>📬</div>
                <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, color:'#1e1b4b', marginBottom:'0.5rem'}}>Check your email</h2>
                <p style={{color:'#6b7280', fontSize:'0.875rem', marginBottom:'1.5rem', fontFamily:'var(--font-body)'}}>We sent a reset link to <strong style={{color:'#1e1b4b'}}>{email}</strong></p>
                <button onClick={() => { setSent(false); setEmail('') }}
                  style={{color:'#7c3aed', textDecoration:'underline', fontSize:'0.875rem', background:'none', border:'none', cursor:'pointer', display:'block', margin:'0 auto 0.75rem', fontFamily:'var(--font-body)'}}>
                  Resend link
                </button>
                <Link href="/login" style={{color:'#7c3aed', textDecoration:'underline', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>Back to login</Link>
              </div>
            ) : (
              <>
                <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, color:'#1e1b4b', marginBottom:'0.5rem'}}>Reset password</h2>
                <p style={{color:'#6b7280', fontSize:'0.875rem', marginBottom:'1.5rem', fontFamily:'var(--font-body)'}}>Enter your email and we'll send you a reset link.</p>
                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'0.875rem'}}>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required
                    style={{background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'1rem', color:'#1e1b4b', fontFamily:'var(--font-body)', outline:'none', width:'100%'}}/>
                  {error && <p style={{color:'#e91e8c', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>{error}</p>}
                  <button type="submit" disabled={loading} className="btn-spring"
                    style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'1rem', padding:'0.875rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', opacity: loading ? 0.5 : 1}}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </form>
                <p style={{marginTop:'1rem', textAlign:'center', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>
                  <Link href="/login" style={{color:'#7c3aed', textDecoration:'underline'}}>Back to login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
