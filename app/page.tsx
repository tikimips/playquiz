'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { sounds } from '@/lib/sounds'

const GAMES = [
  {
    id: 'trivia',
    name: 'Trivia',
    desc: 'Host a live quiz. Players join with a PIN.',
    free: true,
    href: '/login',
    thumb: <TriviaThumb />,
  },
  {
    id: 'speed',
    name: 'Speed Round',
    desc: '10 seconds per question. Fastest finger wins.',
    free: false,
    thumb: <SpeedThumb />,
  },
  {
    id: 'team',
    name: 'Team Battle',
    desc: 'Two teams compete head to head in real-time.',
    free: false,
    thumb: <TeamThumb />,
  },
  {
    id: 'blind',
    name: 'Blind Box',
    desc: 'Mystery category revealed mid-game. Chaos included.',
    free: false,
    thumb: <BlindThumb />,
  },
  {
    id: 'daily',
    name: 'Daily Challenge',
    desc: 'One puzzle per day. Global leaderboard.',
    free: false,
    thumb: <DailyThumb />,
  },
]

function TriviaThumb() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-violet-700 to-indigo-900 flex items-center justify-center overflow-hidden relative">
      {['?','?','?'].map((_, i) => (
        <span key={i} className="absolute text-white/20 font-black select-none"
          style={{ fontSize: `${60 + i*20}px`, top: `${[10,30,5][i]}%`, left: `${[10,40,65][i]}%`,
            animation: `float-${['a','b','a'][i]} ${[8,11,9][i]}s ease-in-out infinite` }}>?</span>
      ))}
      <span className="text-5xl relative z-10">🧠</span>
    </div>
  )
}
function SpeedThumb() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-600 to-yellow-500 flex items-center justify-center overflow-hidden relative">
      {[...Array(5)].map((_,i) => (
        <div key={i} className="absolute h-px bg-white/30" style={{ width:`${40+i*15}%`, top:`${20+i*14}%`, left:`${-i*5}%`, transform:'skewY(-8deg)' }}/>
      ))}
      <span className="text-5xl relative z-10">⚡</span>
    </div>
  )
}
function TeamThumb() {
  return (
    <div className="w-full h-full overflow-hidden relative flex">
      <div className="flex-1 bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center">
        <span className="text-3xl">🔴</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-white/20 rotate-12" />
      </div>
      <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
        <span className="text-3xl">🔵</span>
      </div>
    </div>
  )
}
function BlindThumb() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {[...Array(8)].map((_,i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full bg-white/40"
          style={{ top:`${Math.sin(i)*40+50}%`, left:`${(i/8)*90+5}%`,
            animation:`float-${i%2===0?'a':'b'} ${7+i}s ease-in-out infinite` }}/>
      ))}
      <span className="text-5xl relative z-10">📦</span>
    </div>
  )
}
function DailyThumb() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-teal-900 flex items-center justify-center overflow-hidden relative">
      <div className="grid grid-cols-4 gap-1 absolute inset-0 p-4 opacity-20">
        {[...Array(16)].map((_,i) => <div key={i} className="rounded bg-white/50"/>)}
      </div>
      <span className="text-5xl relative z-10">⭐</span>
    </div>
  )
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [modal, setModal] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 18
    const y = ((e.clientY - r.top) / r.height - 0.5) * -14
    el.style.setProperty('--rx', `${y}deg`)
    el.style.setProperty('--ry', `${x}deg`)
  }
  function onMouseLeave() {
    const el = cardRef.current; if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    await fetch('/api/waitlist', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, game: game.id }) })
    setSending(false); setSent(true)
  }

  const inner = (
    <div ref={cardRef} className="card-3d rounded-2xl overflow-hidden cursor-pointer"
      style={{background:'rgba(255,255,255,0.85)', border:'1px solid rgba(0,0,0,0.08)', backdropFilter:'blur(8px)'}}
      onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      onMouseEnter={() => sounds.hover()}
      onClick={() => { if (!game.free) { sounds.click(); setModal(true) } }}>
      <div className="h-36 relative">{game.thumb}</div>
      <div style={{padding:'1.25rem', textAlign:'left'}}>
        <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem'}}>
          <span style={{fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.125rem', color:'#1e1b4b'}}>{game.name}</span>
          {game.free
            ? <span className="badge-free" style={{marginLeft:'auto', fontSize:'0.75rem', fontWeight:700, padding:'2px 8px', borderRadius:'9999px', background:'rgba(74,222,128,0.18)', color:'#15803d', border:'1px solid rgba(74,222,128,0.45)'}}>FREE</span>
            : <span className="badge-locked" style={{marginLeft:'auto', fontSize:'0.75rem', fontWeight:700, padding:'2px 8px', borderRadius:'9999px', color:'#9ca3af', border:'1px solid rgba(0,0,0,0.12)', display:'flex', alignItems:'center', gap:'4px'}}>
                <span>🔒</span> SOON
              </span>
          }
        </div>
        <p style={{fontSize:'0.875rem', color:'#6b7280', fontFamily:'var(--font-body)'}}>{game.desc}</p>
      </div>
    </div>
  )

  return (
    <>
      {game.free ? <Link href={game.href!} className="block" onMouseEnter={() => sounds.hover()} onClick={() => sounds.click()}>{inner}</Link> : inner}

      {modal && (
        <div onClick={() => setModal(false)} style={{position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'rgba(255,255,255,0.97)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'2rem', width:'100%', maxWidth:'360px', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.12)'}}>
            <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>🔒</div>
            <h3 style={{fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:700, color:'#1e1b4b', marginBottom:'0.5rem'}}>Coming soon</h3>
            <p style={{fontFamily:'var(--font-body)', fontSize:'0.9rem', color:'#6b7280', marginBottom:'1.5rem'}}>Join the waitlist and we'll ping you when <strong style={{color:'#1e1b4b'}}>{game.name}</strong> drops.</p>
            {sent ? (
              <p style={{fontFamily:'var(--font-body)', fontWeight:600, color:'#16a34a'}}>You're on the list! 🎉</p>
            ) : (
              <form onSubmit={submitWaitlist} style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com"
                  style={{background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'0.75rem', padding:'0.75rem 1rem', outline:'none', fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#1e1b4b'}}/>
                <button type="submit" disabled={sending} className="btn-spring"
                  style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, padding:'0.75rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.95rem', opacity: sending ? 0.6 : 1}}>
                  {sending ? 'Joining...' : 'Notify me'}
                </button>
              </form>
            )}
            <button onClick={() => setModal(false)} style={{marginTop:'1rem', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:'0.875rem', color:'#9ca3af', width:'100%'}}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}

export default function GamesHub() {
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createClient } = require('@/lib/supabase/client')
  async function handlePin(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 6) { setPinError('PIN must be 6 digits'); return }
    setLoading(true); setPinError('')
    const supabase = createClient()
    const { data: game } = await supabase.from('games').select('id,status').eq('pin', pin).single()
    setLoading(false)
    if (!game) { setPinError('Game not found'); return }
    if (game.status === 'ended') { setPinError('This game has ended'); return }
    sounds.click()
    window.location.href = `/play/${game.id}`
  }

  return (
    <div style={{minHeight:'100vh', background:'var(--bg)', position:'relative', overflowX:'hidden'}}>
      {/* Ambient orbs */}
      <div className="orb-a" style={{position:'absolute', width:'500px', height:'500px', borderRadius:'50%', opacity:0.22, pointerEvents:'none', background:'radial-gradient(circle, #e91e8c, transparent)', top:'-80px', left:'-80px'}}/>
      <div className="orb-b" style={{position:'absolute', width:'400px', height:'400px', borderRadius:'50%', opacity:0.18, pointerEvents:'none', background:'radial-gradient(circle, #00d4f7, transparent)', top:'40%', right:'-80px'}}/>
      <div style={{position:'absolute', width:'350px', height:'350px', borderRadius:'50%', opacity:0.18, pointerEvents:'none', background:'radial-gradient(circle, #4ade80, transparent)', bottom:'5%', left:'15%', animation:'float-b 18s ease-in-out infinite'}}/>

      {/* Sticky header */}
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{fontFamily:'var(--font-logo)', fontSize:'1.5rem', letterSpacing:'0.02em', color:'#1e1b4b'}}>
            PLAY<span style={{color:'#e91e8c'}}>QUIZ</span>
          </span>
          <Link href="/login"
            className="btn-spring"
            style={{fontFamily:'var(--font-body)', fontSize:'0.9rem', fontWeight:600, color:'#7c3aed', border:'1px solid rgba(124,58,237,0.35)', background:'rgba(124,58,237,0.07)', padding:'0.5rem 1.25rem', borderRadius:'0.75rem', textDecoration:'none'}}
            onMouseEnter={() => sounds.hover()} onClick={() => sounds.click()}>
            Host a game
          </Link>
        </div>
      </header>

      {/* Main content — all centered via explicit inline styles */}
      <main style={{maxWidth:'1100px', margin:'0 auto', padding:'4rem 2rem', position:'relative', zIndex:10}}>

        {/* Hero */}
        <div style={{textAlign:'center', marginBottom:'3.5rem'}}>
          <h1 style={{fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(3rem, 8vw, 6rem)', lineHeight:1.1, color:'#1e1b4b', marginBottom:'1.25rem'}}>
            Games that<br/>
            <span style={{color:'#e91e8c'}}>bring people</span><br/>
            together.
          </h1>
          <p style={{fontFamily:'var(--font-body)', fontSize:'1.2rem', color:'#6b7280', maxWidth:'520px', margin:'0 auto', lineHeight:1.6}}>
            Live multiplayer games you can play in seconds. No app, no account, just a PIN.
          </p>
        </div>

        {/* Quick join */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'4rem', gap:'0.5rem'}}>
          <form onSubmit={handlePin} style={{display:'flex', gap:'0.75rem', width:'100%', maxWidth:'420px'}}>
            <input
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g,'').slice(0,6)); setPinError('') }}
              placeholder="Enter game PIN"
              inputMode="numeric"
              maxLength={6}
              style={{
                flex:1, background:'rgba(255,255,255,0.92)', border:'1.5px solid rgba(0,0,0,0.14)',
                borderRadius:'1rem', padding:'0.875rem 1.25rem', fontSize:'1.25rem',
                fontFamily:'var(--font-body)', fontWeight:700, textAlign:'center',
                letterSpacing:'0.15em', color:'#1e1b4b', outline:'none',
              }}
            />
            <button type="submit" disabled={loading || pin.length !== 6}
              className="btn-spring"
              style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'1rem', padding:'0.875rem 1.75rem', borderRadius:'1rem', border:'none', cursor:'pointer', opacity: (loading || pin.length !== 6) ? 0.4 : 1, whiteSpace:'nowrap'}}
              onMouseEnter={() => sounds.hover()} onClick={() => sounds.click()}>
              {loading ? '...' : 'Join'}
            </button>
          </form>
          {pinError && <p style={{fontFamily:'var(--font-body)', fontSize:'0.875rem', color:'#e91e8c'}}>{pinError}</p>}
        </div>

        {/* Game cards */}
        <div>
          <p style={{fontFamily:'var(--font-body)', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#9ca3af', textAlign:'center', marginBottom:'1.5rem'}}>Available games</p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1.25rem'}}>
            {GAMES.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        </div>
      </main>
    </div>
  )
}
