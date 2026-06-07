import { NextRequest, NextResponse } from 'next/server'
import { updateChallenge, deleteChallenge } from '@/lib/db'

function authOk(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!authOk(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  try {
    const body = await req.json()
    await updateChallenge(Number(params.id), body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!authOk(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  try {
    await deleteChallenge(Number(params.id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
