import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'question-images'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowed = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 3MB)' }, { status: 400 })

  // Ensure bucket exists
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error } = await admin.storage.from(BUCKET).upload(path, Buffer.from(bytes), {
    contentType: file.type,
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
