'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const inputStyle: React.CSSProperties = {
  width:'100%', background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(0,0,0,0.12)',
  borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'1rem', color:'#1e1b4b',
  fontFamily:'var(--font-body)', outline:'none',
}

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Failed to reset password'); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (!token) return (
    <div style={{textAlign:'center'}}>
      <p style={{color:'#e91e8c', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>Invalid reset link.</p>
      <Link href="/forgot-password" style={{marginTop:'1rem', display:'inline-block', color:'#7c3aed', textDecoration:'underline', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>Request a new link</Link>
    </div>
  )

  if (done) return (
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:'2.5rem', marginBottom:'1rem'}}>✓</div>
      <p style={{color:'#15803d', fontWeight:600, fontFamily:'var(--font-body)'}}>Password updated!</p>
      <p style={{color:'#6b7280', fontSize:'0.875rem', marginTop:'0.5rem', fontFamily:'var(--font-body)'}}>Redirecting to login...</p>
    </div>
  )

  return (
    <>
      <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, color:'#1e1b4b', marginBottom:'1.5rem'}}>Set new password</h2>
      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'0.875rem'}}>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password (min 6 chars)" required style={inputStyle}/>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" required style={inputStyle}/>
        {error && <p style={{color:'#e91e8c', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-spring"
          style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'1rem', padding:'0.875rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', opacity: loading ? 0.5 : 1}}>
          {loading ? 'Saving...' : 'Set new password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
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
            <Suspense fallback={<p style={{color:'#6b7280', fontSize:'0.875rem', textAlign:'center', fontFamily:'var(--font-body)'}}>Loading...</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
