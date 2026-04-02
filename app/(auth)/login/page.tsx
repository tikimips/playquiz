'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmed = searchParams.get('confirmed')
  const next = searchParams.get('next') || '/dashboard'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push(next)
  }

  return (
    <div style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'2rem', backdropFilter:'blur(8px)'}}>
      {confirmed && <p style={{color:'#15803d', fontSize:'0.875rem', marginBottom:'1rem', textAlign:'center', fontFamily:'var(--font-body)'}}>Account created! Sign in below.</p>}
      <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, marginBottom:'1.5rem', color:'#1e1b4b'}}>Sign in to host</h2>
      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'0.875rem'}}>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"
          style={{background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'1rem', color:'#1e1b4b', fontFamily:'var(--font-body)', outline:'none'}}/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"
          style={{background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'1rem', color:'#1e1b4b', fontFamily:'var(--font-body)', outline:'none'}}/>
        {error && <p style={{color:'#e91e8c', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-spring"
          style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'1rem', padding:'0.875rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', opacity: loading ? 0.5 : 1}}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <div style={{marginTop:'1rem', display:'flex', justifyContent:'space-between', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>
        <Link href="/forgot-password" style={{color:'#7c3aed', textDecoration:'underline'}}>Forgot password?</Link>
        <Link href="/signup" style={{color:'#7c3aed', textDecoration:'underline'}}>Sign up</Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)'}}>
      {/* Header — matches homepage */}
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <span style={{fontFamily:'var(--font-logo)', fontSize:'1.5rem', letterSpacing:'0.02em', color:'#1e1b4b'}}>
              PLAY<span style={{color:'#e91e8c'}}>QUIZ</span>
            </span>
          </Link>
          <Link href="/signup" style={{fontFamily:'var(--font-body)', fontSize:'0.9rem', fontWeight:600, color:'#7c3aed', border:'1px solid rgba(124,58,237,0.35)', background:'rgba(124,58,237,0.07)', padding:'0.5rem 1.25rem', borderRadius:'0.75rem', textDecoration:'none'}}>
            Sign up
          </Link>
        </div>
      </header>

      {/* Login form */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem 1rem', minHeight:'calc(100vh - 65px)'}}>
        <div style={{width:'100%', maxWidth:'380px'}}>
          <Suspense fallback={<div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-white/50">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
