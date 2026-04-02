import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user

  const { data: quiz } = await supabase.from('quizzes').select('title').eq('id', id).single()
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: questions } = await supabase
    .from('questions').select('*, options(*)').eq('quiz_id', id).order('order_index')

  return NextResponse.json({ title: quiz.title, questions: questions || [] })
}
