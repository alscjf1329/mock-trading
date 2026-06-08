'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useChallengeStore } from '@/lib/challengeStore'
import ChallengeQuoteSearch from '@/components/ChallengeQuoteSearch'

interface Challenge {
  id: number; title: string; description: string
  trade_start: string; trade_end: string
  open_from: string; open_until: string; seed: number
}
interface RankRow { nickname: string; profit: number; profit_rate: number; final_value: number }

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + Number(r).toFixed(2) + '%' }
const medals = ['🥇', '🥈', '🥉']

const TABS = ['트레이딩', '포트폴리오', '랭킹'] as const

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [tab, setTab] = useState<typeof TABS[number]>('트레이딩')
  const [inputName, setInputName] = useState('')
  const [rankings, setRankings] = useState<RankRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const store = useChallengeStore()

  useEffect(() => {
    fetch(`/api/challenges/${id}`).then(r => r.json()).then(setChallenge)
    fetch(`/api/challenges/${id}/rankings`).then(r => r.json()).then(d => setRankings(Array.isArray(d) ? d : []))
  }, [id])

  if (!challenge) return <div className="text-center py-24 text-gray-400">불러오는 중...</div>

  const now = new Date()
  const isOpen = now >= new Date(challenge.open_from) && now <= new Date(challenge.open_until)

  if (!store.nickname || store.challengeId !== Number(id)) {
    return (
      <main className="max-w-sm mx-auto px-4 py-24 flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">챌린지</p>
          <h1 className="text-2xl font-semibold">{challenge.title}</h1>
          {challenge.description && <p className="text-sm text-gray-400 mt-2">{challenge.description}</p>}
        </div>
        <div className="w-full bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p>📅 시세 기간: {challenge.trade_start} ~ {challenge.trade_end}</p>
          <p>💰 시드머니: {fmt(challenge.seed)}원</p>
          <p>⏰ 참여 마감: {new Date(challenge.open_until).toLocaleDateString('ko-KR')}</p>
          <p className="text-green-600 font-medium">🟢 24시간 언제든 참여 가능 · 장 마감 없음</p>
        </div>
        {!isOpen && <p className="text-sm text-red-500">참여 기간이 아닙니다</p>}
        {isOpen && <>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="닉네임 (최대 20자)"
            maxLength={20}
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && inputName.trim() && store.init(Number(id), challenge.seed, inputName.trim())}
          />
          <button
            disabled={!inputName.trim()}
            onClick={() => store.init(Number(id), challenge.seed, inputName.trim())}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            챌린지 시작
          </button>
        </>}
        <Link href="/challenges" className="text-xs text-gray-400 hover:text-gray-600">← 챌린지 목록</Link>
      </main>
    )
  }

  const seed = Number(challenge.seed)
  const evalTotal = Object.values(store.holdings).reduce((s, h) => s + h.endPrice * h.qty, 0)
  const finalValue = Number(store.cash) + evalTotal
  const profit = finalValue - seed
  const profitRate = (profit / seed) * 100
  const pnlColor = profit > 0 ? 'text-red-600' : profit < 0 ? 'text-blue-700' : 'text-gray-500'

  async function submitRanking() {
    setSubmitting(true)
    try {
      await fetch(`/api/challenges/${id}/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: store.nickname, profit, profitRate, finalValue }),
      })
      const rows = await fetch(`/api/challenges/${id}/rankings`).then(r => r.json())
      setRankings(Array.isArray(rows) ? rows : [])
      setSubmitted(true)
    } finally { setSubmitting(false) }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Link href="/challenges" className="text-sm text-gray-400 hover:text-gray-600">← 챌린지</Link>
          <h1 className="text-lg font-semibold">{challenge.title}</h1>
        </div>
        <div className="flex gap-2">
          {!submitted
            ? <button onClick={submitRanking} disabled={submitting || !isOpen} className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">{submitting ? '제출 중...' : '랭킹 등록'}</button>
            : <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">등록 완료 ✓</span>
          }
          <button onClick={() => { store.reset(); setSubmitted(false) }} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">초기화</button>
        </div>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        {[
          { label: '예수금', value: fmt(store.cash) + '원' },
          { label: '평가금액', value: fmt(evalTotal) + '원' },
          { label: '총 손익', value: (profit >= 0 ? '+' : '') + fmt(profit) + '원', color: pnlColor },
          { label: '수익률', value: fmtR(profitRate), color: pnlColor },
        ].map(m => (
          <div key={m.label} className="bg-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-lg font-medium ${m.color ?? 'text-gray-900'}`}>{m.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-right mb-5">시세 기준: {challenge.trade_start.slice(0,10)} ~ {challenge.trade_end.slice(0,10)}</p>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {tab === '트레이딩' && (
          <ChallengeQuoteSearch
            tradeStart={challenge.trade_start.slice(0, 10)}
            tradeEnd={challenge.trade_end.slice(0, 10)}
          />
        )}

        {tab === '포트폴리오' && (
          <div>
            {Object.values(store.holdings).length === 0
              ? <p className="text-sm text-gray-400 py-8 text-center">보유 종목 없음</p>
              : <div className="space-y-2">
                  {Object.values(store.holdings).map(h => {
                    const pnl = (h.endPrice - h.avgPrice) * h.qty
                    const rate = ((h.endPrice - h.avgPrice) / h.avgPrice) * 100
                    const color = pnl > 0 ? 'text-red-600' : pnl < 0 ? 'text-blue-700' : 'text-gray-500'
                    const bg = pnl > 0 ? 'bg-red-50' : pnl < 0 ? 'bg-blue-50' : 'bg-gray-50'
                    return (
                      <div key={h.symbol} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{h.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{h.qty}주 · 매수 {fmt(h.avgPrice)} → {fmt(h.endPrice)}</p>
                        </div>
                        <div className={`text-right px-3 py-1.5 rounded-xl ${bg} shrink-0`}>
                          <p className={`font-bold text-sm ${color}`}>{fmtR(rate)}</p>
                          <p className={`text-xs ${color}`}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        )}

        {tab === '랭킹' && (
          <div className="space-y-2">
            {rankings.length === 0
              ? <p className="text-sm text-gray-400 py-8 text-center">아직 등록된 기록이 없어요</p>
              : rankings.map((r, i) => {
                  const p = Number(r.profit)
                  const color = p > 0 ? 'text-red-600' : p < 0 ? 'text-blue-700' : 'text-gray-500'
                  const bg = p > 0 ? 'bg-red-50' : p < 0 ? 'bg-blue-50' : 'bg-gray-50'
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                      <span className="text-xl w-8 text-center shrink-0">{medals[i] ?? <span className="text-sm text-gray-400">{i+1}</span>}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{r.nickname}</p>
                        <p className="text-xs text-gray-400">최종 {fmt(Number(r.final_value))}원</p>
                      </div>
                      <div className={`text-right px-3 py-1.5 rounded-xl ${bg} shrink-0`}>
                        <p className={`font-bold text-sm ${color}`}>{fmtR(r.profit_rate)}</p>
                        <p className={`text-xs ${color}`}>{p >= 0 ? '+' : ''}{fmt(p)}원</p>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        )}
      </div>
    </main>
  )
}
