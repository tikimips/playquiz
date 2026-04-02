import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderIndex } = await req.json()

  const { data: q, error } = await supabase
    .from('questions')
    .insert({ quiz_id: quizId, text: '', time_limit: 20, points: 1000, order_index: orderIndex })
    .select().single()

  if (error || !q) return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })

  const opts = [0, 1, 2, 3].map(i => ({ question_id: q.id, text: '', is_correct: i === 0, order_index: i }))
  const { data: options } = await supabase.from('options').insert(opts).select()

  return NextResponse.json({ ...q, options: options || [] })
}
