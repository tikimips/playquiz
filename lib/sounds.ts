let ctx: AudioContext | null = null

function ac(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  return ctx
}

function tone(freq: number, type: OscillatorType, dur: number, vol = 0.12, delay = 0) {
  try {
    const c = ac()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain); gain.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + delay)
    gain.gain.setValueAtTime(vol, c.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur)
    osc.start(c.currentTime + delay)
    osc.stop(c.currentTime + delay + dur + 0.01)
  } catch { /* ignore */ }
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('pq_muted') === '1'
}

export function toggleMute(): boolean {
  const next = !isMuted()
  localStorage.setItem('pq_muted', next ? '1' : '0')
  window.dispatchEvent(new Event('pq:mute'))
  return next
}

function play(fn: () => void) {
  if (typeof window === 'undefined' || isMuted()) return
  try { fn() } catch { /* ignore */ }
}

export const sounds = {
  hover:    () => play(() => tone(900, 'sine', 0.08, 0.04)),
  click:    () => play(() => tone(660, 'sine', 0.1, 0.1)),
  join:     () => play(() => { tone(440, 'sine', 0.12, 0.12); tone(660, 'sine', 0.12, 0.12, 0.1) }),
  correct:  () => play(() => { tone(523, 'sine', 0.15, 0.18); tone(659, 'sine', 0.15, 0.18, 0.1); tone(784, 'sine', 0.2, 0.18, 0.2) }),
  wrong:    () => play(() => { tone(220, 'sawtooth', 0.18, 0.15); tone(180, 'sawtooth', 0.18, 0.12, 0.1) }),
  tick:     () => play(() => tone(480, 'square', 0.04, 0.06)),
  complete: () => play(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.3, 0.15, i * 0.13))),
}
