import { NextRequest, NextResponse } from 'next/server'
import { getChallengeRankings, insertChallengeRanking, getChallenge } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await getChallengeRankings(Number(params.id))
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const challengeId = Number(params.id)
    const challenge = await getChallenge(challengeId)
    if (!challenge) return NextResponse.json({ error: '챌린지 없음' }, { status: 404 })

    const now = new Date()
    if (now < new Date(challenge.open_from) || now > new Date(challenge.open_until)) {
      return NextResponse.json({ error: '참여 기간이 아닙니다' }, { status: 400 })
    }

    const { nickname, profit, profitRate, finalValue } = await req.json()
    if (!nickname || typeof profit !== 'number') {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
    }
    await insertChallengeRanking(challengeId, nickname.slice(0, 20), Math.round(profit), profitRate, Math.round(finalValue))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
