import { NextRequest, NextResponse } from 'next/server'
import { getChallenge } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const row = await getChallenge(Number(params.id))
    if (!row) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json(row)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
