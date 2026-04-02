import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check user exists (silently succeed to avoid email enumeration)
  const { data: { users } } = await admin.auth.admin.listUsers()
  const user = users.find(u => u.email === email)
  if (!user) return NextResponse.json({ ok: true })

  // Generate a secure token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Store in DB
  const { error: dbErr } = await admin
    .from('password_reset_tokens')
    .insert({ email, token, expires_at: expiresAt.toISOString() })
  if (dbErr) return NextResponse.json({ error: 'Failed to create reset token' }, { status: 500 })

  // Send email via Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'macadaan@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  const resetUrl = `https://playquiz.ai/reset-password?token=${token}`

  await transporter.sendMail({
    from: '"PlayQuiz" <macadaan@gmail.com>',
    to: email,
    subject: 'Reset your PlayQuiz password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#7c3aed">Reset your password</h2>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Reset password</a>
        <p style="color:#888;font-size:13px">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
