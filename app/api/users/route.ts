import { NextRequest, NextResponse } from 'next/server'
import { registerNickname } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { nickname } = await req.json()
    if (!nickname) return NextResponse.json({ error: '닉네임 필요' }, { status: 400 })
    const ok = await registerNickname(nickname.trim().slice(0, 20))
    if (!ok) return NextResponse.json({ error: '이미 사용 중인 닉네임이에요' }, { status: 409 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('registerNickname error:', e)
    return NextResponse.json({ error: 'DB 오류: ' + String(e?.message ?? e) }, { status: 500 })
  }
}
