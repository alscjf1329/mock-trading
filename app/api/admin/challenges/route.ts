import { NextRequest, NextResponse } from 'next/server'
import { createChallenge, getChallenges } from '@/lib/db'

function authOk(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  const rows = await getChallenges()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  try {
    const body = await req.json()
    const challenge = await createChallenge(body)
    return NextResponse.json(challenge)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
