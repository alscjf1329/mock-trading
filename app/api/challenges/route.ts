import { NextResponse } from 'next/server'
import { getChallenges } from '@/lib/db'

export async function GET() {
  try {
    const rows = await getChallenges()
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
