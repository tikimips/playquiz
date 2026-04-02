'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const COLORS = ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#dc2626','#db2777','#0f172a']

const inputStyle: React.CSSProperties = {
  width:'100%', background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(0,0,0,0.12)',
  borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'1rem', color:'#1e1b4b',
  fontFamily:'var(--font-body)', outline:'none',
}

export default function NewQuizPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, cover_color: color }),
      })
      const quiz = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        setError(quiz.error || 'Failed to create quiz')
        return
      }
      router.push(`/quiz/${quiz.id}/edit`)
    } catch {
      setError('Failed to create quiz. Check your connection.')
    } finally {
      setLoading(false)
    }
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
          <Link href="/dashboard"
            style={{display:'flex', alignItems:'center', gap:'0.25rem', fontFamily:'var(--font-body)', fontSize:'0.9rem', fontWeight:600, color:'#7c3aed', textDecoration:'none'}}>
            <ChevronLeft size={16}/> Dashboard
          </Link>
        </div>
      </header>

      <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem 1rem'}}>
        <div style={{width:'100%', maxWidth:'460px'}}>
          <div style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'2rem', backdropFilter:'blur(8px)'}}>
            <h1 style={{fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, color:'#1e1b4b', marginBottom:'1.5rem'}}>New Quiz</h1>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
              <div>
                <label style={{fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:'0.5rem', display:'block', fontFamily:'var(--font-body)'}}>Title *</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. World History 101" style={inputStyle}/>
              </div>
              <div>
                <label style={{fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:'0.5rem', display:'block', fontFamily:'var(--font-body)'}}>Description</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional description" rows={2}
                  style={{...inputStyle, resize:'none'}}/>
              </div>
              <div>
                <label style={{fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', marginBottom:'0.75rem', display:'block', fontFamily:'var(--font-body)'}}>Cover Color</label>
                <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap'}}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} className="btn-spring"
                      style={{ width:'2.5rem', height:'2.5rem', borderRadius:'0.625rem', background: c, border:'none', cursor:'pointer', outline: color === c ? '3px solid #7c3aed' : 'none', outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>
              {error && <p style={{color:'#e91e8c', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-spring"
                style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'1rem', padding:'0.875rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', opacity: loading ? 0.5 : 1}}>
                {loading ? 'Creating...' : 'Create & Add Questions'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
