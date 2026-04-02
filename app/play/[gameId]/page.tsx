'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sounds } from '@/lib/sounds'
import type { Player, Option } from '@/lib/types'
import Link from 'next/link'

const OPTION_COLORS = ['#ef4444','#3b82f6','#eab308','#22c55e']
const OPTION_SHAPES = ['▲','◆','●','■']

interface ActiveQuestion {
  index: number; id: string; text: string; imageUrl: string | null
  timeLimit: number; options: { id: string; text: string; order_index: number; is_correct: boolean }[]
}

function fireConfetti() {
  import('canvas-confetti').then(({ default: confetti }) => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#7c3aed','#22d3ee','#a3e635','#fb7185','#fbbf24'] })
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } }), 300)
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } }), 500)
  })
}

function ScoreDisplay({ score }: { score: number }) {
  const [display, setDisplay] = useState(score)
  const [ticking, setTicking] = useState(false)
  const prev = useRef(score)

  useEffect(() => {
    if (score !== prev.current) {
      setTicking(true)
      setTimeout(() => { setDisplay(score); setTicking(false) }, 200)
      prev.current = score
    }
  }, [score])

  return (
    <div className={`font-black text-xl transition-colors ${ticking ? 'score-tick' : ''}`} style={{color:'#7c3aed', fontFamily:'var(--font-display)'}}>
      {display.toLocaleString()}
    </div>
  )
}

