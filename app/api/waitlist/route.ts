import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, game } = await req.json()
  if (!email || !game) return NextResponse.json({ error: 'Email and game required' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await admin.from('waitlist').insert({ email, game })
  if (error && error.code !== '23505') { // ignore duplicate
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
