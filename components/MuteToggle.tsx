'use client'
import { useEffect, useState } from 'react'
import { isMuted, toggleMute } from '@/lib/sounds'

export default function MuteToggle() {
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    setMuted(isMuted())
    const handler = () => setMuted(isMuted())
    window.addEventListener('pq:mute', handler)
    return () => window.removeEventListener('pq:mute', handler)
  }, [])

  return (
    <button
      onClick={() => toggleMute()}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition backdrop-blur-sm"
    >
      {muted ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      )}
    </button>
  )
}
