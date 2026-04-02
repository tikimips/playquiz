'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Question, Option } from '@/lib/types'
import { Plus, Trash2, Clock, Play, ChevronLeft, ImagePlus, X } from 'lucide-react'

function ImageUpload({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX_SIZE = 3 * 1024 * 1024 // 3MB

  async function upload(file: File) {
    setError('')
    if (file.size > MAX_SIZE) {
      setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please resize it to under 3MB. Try a free tool like squoosh.app or just reduce the image dimensions before uploading.`)
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed'); return }
      onChange(data.url)
    } catch {
      setError('Upload failed. Check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  function handleClick() {
    inputRef.current?.click()
  }

  if (value) return (
    <div style={{position:'relative', display:'inline-block'}}>
      <img src={value} alt="Question image" style={{width:'100%', maxHeight:'160px', objectFit:'contain', borderRadius:'0.75rem', background:'rgba(0,0,0,0.04)', display:'block'}}/>
      <button onClick={() => onChange(null)}
        style={{position:'absolute', top:'0.5rem', right:'0.5rem', background:'rgba(0,0,0,0.6)', color:'white', border:'none', borderRadius:'9999px', width:'1.75rem', height:'1.75rem', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
        <X size={14}/>
      </button>
    </div>
  )

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          width: '100%',
          border: `2px dashed ${dragging ? '#7c3aed' : 'rgba(0,0,0,0.15)'}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(124,58,237,0.05)' : 'rgba(0,0,0,0.02)',
          transition: 'all 0.15s',
        }}>
        {uploading ? (
          <p style={{color:'#9ca3af', fontSize:'0.875rem', fontFamily:'var(--font-body)', margin:0}}>Uploading...</p>
        ) : (
          <>
            <ImagePlus size={24} color="#9ca3af" style={{margin:'0 auto 0.5rem'}}/>
            <p style={{color:'#6b7280', fontSize:'0.875rem', fontFamily:'var(--font-body)', marginBottom:'0.25rem', marginTop:0}}>
              <span style={{color:'#7c3aed', fontWeight:600}}>Upload image</span> or drag and drop
            </p>
            <p style={{color:'#9ca3af', fontSize:'0.75rem', fontFamily:'var(--font-body)', margin:0}}>PNG, JPG, GIF, WebP — max 3MB</p>
          </>
        )}
      </button>
      {error && <p style={{color:'#dc2626', fontSize:'0.8rem', marginTop:'0.5rem', fontFamily:'var(--font-body)', lineHeight:1.5}}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }}/>
    </div>
  )
}

const OPTION_COLORS = ['#ef4444','#3b82f6','#eab308','#22c55e']
const OPTION_SHAPES = ['▲','◆','●','■']

interface QuestionWithOptions extends Question { options: Option[] }

