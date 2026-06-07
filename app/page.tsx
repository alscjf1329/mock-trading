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

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtR(r: number) { return (Number(r) >= 0 ? '+' : '') + Number(r).toFixed(2) + '%' }

const medals = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const [rows, setRows] = useState<RankRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/rankings?period=${period}`)
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">모의투자 랭킹</h1>
          <p className="text-sm text-gray-400 mt-1">시드 1,000만원 · Yahoo Finance 실시간 시세</p>
        </div>
        <Link
          href="/trade"
          className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
        >
          트레이딩 시작 →
        </Link>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['daily', 'weekly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {p === 'daily' ? '오늘' : '이번 주'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            아직 등록된 기록이 없어요<br />
            <Link href="/trade" className="text-gray-600 underline mt-2 inline-block">첫 번째로 등록하기</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium w-10">#</th>
                <th className="text-left px-2 py-3 font-medium">닉네임</th>
                <th className="text-right px-5 py-3 font-medium">수익금</th>
                <th className="text-right px-5 py-3 font-medium">수익률</th>
                <th className="text-right px-5 py-3 font-medium">최종자산</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const profit = Number(row.profit)
                const color = profit > 0 ? 'text-red-600' : profit < 0 ? 'text-blue-700' : 'text-gray-500'
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-lg">
                      {medals[i] ?? <span className="text-gray-400 text-sm">{i + 1}</span>}
                    </td>
                    <td className="px-2 py-3.5 font-medium">{row.nickname}</td>
                    <td className={`px-5 py-3.5 text-right font-medium ${color}`}>
                      {profit >= 0 ? '+' : ''}{fmt(profit)}원
                    </td>
                    <td className={`px-5 py-3.5 text-right font-medium ${color}`}>
                      {fmtR(row.profit_rate)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600">
                      {fmt(Number(row.final_value))}원
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
