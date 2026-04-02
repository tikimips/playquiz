'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Quiz } from '@/lib/types'
import { Plus, Play, Pencil, Trash2, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 6000)

    fetch('/api/quizzes', { signal: controller.signal })
      .then(async res => {
        clearTimeout(tid)
        if (res.status === 401) { router.push('/login'); return }
        const data = await res.json()
        if (data.error) { setQuizzes([]); return }
        setQuizzes(data || [])
        // Extract user info from session for header display
        supabase.auth.getSession().then(({ data: s }) => {
          if (s.session?.user) setUser(s.session.user)
        })
      })
      .catch(() => setQuizzes([]))
      .finally(() => { clearTimeout(tid); setLoading(false) })

    return () => { clearTimeout(tid); controller.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function deleteQuiz(id: string) {
    if (!confirm('Delete this quiz?')) return
    await supabase.from('quizzes').delete().eq('id', id)
    setQuizzes(q => q.filter(x => x.id !== id))
  }

  async function startGame(quizId: string) {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    })
    if (!res.ok) return
    const game = await res.json()
    if (game?.id) router.push(`/host/${game.id}`)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)'}}>
      {/* Header */}
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <span style={{fontFamily:'var(--font-logo)', fontSize:'1.5rem', letterSpacing:'0.02em', color:'#1e1b4b'}}>
              PLAY<span style={{color:'#e91e8c'}}>QUIZ</span>
            </span>
          </Link>
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <span style={{fontSize:'0.875rem', color:'#6b7280', fontFamily:'var(--font-body)'}}>{user?.email}</span>
            <button onClick={signOut} title="Sign out"
              style={{background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center'}}>
              <LogOut size={18}/>
            </button>
          </div>
        </div>
      </header>

      <div style={{maxWidth:'1100px', margin:'0 auto', padding:'2.5rem 2rem'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:800, color:'#1e1b4b'}}>My Quizzes</h1>
          <Link href="/quiz/new" className="btn-spring"
            style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:600, padding:'0.625rem 1.25rem', borderRadius:'0.75rem', textDecoration:'none', fontSize:'0.95rem'}}>
            <Plus size={18}/> New Quiz
          </Link>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:'5rem 0', color:'#9ca3af', fontFamily:'var(--font-body)'}}>Loading...</div>
        ) : quizzes.length === 0 ? (
          <div style={{textAlign:'center', padding:'5rem 0'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🎯</div>
            <p style={{color:'#6b7280', marginBottom:'1.5rem', fontFamily:'var(--font-body)'}}>No quizzes yet. Create your first one!</p>
            <Link href="/quiz/new" className="btn-spring"
              style={{display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:600, padding:'0.75rem 1.5rem', borderRadius:'0.75rem', textDecoration:'none'}}>
              <Plus size={18}/> Create Quiz
            </Link>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1.25rem'}}>
            {quizzes.map(q => (
              <div key={q.id} style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', overflow:'hidden', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column'}}>
                <div style={{height:'6rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', background: q.cover_color}}>
                  🎯
                </div>
                <div style={{padding:'1rem', display:'flex', flexDirection:'column', flex:1}}>
                  <h3 style={{fontFamily:'var(--font-display)', fontWeight:700, color:'#1e1b4b', marginBottom:'0.25rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{q.title}</h3>
                  {q.description && <p style={{fontSize:'0.875rem', color:'#6b7280', marginBottom:'0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-body)'}}>{q.description}</p>}
                  <div style={{display:'flex', gap:'0.5rem', marginTop:'auto', paddingTop:'0.75rem'}}>
                    <button onClick={() => startGame(q.id)} className="btn-spring"
                      style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.25rem', background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontSize:'0.875rem', fontWeight:600, padding:'0.5rem 0', borderRadius:'0.5rem', border:'none', cursor:'pointer'}}>
                      <Play size={14}/> Host
                    </button>
                    <Link href={`/quiz/${q.id}/edit`}
                      style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'0.5rem', background:'rgba(0,0,0,0.05)', borderRadius:'0.5rem', color:'#6b7280', textDecoration:'none'}}>
                      <Pencil size={14}/>
                    </Link>
                    <button onClick={() => deleteQuiz(q.id)}
                      style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'0.5rem', background:'rgba(0,0,0,0.05)', borderRadius:'0.5rem', border:'none', cursor:'pointer', color:'#9ca3af'}}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
