'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Challenge {
  id: number
  title: string
  description: string
  trade_start: string
  trade_end: string
  open_from: string
  open_until: string
  seed: number
}

function fmt(n: number) { return Number(n).toLocaleString('ko-KR') }

function statusBadge(c: Challenge) {
  const now = new Date()
  const from = new Date(c.open_from)
  const until = new Date(c.open_until)
  if (now < from) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">예정</span>
  if (now > until) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">종료</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">진행 중</span>
}

export default function ChallengesPage() {
  const [list, setList] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/challenges')
      .then(r => r.json())
      .then(d => { setList(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">챌린지</h1>
          <p className="text-sm text-gray-400 mt-1">과거 시세로 트레이딩 — 수익금 랭킹 도전</p>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← 랭킹</Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-16">불러오는 중...</p>
      ) : list.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-16">진행 중인 챌린지가 없어요</p>
      ) : (
        <div className="space-y-3">
          {list.map(c => (
            <Link key={c.id} href={`/challenges/${c.id}`} className="block">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-base">{c.title}</h2>
                  {statusBadge(c)}
                </div>
                {c.description && <p className="text-sm text-gray-500 mb-3">{c.description}</p>}
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>📅 시세 기간 {c.trade_start} ~ {c.trade_end}</span>
                  <span>💰 시드 {fmt(c.seed)}원</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  ⏰ 참여 기간 {new Date(c.open_from).toLocaleDateString('ko-KR')} ~ {new Date(c.open_until).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
