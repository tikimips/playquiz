import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Validate token
  const { data: rows, error: fetchErr } = await admin
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .limit(1)

  if (fetchErr || !rows || rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  const row = rows[0]

  // Find user by email
  const { data: { users } } = await admin.auth.admin.listUsers()
  const user = users.find(u => u.email === row.email)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 400 })

  // Update password
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, { password })
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  // Mark token used
  await admin.from('password_reset_tokens').update({ used: true }).eq('token', token)

  return NextResponse.json({ ok: true })
}