export default function EditQuizPage() {
  const params = useParams()
  const quizId = params.id as string
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [aiModal, setAiModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function loadQuiz() {
    setLoading(true); setLoadError('')
    fetch(`/api/quiz/${quizId}`)
      .then(async res => {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 404) { setLoadError('Quiz not found.'); return }
        const data = await res.json()
        if (data.error) { setLoadError(data.error); return }
        setQuizTitle(data.title)
        setQuestions((data.questions || []).map((q: QuestionWithOptions) => ({
          ...q, options: (q.options || []).sort((a: Option, b: Option) => a.order_index - b.order_index)
        })))
      })
      .catch(() => setLoadError('Could not load quiz. Check your connection.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadQuiz()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addQuestion() {
    const res = await fetch(`/api/quiz/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIndex: questions.length }),
    })
    if (!res.ok) return
    const q = await res.json()
    setQuestions(prev => [...prev, { ...q, options: (q.options || []).sort((a: Option, b: Option) => a.order_index - b.order_index) }])
  }

  async function updateQuestionText(qId: string, text: string) {
    setQuestions(prev => prev.map(q => q.id === qId ? {...q, text} : q))
    await supabase.from('questions').update({ text }).eq('id', qId)
  }

  async function updateQuestionTime(qId: string, time_limit: number) {
    setQuestions(prev => prev.map(q => q.id === qId ? {...q, time_limit} : q))
    await supabase.from('questions').update({ time_limit }).eq('id', qId)
  }

  async function updateQuestionImage(qId: string, image_url: string) {
    setQuestions(prev => prev.map(q => q.id === qId ? {...q, image_url} : q))
    await supabase.from('questions').update({ image_url: image_url || null }).eq('id', qId)
  }

  async function updateQuestionImage(qId: string, image_url: string) {
    setQuestions(prev => prev.map(q => q.id === qId ? {...q, image_url} : q))
    await supabase.from('questions').update({ image_url: image_url || null }).eq('id', qId)
  }

  async function updateOption(optId: string, qId: string, text: string) {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options.map(o => o.id === optId ? {...o, text} : o) } : q))
    await supabase.from('options').update({ text }).eq('id', optId)
  }

  async function setCorrectOption(optId: string, qId: string) {
    const q = questions.find(q => q.id === qId)
    if (!q) return
    for (const opt of q.options) await supabase.from('options').update({ is_correct: opt.id === optId }).eq('id', opt.id)
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options.map(o => ({ ...o, is_correct: o.id === optId })) } : q))
  }

  async function deleteQuestion(qId: string) {
    if (!confirm('Delete this question?')) return
    await supabase.from('questions').delete().eq('id', qId)
    setQuestions(prev => prev.filter(q => q.id !== qId))
  }

  async function startGame() {
    if (questions.length === 0) { alert('Add at least one question first'); return }
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    })
    if (!res.ok) return
    const game = await res.json()
    if (game?.id) router.push(`/host/${game.id}`)
  }

  if (loading) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontFamily:'var(--font-body)'}}>Loading...</div>
  )

  if (loadError) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem'}}>
      <div style={{textAlign:'center'}}>
        <p style={{color:'#dc2626', fontFamily:'var(--font-body)', marginBottom:'1.5rem'}}>{loadError}</p>
        <button onClick={loadQuiz} className="btn-spring"
          style={{background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:600, padding:'0.625rem 1.5rem', borderRadius:'0.75rem', border:'none', cursor:'pointer'}}>
          Try again
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #fce4f0 0%, #e4fce8 100%)'}}>
      <header style={{position:'sticky', top:0, zIndex:50, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', background:'rgba(255,255,255,0.78)', borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <Link href="/dashboard" style={{display:'flex', alignItems:'center', gap:'0.25rem', color:'#7c3aed', textDecoration:'none', fontSize:'0.9rem', fontWeight:600, fontFamily:'var(--font-body)'}}>
              <ChevronLeft size={16}/> Back
            </Link>
            <span style={{color:'rgba(0,0,0,0.15)'}}>|</span>
            <h1 style={{fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700, color:'#1e1b4b', maxWidth:'240px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{quizTitle}</h1>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <span style={{fontSize:'0.875rem', color:'#9ca3af', fontFamily:'var(--font-body)'}}>{questions.length} questions</span>
            <button onClick={startGame} className="btn-spring"
              style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'#7c3aed', color:'white', fontFamily:'var(--font-body)', fontWeight:600, padding:'0.5rem 1.25rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.9rem'}}>
              <Play size={16}/> Save & Host Now
            </button>
          </div>
        </div>
      </header>

      <div style={{maxWidth:'760px', margin:'0 auto', padding:'2rem 1.5rem 6rem'}}>
        <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
          {questions.map((q, qi) => (
            <div key={q.id} style={{background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'1.5rem', backdropFilter:'blur(8px)'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
                <span style={{fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9ca3af', fontFamily:'var(--font-body)'}}>Q{qi + 1}</span>
                <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'0.375rem'}}>
                    <Clock size={12} color="#9ca3af"/>
                    <select value={q.time_limit} onChange={e => updateQuestionTime(q.id, Number(e.target.value))}
                      style={{background:'rgba(0,0,0,0.05)', color:'#1e1b4b', fontSize:'0.75rem', borderRadius:'0.5rem', padding:'0.25rem 0.5rem', outline:'none', border:'1px solid rgba(0,0,0,0.1)', fontFamily:'var(--font-body)'}}>
                      {[5,10,15,20,30,45,60].map(t => <option key={t} value={t}>{t}s</option>)}
                    </select>
                  </div>
                  <button onClick={() => deleteQuestion(q.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#d1d5db', display:'flex', alignItems:'center'}}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>

              <div style={{position:'relative', marginBottom:'1rem'}}>
                <textarea
                  value={q.text}
                  onChange={e => updateQuestionText(q.id, e.target.value)}
                  placeholder="Type your question here..."
                  rows={3}
                  style={{width:'100%', background:'transparent', color:'#1e1b4b', fontSize:'1.1rem', fontWeight:600, outline:'none', resize:'none', paddingBottom:'2.25rem', fontFamily:'var(--font-body)', border:'none', borderBottomWidth:'1.5px', borderBottomStyle:'solid', borderBottomColor:'rgba(0,0,0,0.1)'}}
                />
                {/* Bottom-left icons */}
                <div style={{position:'absolute', bottom:'0.5rem', left:0, display:'flex', alignItems:'center', gap:'0.375rem'}}>
                  {/* Sparkle / AI assistant */}
                  <button onClick={() => setAiModal(true)} title="Writing assistant"
                    style={{background:'none', border:'none', cursor:'pointer', fontSize:'1rem', lineHeight:1, padding:'0.2rem', color:'#1e1b4b', opacity:0.5, transition:'opacity 0.15s'}}
                    onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity='0.5')}>
                    ✨
                  </button>

                </div>
              </div>

              <div style={{marginBottom:'1.25rem'}}>
                <ImageUpload value={q.image_url || null} onChange={url => updateQuestionImage(q.id, url || '')} />
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>
                {q.options.map((opt, oi) => (
                  <div key={opt.id} style={{borderRadius:'0.75rem', padding:'0.75rem', border: opt.is_correct ? `2px solid ${OPTION_COLORS[oi]}` : '2px solid rgba(0,0,0,0.08)', background: opt.is_correct ? `${OPTION_COLORS[oi]}18` : 'rgba(255,255,255,0.6)'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem'}}>
                      <span style={{fontSize:'0.875rem', fontWeight:700, color: OPTION_COLORS[oi]}}>{OPTION_SHAPES[oi]}</span>
                      <button onClick={() => setCorrectOption(opt.id, q.id)}
                        style={{marginLeft:'auto', fontSize:'0.75rem', padding:'2px 8px', borderRadius:'9999px', border:'none', cursor:'pointer', background: opt.is_correct ? OPTION_COLORS[oi] : 'rgba(0,0,0,0.08)', color: opt.is_correct ? 'white' : '#6b7280', fontWeight: opt.is_correct ? 700 : 400, fontFamily:'var(--font-body)'}}>
                        {opt.is_correct ? '✓ Correct' : 'Set correct'}
                      </button>
                    </div>
                    <input
                      value={opt.text}
                      onChange={e => updateOption(opt.id, q.id, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      style={{width:'100%', background:'transparent', color:'#1e1b4b', outline:'none', fontSize:'0.9rem', fontFamily:'var(--font-body)', border:'none'}}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addQuestion} className="btn-spring"
          style={{marginTop:'1rem', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', border:'2px dashed rgba(124,58,237,0.3)', background:'rgba(124,58,237,0.04)', color:'#7c3aed', padding:'1.25rem', borderRadius:'1.25rem', cursor:'pointer', fontWeight:600, fontSize:'0.95rem', fontFamily:'var(--font-body)'}}>
          <Plus size={20}/> Add Question
        </button>
      </div>

      {/* AI modal */}
      {aiModal && (
        <div onClick={() => setAiModal(false)} style={{position:'fixed', inset:0, zIndex:60, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'rgba(255,255,255,0.97)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'1.25rem', padding:'2rem', width:'100%', maxWidth:'360px', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
            <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>✨</div>
            <h3 style={{fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:700, color:'#1e1b4b', marginBottom:'0.5rem'}}>Writing assistant</h3>
            <p style={{fontFamily:'var(--font-body)', fontSize:'0.9rem', color:'#6b7280', marginBottom:'1.5rem'}}>Coming soon</p>
            <button onClick={() => setAiModal(false)} className="btn-spring"
              style={{background:'rgba(0,0,0,0.06)', border:'none', borderRadius:'0.75rem', padding:'0.625rem 1.5rem', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'0.9rem', color:'#1e1b4b', cursor:'pointer'}}>
              Close
            </button>
          </div>
        </div>
      )}


    </div>
  )
}
