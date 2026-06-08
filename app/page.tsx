'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RankRow {
  nickname: string
  profit: number
  profit_rate: number
  final_value: number
  created_at: string
}

function fmt(n: number) { return Math.round(Number(n)).toLocaleString('ko-KR') }
function fmtR(r: number) { return (Number(r) >= 0 ? '+' : '') + Number(r).toFixed(2) + '%' }

const medals = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const [rows, setRows] = useState<RankRow[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    fetch(`/api/rankings?period=${period}`)
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [period])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">모의투자 랭킹 🏅</h1>
        <p className="text-sm text-gray-400 mt-1">시드 1,000만원 · 국내주/미국주 실시간 시세</p>
      </div>

      {/* CTA 배너 */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">지금 바로 시작해볼까요?</p>
          <p className="text-xs text-gray-400 mt-0.5">닉네임 하나로 즉시 시작 · 계정 불필요</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/challenges" className="text-xs px-3 py-2 rounded-xl border border-gray-600 text-gray-300 hover:border-gray-400 transition-colors">
            챌린지
          </Link>
          <Link href="/trade" className="text-xs px-3 py-2 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors">
            트레이딩 →
          </Link>
        </div>
      </div>

      {/* 기간 탭 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['daily', 'weekly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
              {p === 'daily' ? '오늘' : '이번 주'}
            </button>
          ))}
        </div>
        <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          새로고침 ↻
        </button>
      </div>

      {/* 랭킹 목록 */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-sm text-gray-400">아직 등록된 기록이 없어요</p>
          <Link href="/trade" className="text-sm text-gray-900 font-medium underline mt-2 inline-block">
            첫 번째로 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const profit = Number(row.profit)
            const isPos = profit >= 0
            const color = profit > 0 ? 'text-red-600' : profit < 0 ? 'text-blue-700' : 'text-gray-500'
            const bg = profit > 0 ? 'bg-red-50' : profit < 0 ? 'bg-blue-50' : 'bg-gray-50'
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3">
                <span className="text-xl w-8 text-center shrink-0">
                  {medals[i] ?? <span className="text-sm text-gray-400 font-medium">{i + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{row.nickname}</p>
                  <p className="text-xs text-gray-400">최종 {fmt(Number(row.final_value))}원</p>
                </div>
                <div className={`text-right px-3 py-1.5 rounded-xl ${bg} shrink-0`}>
                  <p className={`font-bold text-sm ${color}`}>{fmtR(row.profit_rate)}</p>
                  <p className={`text-xs font-medium ${color}`}>{isPos ? '+' : ''}{fmt(profit)}원</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
