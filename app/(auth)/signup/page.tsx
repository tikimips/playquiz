'use client'
import { useState } from 'react'
import Link from 'next/link'

const AGE_RANGES = ['13–17', '18–24', '25–34', '35–44', '45–54', '55–64', '65+']
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const inputStyle: React.CSSProperties = {
  width:'100%', background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(0,0,0,0.12)',
  borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'1rem', color:'#1e1b4b',
  fontFamily:'var(--font-body)', outline:'none',
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [gender, setGender] = useState('')
  const [ageVerified, setAgeVerified] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ageRange) { setError('Please select your age range'); return }
    if (!gender) { setError('Please select your gender'); return }
    if (!ageVerified) { setError('You must confirm you are 13 or older to create an account'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ageRange, gender }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Signup failed'); return }
    window.location.href = '/login?confirmed=1'
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
        <div style={{width:'100%', maxWidth:'400px'}}>
          <div style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'2rem', backdropFilter:'blur(8px)'}}>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, marginBottom:'1.5rem', color:'#1e1b4b'}}>Create account</h2>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'0.875rem'}}>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required style={inputStyle}/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (min 6 chars)" required style={inputStyle}/>

              <div style={{position:'relative'}}>
                <select value={ageRange} onChange={e=>setAgeRange(e.target.value)}
                  style={{...inputStyle, appearance:'none', color: ageRange ? '#1e1b4b' : '#9ca3af'}}>
                  <option value="" disabled>Age range</option>
                  {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <span style={{pointerEvents:'none', position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', color:'#9ca3af'}}>▾</span>
              </div>

              <div style={{position:'relative'}}>
                <select value={gender} onChange={e=>setGender(e.target.value)}
                  style={{...inputStyle, appearance:'none', color: gender ? '#1e1b4b' : '#9ca3af'}}>
                  <option value="" disabled>Gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <span style={{pointerEvents:'none', position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', color:'#9ca3af'}}>▾</span>
              </div>

              <label style={{display:'flex', alignItems:'flex-start', gap:'0.75rem', cursor:'pointer'}}>
                <input type="checkbox" checked={ageVerified} onChange={e=>setAgeVerified(e.target.checked)}
                  style={{marginTop:'2px', width:'1rem', height:'1rem', accentColor:'#7c3aed', flexShrink:0}}/>
                <span style={{fontSize:'0.875rem', color:'#6b7280', lineHeight:1.5, fontFamily:'var(--font-body)'}}>I confirm that I am 13 years of age or older</span>
              </label>

              {error && <p style={{color:'#e91e8c', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>{error}</p>}

              <button type="submit" disabled={loading} className="btn-spring"
                style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'1rem', padding:'0.875rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', opacity: loading ? 0.5 : 1}}>
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </form>
            <p style={{marginTop:'1rem', textAlign:'center', fontSize:'0.875rem', color:'#6b7280', fontFamily:'var(--font-body)'}}>
              Have an account? <Link href="/login" style={{color:'#7c3aed', textDecoration:'underline'}}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