export default function PlayPage() {
  const params = useParams()
  const gameId = params.gameId as string
  const supabase = createClient()

  const [player, setPlayer] = useState<Player | null>(null)
  const [joining, setJoining] = useState(false)
  const [nickname, setNickname] = useState('')
  const [joinError, setJoinError] = useState('')

  const [phase, setPhase] = useState<'waiting'|'question'|'answered'|'results'|'ended'>('waiting')
  const [activeQ, setActiveQ] = useState<ActiveQuestion | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [score, setScore] = useState(0)
  const [pointsEarned, setPointsEarned] = useState<number | null>(null)

  const phaseRef = useRef(phase)
  const lastQIndexRef = useRef(-1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    const playerId = localStorage.getItem('playquiz_player_id')
    if (!playerId) return
    supabase.from('players').select('*').eq('id', playerId).single().then(({ data }) => {
      if (!data || data.game_id !== gameId) return
      setPlayer(data); setScore(data.score)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  useEffect(() => {
    if (!player) return
    const poll = setInterval(async () => {
      const { data: game } = await supabase
        .from('games').select('status,current_question_index,question_started_at,quiz_id')
        .eq('id', gameId).single()
      if (!game) return
      if (game.status === 'ended' && phaseRef.current !== 'ended') {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase('ended'); sounds.complete(); fireConfetti()
        return
      }
      const qIdx = game.current_question_index
      if (qIdx < 0 || qIdx === lastQIndexRef.current) return
      lastQIndexRef.current = qIdx
      const { data: q } = await supabase
        .from('questions').select('id,text,image_url,time_limit,options(*)')
        .eq('quiz_id', game.quiz_id).eq('order_index', qIdx).single()
      if (!q) return
      const opts = ((q.options as Option[]) || []).sort((a, b) => a.order_index - b.order_index)
      const elapsed = Math.floor((Date.now() - new Date(game.question_started_at!).getTime()) / 1000)
      const remaining = Math.max(0, q.time_limit - elapsed)
      if (timerRef.current) clearInterval(timerRef.current)
      setActiveQ({ index: qIdx, id: q.id, text: q.text, imageUrl: q.image_url || null, timeLimit: q.time_limit,
        options: opts as ActiveQuestion['options'] })
      setSelectedOption(null); setPointsEarned(null); setPhase('question'); setTimeLeft(remaining)
      let t = remaining
      timerRef.current = setInterval(() => {
        t--; setTimeLeft(t)
        if (t <= 5 && t > 0) sounds.tick()
        if (t <= 0) { clearInterval(timerRef.current!); setPhase(p => (p === 'question' || p === 'answered') ? 'results' : p) }
      }, 1000)
    }, 2000)
    return () => { clearInterval(poll); if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, player])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) return
    setJoining(true); setJoinError('')
    const { data: game } = await supabase.from('games').select('id,status').eq('id', gameId).single()
    if (!game || game.status === 'ended') { setJoinError('This game is no longer active.'); setJoining(false); return }
    const { data: p, error: err } = await supabase.from('players')
      .insert({ game_id: gameId, nickname: nickname.trim(), avatar_color: '#7c3aed' }).select().single()
    setJoining(false)
    if (err || !p) { setJoinError('Could not join. Try again.'); return }
    localStorage.setItem('playquiz_player_id', p.id)
    sounds.join(); setPlayer(p); setScore(p.score)
  }

  async function submitAnswer(optionId: string) {
    if (phase !== 'question' || !player || !activeQ) return
    setSelectedOption(optionId); setPhase('answered')
    const opt = activeQ.options.find(o => o.id === optionId)
    if (!opt) return
    const isCorrect = opt.is_correct
    const points = isCorrect ? Math.round(1000 * (0.5 + 0.5 * Math.max(0, timeLeft / activeQ.timeLimit))) : 0
    if (isCorrect) sounds.correct(); else sounds.wrong()
    setPointsEarned(points)
    const newScore = score + points
    setScore(newScore)
    await supabase.from('responses').insert({ game_id: gameId, question_id: activeQ.id, player_id: player.id,
      option_id: optionId, response_time_ms: (activeQ.timeLimit - timeLeft) * 1000, points_earned: points, is_correct: isCorrect })
    if (points > 0) await supabase.from('players').update({ score: newScore }).eq('id', player.id)
  }

  // JOIN SCREEN
  if (!player) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)'}}>
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', padding:'1rem 2rem'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <span style={{fontFamily:'var(--font-logo)', fontSize:'1.5rem', letterSpacing:'0.02em', color:'#1e1b4b'}}>
              PLAY<span style={{color:'#e91e8c'}}>QUIZ</span>
            </span>
          </Link>
        </div>
      </header>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem 1rem', minHeight:'calc(100vh - 65px)'}}>
        <div style={{width:'100%', maxWidth:'360px'}}>
          <div style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'2rem', backdropFilter:'blur(8px)'}}>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, color:'#1e1b4b', marginBottom:'1.5rem'}}>Enter your name</h2>
            <form onSubmit={handleJoin} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <input value={nickname} onChange={e => { setNickname(e.target.value.slice(0,20)); setJoinError('') }}
                placeholder="e.g. QuizWizard99" autoFocus maxLength={20}
                style={{background:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:'0.75rem', padding:'0.875rem 1rem', fontSize:'1.25rem', fontWeight:700, textAlign:'center', color:'#1e1b4b', fontFamily:'var(--font-body)', outline:'none', width:'100%'}}
                onFocus={() => sounds.hover()}/>
              {joinError && <p style={{color:'#e91e8c', fontSize:'0.875rem', textAlign:'center', fontFamily:'var(--font-body)'}}>{joinError}</p>}
              <button type="submit" disabled={joining || !nickname.trim()} className="btn-spring"
                style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'1rem', padding:'1rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', opacity: (joining || !nickname.trim()) ? 0.4 : 1}}
                onMouseEnter={() => sounds.hover()}>
                {joining ? 'Joining...' : 'Join Game'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )

  const correctOptionId = activeQ?.options.find(o => o.is_correct)?.id ?? null
  const isCorrect = !!selectedOption && selectedOption === correctOptionId
  const didAnswer = !!selectedOption

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)'}}>
      {/* Top bar */}
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'600px', margin:'0 auto', padding:'0.75rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', fontFamily:'var(--font-body)'}}>Playing as</div>
            <div style={{fontWeight:700, color:'#1e1b4b', fontFamily:'var(--font-body)'}}>{player.nickname}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', fontFamily:'var(--font-body)'}}>Score</div>
            <ScoreDisplay score={score} />
          </div>
        </div>
      </header>

      <div style={{maxWidth:'600px', margin:'0 auto', padding:'2rem 1.25rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 65px)'}}>

        {/* WAITING */}
        {phase === 'waiting' && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem', animation:'float-a 3s ease-in-out infinite'}}>🎮</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, color:'#1e1b4b', marginBottom:'0.5rem'}}>Get ready!</h2>
            <p style={{color:'#6b7280', fontFamily:'var(--font-body)'}}>Waiting for the host to start...</p>
          </div>
        )}

        {/* QUESTION */}
        {phase === 'question' && activeQ && (
          <div style={{width:'100%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <span style={{color:'#9ca3af', fontSize:'0.875rem', fontFamily:'var(--font-body)'}}>Q{activeQ.index + 1}</span>
              <span className={timeLeft <= 5 ? 'timer-urgent' : ''}
                style={{fontSize:'2rem', fontWeight:900, fontFamily:'var(--font-display)', color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#d97706' : '#1e1b4b'}}>{timeLeft}</span>
            </div>
            <div style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'1.5rem', marginBottom:'1.5rem', textAlign:'center', backdropFilter:'blur(8px)'}}>
              {activeQ.imageUrl && <img src={activeQ.imageUrl} alt="" style={{width:'100%', maxHeight:'12rem', objectFit:'contain', borderRadius:'0.75rem', marginBottom:'1rem'}}/>}
              <p style={{fontSize:'1.2rem', fontWeight:700, color:'#1e1b4b', fontFamily:'var(--font-display)'}}>{activeQ.text}</p>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>
              {activeQ.options.map((opt, i) => (
                <button key={opt.id} onClick={() => submitAnswer(opt.id)} className="btn-spring"
                  style={{borderRadius:'1rem', padding:'1.25rem', color:'white', fontWeight:700, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', background: OPTION_COLORS[i], border:'none', cursor:'pointer'}}
                  onMouseEnter={() => sounds.hover()}>
                  <span style={{fontSize:'1.75rem'}}>{OPTION_SHAPES[i]}</span>
                  <span style={{fontSize:'0.9rem', fontFamily:'var(--font-body)'}}>{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ANSWERED */}
        {phase === 'answered' && (
          <div className="text-center result-in" style={{textAlign:'center'}}>
            <div style={{fontSize:'4.5rem', marginBottom:'1.5rem'}}>🤞</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:800, color:'#1e1b4b', marginBottom:'0.75rem'}}>Good luck on that answer!</h2>
            <p style={{color:'#9ca3af', fontSize:'0.875rem', fontFamily:'var(--font-body)'}} className="animate-pulse">Waiting for time to run out...</p>
          </div>
        )}

        {/* RESULTS — full-screen colored splash, keeps its own dark styling */}
        {phase === 'results' && activeQ && (
          <div className={`fixed inset-0 flex flex-col items-center justify-center p-6 text-center result-in ${isCorrect ? 'bg-green-600' : didAnswer ? 'bg-rose-700' : 'bg-yellow-600'}`}>
            <div style={{fontSize:'4.5rem', marginBottom:'1.5rem'}}>{isCorrect ? '🎉' : didAnswer ? '😬' : '⏰'}</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'2.25rem', fontWeight:900, color:'white', marginBottom:'0.75rem'}}>
              {isCorrect ? 'Correct!' : didAnswer ? "Nope, that's not it." : 'Too slow!'}
            </h2>
            {isCorrect && pointsEarned !== null && (
              <div style={{fontSize:'1.5rem', fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:'0.5rem', fontFamily:'var(--font-body)'}}>+{pointsEarned.toLocaleString()} pts</div>
            )}
            <div style={{marginTop:'1.5rem', background:'rgba(0,0,0,0.2)', borderRadius:'1rem', padding:'1.5rem 2rem'}}>
              <div style={{color:'rgba(255,255,255,0.6)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.25rem', fontFamily:'var(--font-body)'}}>Total Score</div>
              <div style={{fontSize:'2.5rem', fontWeight:900, color:'white', fontFamily:'var(--font-display)'}}>{score.toLocaleString()}</div>
            </div>
            <p style={{marginTop:'2rem', color:'rgba(255,255,255,0.5)', fontSize:'0.875rem', fontFamily:'var(--font-body)'}} className="animate-pulse">Waiting for next question...</p>
          </div>
        )}

        {/* ENDED */}
        {phase === 'ended' && (
          <div className="result-in" style={{textAlign:'center', width:'100%', maxWidth:'360px'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🏆</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:800, color:'#1e1b4b', marginBottom:'0.5rem'}}>Game Over!</h2>
            <div style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'1.5rem', marginBottom:'1.5rem', backdropFilter:'blur(8px)'}}>
              <div style={{color:'#9ca3af', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.25rem', fontFamily:'var(--font-body)'}}>Your Final Score</div>
              <div style={{fontSize:'3rem', fontWeight:900, color:'#7c3aed', fontFamily:'var(--font-display)'}}>{score.toLocaleString()}</div>
            </div>
            <button onClick={() => { localStorage.removeItem('playquiz_player_id'); window.location.href = '/' }}
              className="btn-spring"
              style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, padding:'1rem 2rem', borderRadius:'1rem', border:'none', cursor:'pointer', fontSize:'1rem'}}
              onMouseEnter={() => sounds.hover()}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
