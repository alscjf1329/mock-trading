import { NextRequest, NextResponse } from 'next/server'
import { insertRanking, getDailyRankings, getWeeklyRankings } from '@/lib/db'

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period') ?? 'daily'
  try {
    const rows = period === 'weekly' ? await getWeeklyRankings() : await getDailyRankings()
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nickname, profit, profitRate, finalValue } = await req.json()
    if (!nickname || typeof profit !== 'number') {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
    }
    await insertRanking(nickname.slice(0, 20), Math.round(profit), profitRate, Math.round(finalValue))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
