import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user

  const { quizId } = await req.json()
  if (!quizId) return NextResponse.json({ error: 'quizId required' }, { status: 400 })

  const pin = Math.floor(100000 + Math.random() * 900000).toString()
  const { data: game, error } = await supabase
    .from('games')
    .insert({ quiz_id: quizId, host_id: user.id, pin, status: 'lobby', current_question_index: -1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(game)
}
