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
  if (now < from) return <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">예정</span>
  if (now > until) return <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">종료</span>
  return <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">진행 중</span>
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
    <main className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* 헤더 */}
      <div className="mb-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-tight">챌린지 🏆</h1>
            <p className="text-xs text-gray-400 mt-0.5">과거 시세로 트레이딩 — 수익금 랭킹 도전</p>
          </div>
          <Link href="/" className="text-xs text-gray-400 pt-1">← 랭킹</Link>
        </div>
        <div className="mt-2 text-[11px] text-green-600 font-medium">
          🟢 24시간 언제든 참여 가능 · 장 마감 없음
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-[100px] animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center shadow-sm">
          <p className="text-3xl mb-2">🏁</p>
          <p className="text-sm text-gray-400">진행 중인 챌린지가 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(c => (
            <Link key={c.id} href={`/challenges/${c.id}`} className="block">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h2 className="font-semibold text-sm leading-tight flex-1 min-w-0">{c.title}</h2>
                  {statusBadge(c)}
                </div>
                {c.description && (
                  <p className="text-[12px] text-gray-500 mb-2 leading-relaxed line-clamp-2">{c.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                  <span>📅 {c.trade_start.slice(0,10)} ~ {c.trade_end.slice(0,10)}</span>
                  <span>💰 {fmt(c.seed)}원</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  ⏰ {new Date(c.open_from).toLocaleDateString('ko-KR')} ~ {new Date(c.open_until).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
