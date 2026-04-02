'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sounds } from '@/lib/sounds'
import type { Game, Player, Question, Option } from '@/lib/types'
import { Users, Play, ChevronRight, Trophy, Copy } from 'lucide-react'
import Link from 'next/link'

const OPTION_COLORS = ['#ef4444','#3b82f6','#eab308','#22c55e']
const OPTION_SHAPES = ['▲','◆','●','■']

type QuestionWithOptions = Question & { options: Option[] }

export default function HostPage() {
  const params = useParams()
  const gameId = params.gameId as string
  const router = useRouter()
  const supabase = createClient()

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerIds, setNewPlayerIds] = useState<Set<string>>(new Set())
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [currentQ, setCurrentQ] = useState<QuestionWithOptions | null>(null)
  const [currentQIdx, setCurrentQIdx] = useState(-1)
  const [timeLeft, setTimeLeft] = useState(0)
  const [phase, setPhase] = useState<'lobby'|'question'|'results'|'ended'>('lobby')
  const [responseCounts, setResponseCounts] = useState<Record<string,number>>({})
  const [copied, setCopied] = useState(false)
  const prevPlayerCount = useRef(0)
  const bcRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    loadGame()
    const playerPoll = setInterval(async () => {
      const { data } = await supabase.from('players').select('*').eq('game_id', gameId)
      if (data) {
        setPlayers(prev => {
          if (data.length > prev.length) {
            sounds.join()
            const prevIds = new Set(prev.map(p => p.id))
            const incoming = data.filter(p => !prevIds.has(p.id))
            setNewPlayerIds(ids => { const n = new Set(ids); incoming.forEach(p => n.add(p.id)); return n })
            setTimeout(() => setNewPlayerIds(ids => { const n = new Set(ids); incoming.forEach(p => n.delete(p.id)); return n }), 600)
          }
          return data
        })
      }
    }, 2000)

    const resPoll = setInterval(async () => {
      const { data } = await supabase.from('responses').select('option_id').eq('game_id', gameId)
      if (data) {
        const counts: Record<string, number> = {}
        for (const r of data) { if (r.option_id) counts[r.option_id] = (counts[r.option_id] || 0) + 1 }
        setResponseCounts(counts)
      }
    }, 2000)

    const bc = supabase.channel(`game:${gameId}`)
    bc.subscribe(status => { if (status === 'SUBSCRIBED') bcRef.current = bc })

    return () => {
      clearInterval(playerPoll); clearInterval(resPoll); supabase.removeChannel(bc)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  async function loadGame() {
    const { data: g } = await supabase.from('games').select('*, quiz:quizzes(*)').eq('id', gameId).single()
    if (!g) { router.push('/dashboard'); return }
    setGame(g as Game)
    const { data: ps } = await supabase.from('players').select('*').eq('game_id', gameId)
    setPlayers(ps || [])
    const { data: qs } = await supabase.from('questions').select('*, options(*)').eq('quiz_id', g.quiz_id).order('order_index')
    const sorted = (qs || []).map((q: QuestionWithOptions) => ({ ...q, options: (q.options||[]).sort((a: Option, b: Option) => a.order_index - b.order_index) }))
    setQuestions(sorted)
  }

  async function startGame() {
    sounds.click()
    await supabase.from('games').update({ status: 'active' }).eq('id', gameId)
    await showQuestion(0)
  }

  async function showQuestion(idx: number) {
    const q = questions[idx]
    if (!q) return
    setCurrentQ(q); setCurrentQIdx(idx); setResponseCounts({}); setPhase('question'); setTimeLeft(q.time_limit)
    await supabase.from('games').update({ current_question_index: idx, question_started_at: new Date().toISOString(), status: 'active' }).eq('id', gameId)
    bcRef.current?.send({ type:'broadcast', event:'question:start', payload:{ questionIndex:idx, questionText:q.text, imageUrl:q.image_url||null, timeLimit:q.time_limit, options:q.options.map(o=>({id:o.id,text:o.text,order_index:o.order_index})) }})
    let t = q.time_limit
    const interval = setInterval(() => {
      t--; setTimeLeft(t)
      if (t <= 5) sounds.tick()
      if (t <= 0) { clearInterval(interval); endQuestion(q) }
    }, 1000)
  }

  async function endQuestion(q: QuestionWithOptions) {
    setPhase('results')
    const correctOpt = q.options.find(o => o.is_correct)
    bcRef.current?.send({ type:'broadcast', event:'question:end', payload:{ correctOptionId:correctOpt?.id }})
    const { data: pls } = await supabase.from('players').select('*').eq('game_id', gameId).order('score', { ascending: false })
    setPlayers(pls || [])
  }

  async function nextQuestion() {
    sounds.click()
    const nextIdx = currentQIdx + 1
    if (nextIdx >= questions.length) await endGame(); else await showQuestion(nextIdx)
  }

  async function endGame() {
    setPhase('ended'); sounds.complete()
    await supabase.from('games').update({ status: 'ended' }).eq('id', gameId)
    bcRef.current?.send({ type:'broadcast', event:'game:end', payload:{} })
    const { data: pls } = await supabase.from('players').select('*').eq('game_id', gameId).order('score', { ascending: false })
    setPlayers(pls || [])
  }

  function copyPin() {
    navigator.clipboard.writeText(game?.pin || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (!game) return <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontFamily:'var(--font-body)'}}>Loading...</div>

  const card: React.CSSProperties = {background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', backdropFilter:'blur(8px)'}

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)'}}>
      {/* Header */}
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'1200px', margin:'0 auto', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <span style={{fontFamily:'var(--font-logo)', fontSize:'1.5rem', letterSpacing:'0.02em', color:'#1e1b4b'}}>
              PLAY<span style={{color:'#e91e8c'}}>QUIZ</span>
            </span>
          </Link>
          {phase !== 'ended' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'#9ca3af', marginBottom:'2px', fontFamily:'var(--font-body)'}}>Game PIN</div>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <span style={{fontSize:'1.75rem', fontWeight:900, letterSpacing:'0.1em', color:'#1e1b4b', fontFamily:'var(--font-display)'}}>{game.pin}</span>
                <button onClick={copyPin} style={{background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center'}}><Copy size={16}/></button>
                {copied && <span style={{color:'#15803d', fontSize:'0.75rem', fontFamily:'var(--font-body)'}}>Copied!</span>}
              </div>
            </div>
          )}
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', color:'#6b7280', fontFamily:'var(--font-body)'}}>
            <Users size={16}/><span>{players.length}</span>
          </div>
        </div>
      </header>

      <div style={{maxWidth:'1200px', margin:'0 auto', padding:'2.5rem 2rem', display:'flex', flexDirection:'column', alignItems:'center'}}>

        {/* LOBBY */}
        {phase === 'lobby' && (
          <div style={{textAlign:'center', width:'100%', maxWidth:'720px'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🎯</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:800, color:'#1e1b4b', marginBottom:'0.5rem'}}>
              {(game as Game & { quiz?: { title: string } }).quiz?.title}
            </h2>
            <p style={{color:'#6b7280', marginBottom:'2rem', fontFamily:'var(--font-body)'}}>
              Join at <strong style={{color:'#1e1b4b'}}>playquiz.ai</strong> with PIN <strong style={{color:'#e91e8c', fontSize:'1.1rem'}}>{game.pin}</strong>
            </p>
            <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem', justifyContent:'center', marginBottom:'2rem'}}>
              {players.map(p => (
                <span key={p.id}
                  className={newPlayerIds.has(p.id) ? 'slide-in' : ''}
                  style={{padding:'0.5rem 1rem', borderRadius:'9999px', fontWeight:600, fontSize:'0.875rem', color:'white', background: p.avatar_color, fontFamily:'var(--font-body)'}}>
                  {p.nickname}
                </span>
              ))}
            </div>
            <p style={{color:'#9ca3af', fontSize:'0.875rem', marginBottom:'1.5rem', fontFamily:'var(--font-body)'}}>{players.length} player{players.length !== 1 ? 's' : ''} ready</p>
            <button onClick={startGame} disabled={players.length === 0} className="btn-spring"
              style={{display:'inline-flex', alignItems:'center', gap:'0.5rem', background: players.length > 0 ? '#7c3aed' : '#9ca3af', color:'white', fontFamily:'var(--font-body)', fontWeight:700, padding:'1rem 2rem', borderRadius:'1rem', border:'none', cursor: players.length > 0 ? 'pointer' : 'not-allowed', fontSize:'1.1rem', boxShadow: players.length > 0 ? '0 0 30px rgba(124,58,237,0.35)' : 'none'}}>
              <Play size={22}/> Start Game
            </button>
          </div>
        )}

        {/* QUESTION */}
        {phase === 'question' && currentQ && (
          <div style={{width:'100%', maxWidth:'900px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <span style={{color:'#6b7280', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>Question {currentQIdx + 1} of {questions.length}</span>
              <div style={{fontSize:'2.5rem', fontWeight:900, fontFamily:'var(--font-display)', color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#d97706' : '#1e1b4b'}}
                className={timeLeft <= 5 ? 'timer-urgent' : ''}>{timeLeft}s</div>
            </div>
            <div style={{...card, padding:'2rem', marginBottom:'1.5rem', textAlign:'center'}}>
              {currentQ.image_url && <img src={currentQ.image_url} alt="" style={{width:'100%', maxHeight:'16rem', objectFit:'contain', borderRadius:'0.75rem', marginBottom:'1rem'}}/>}
              <p style={{fontSize:'1.5rem', fontWeight:700, color:'#1e1b4b', fontFamily:'var(--font-display)'}}>{currentQ.text}</p>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
              {currentQ.options.map((opt, i) => (
                <div key={opt.id} style={{borderRadius:'1rem', padding:'1.25rem', background: OPTION_COLORS[i], color:'white', fontWeight:700, fontSize:'1.1rem', display:'flex', alignItems:'center', gap:'0.75rem'}}>
                  <span style={{fontSize:'1.5rem'}}>{OPTION_SHAPES[i]}</span>
                  <span style={{flex:1}}>{opt.text}</span>
                  <span style={{background:'rgba(0,0,0,0.2)', padding:'0.25rem 0.75rem', borderRadius:'9999px', fontSize:'0.875rem'}}>{responseCounts[opt.id] || 0}</span>
                </div>
              ))}
            </div>
            <div style={{textAlign:'center', color:'#9ca3af', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>{Object.values(responseCounts).reduce((a,b)=>a+b,0)} / {players.length} answered</div>
          </div>
        )}

        {/* RESULTS */}
        {phase === 'results' && currentQ && (
          <div style={{width:'100%', maxWidth:'900px'}}>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, color:'#1e1b4b', textAlign:'center', marginBottom:'1.5rem'}}>Results</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem'}}>
              {currentQ.options.map((opt, i) => (
                <div key={opt.id} style={{borderRadius:'1rem', padding:'1.25rem', background: OPTION_COLORS[i], color:'white', fontWeight:700, fontSize:'1.1rem', display:'flex', alignItems:'center', gap:'0.75rem', opacity: opt.is_correct ? 1 : 0.4, outline: opt.is_correct ? '3px solid #a3e635' : 'none', outlineOffset:2}}>
                  <span style={{fontSize:'1.5rem'}}>{OPTION_SHAPES[i]}</span>
                  <span style={{flex:1}}>{opt.text}</span>
                  {opt.is_correct && <span style={{color:'#a3e635'}}>✓</span>}
                  <span style={{background:'rgba(0,0,0,0.2)', padding:'0.25rem 0.75rem', borderRadius:'9999px', fontSize:'0.875rem'}}>{responseCounts[opt.id] || 0}</span>
                </div>
              ))}
            </div>
            <div style={{...card, padding:'1.5rem', marginBottom:'1.5rem'}}>
              <h3 style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'#9ca3af', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem', fontFamily:'var(--font-body)'}}>
                <Trophy size={14}/> Top Players
              </h3>
              {players.slice(0,5).map((p,i) => (
                <div key={p.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.625rem 0', borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.06)' : 'none'}}>
                  <span style={{color:'#9ca3af', width:'1.5rem', fontFamily:'var(--font-body)'}}>{i+1}</span>
                  <span style={{fontWeight:600, flex:1, marginLeft:'0.5rem', color:'#1e1b4b', fontFamily:'var(--font-body)'}}>{p.nickname}</span>
                  <span style={{color:'#7c3aed', fontWeight:700, fontFamily:'var(--font-body)'}}>{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button onClick={nextQuestion} className="btn-spring"
              style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, padding:'1rem', borderRadius:'1rem', border:'none', cursor:'pointer', fontSize:'1.1rem'}}>
              {currentQIdx >= questions.length - 1 ? 'View Final Results' : 'Next Question'} <ChevronRight size={22}/>
            </button>
          </div>
        )}

        {/* ENDED */}
        {phase === 'ended' && (
          <div style={{textAlign:'center', width:'100%', maxWidth:'480px'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🏆</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800, color:'#1e1b4b', marginBottom:'1.5rem'}}>Final Results!</h2>
            <div style={{...card, padding:'1.5rem', marginBottom:'1.5rem'}}>
              {players.slice(0,10).map((p,i) => (
                <div key={p.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0', borderBottom: i < players.slice(0,10).length-1 ? '1px solid rgba(0,0,0,0.06)' : 'none'}}>
                  <span style={{fontWeight:900, width:'2rem', fontFamily:'var(--font-display)', color: i===0?'#d97706':i===1?'#6b7280':i===2?'#b45309':'#9ca3af'}}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                  </span>
                  <span style={{fontWeight:600, flex:1, marginLeft:'0.5rem', color:'#1e1b4b', fontFamily:'var(--font-body)'}}>{p.nickname}</span>
                  <span style={{color:'#7c3aed', fontWeight:700, fontFamily:'var(--font-body)'}}>{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/dashboard')} className="btn-spring"
              style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, padding:'0.875rem 2rem', borderRadius:'1rem', border:'none', cursor:'pointer', fontSize:'1rem'}}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
