'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useChallengeStore } from '@/lib/challengeStore'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js'
import { POPULAR_KR, POPULAR_US } from '@/lib/popular'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

interface Challenge {
  id: number; title: string; description: string
  trade_start: string; trade_end: string
  open_from: string; open_until: string; seed: number
}
interface RankRow { nickname: string; profit: number; profit_rate: number; final_value: number }
interface QuoteData {
  symbol: string; name: string; currency: string
  startPrice: number; endPrice: number
  chart: { timestamps: string[]; closes: number[] }
}

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
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')

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

  const evalTotal = Object.values(store.holdings).reduce((s, h) => s + h.endPrice * h.qty, 0)
  const finalValue = store.cash + evalTotal
  const profit = finalValue - challenge.seed
  const profitRate = (profit / challenge.seed) * 100
  const pnlColor = profit > 0 ? 'text-red-600' : profit < 0 ? 'text-blue-700' : 'text-gray-500'

  async function fetchQuote(sym?: string) {
    const symbol = sym ?? input.trim()
    if (!symbol) return
    setLoading(true); setError(''); setQuote(null)
    try {
      const from = challenge!.trade_start.slice(0, 10)
      const to = challenge!.trade_end.slice(0, 10)
      const res = await fetch(`/api/historical-quote?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuote(data); setInput(symbol)
    } catch (e: any) { setError(e.message || '조회 실패') }
    finally { setLoading(false) }
  }

  function handleOrder(side: 'buy' | 'sell') {
    if (!quote) return
    const err = side === 'buy'
      ? store.buy(quote.symbol, quote.name, quote.startPrice, quote.endPrice, qty, quote.currency)
      : store.sell(quote.symbol, qty)
    if (err) alert(err)
  }

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
      <div className="grid grid-cols-4 gap-3 mb-2">
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
      <p className="text-xs text-gray-400 text-right mb-5">시세 기준: {challenge.trade_start} ~ {challenge.trade_end}</p>

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
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-semibold text-orange-500 mb-1.5">🇰🇷 국내주</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_KR.map(p => <button key={p.symbol} onClick={() => fetchQuote(p.symbol)} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-700 transition-colors">{p.label}</button>)}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-blue-500 mb-1.5">🇺🇸 미국주</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_US.map(p => <button key={p.symbol} onClick={() => fetchQuote(p.symbol)} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-700 transition-colors">{p.label}</button>)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchQuote()}
                placeholder="종목코드 (005930.KS, NVDA ...)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              <button onClick={() => fetchQuote()} disabled={loading} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {loading ? '조회 중...' : '조회'}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}

            {quote && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{quote.name}</p>
                    <div className="flex gap-4 text-sm mt-1">
                      <span className="text-gray-500">매수 기준가 <span className="text-gray-900 font-medium">{fmt(quote.startPrice)}</span></span>
                      <span className="text-gray-500">→ 종료가 <span className={`font-medium ${quote.endPrice >= quote.startPrice ? 'text-red-600' : 'text-blue-700'}`}>{fmt(quote.endPrice)}</span></span>
                      <span className={`font-medium text-sm ${quote.endPrice >= quote.startPrice ? 'text-red-600' : 'text-blue-700'}`}>
                        {fmtR(((quote.endPrice - quote.startPrice) / quote.startPrice) * 100)}
                      </span>
                    </div>
                  </div>
                </div>

                {quote.chart.closes.length > 0 && (
                  <div style={{ height: 160 }}>
                    <Line
                      data={{
                        labels: quote.chart.timestamps.map(t => t.slice(5)),
                        datasets: [{ data: quote.chart.closes, borderColor: quote.endPrice >= quote.startPrice ? '#e24b4a' : '#185fa5', borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: false }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 5, font: { size: 10 } }, grid: { display: false } }, y: { ticks: { font: { size: 10 }, callback: v => fmt(Number(v)) }, grid: { color: 'rgba(0,0,0,0.05)' } } } }}
                    />
                  </div>
                )}

                <div className="flex gap-3 items-center pt-2 border-t border-gray-200">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">수량</label>
                    <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="text-xs text-gray-400 mb-1">예상 매수금액 → 청산 시</p>
                    <p><span className="text-gray-500">{fmt(quote.startPrice * qty)}</span> → <span className="font-medium">{fmt(quote.endPrice * qty)}</span></p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => handleOrder('buy')} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">매수</button>
                    <button onClick={() => handleOrder('sell')} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">매도</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === '포트폴리오' && (
          <div>
            {Object.values(store.holdings).length === 0
              ? <p className="text-sm text-gray-400 py-8 text-center">보유 종목 없음</p>
              : <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2">종목</th><th className="text-right pb-2">수량</th>
                  <th className="text-right pb-2">매수가</th><th className="text-right pb-2">종료가</th>
                  <th className="text-right pb-2">평가손익</th><th className="text-right pb-2">수익률</th>
                </tr></thead>
                <tbody>
                  {Object.values(store.holdings).map(h => {
                    const pnl = (h.endPrice - h.avgPrice) * h.qty
                    const rate = ((h.endPrice - h.avgPrice) / h.avgPrice) * 100
                    const color = pnl > 0 ? 'text-red-600' : pnl < 0 ? 'text-blue-700' : 'text-gray-500'
                    return (
                      <tr key={h.symbol} className="border-b border-gray-50">
                        <td className="py-2.5 font-medium">{h.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{h.qty}주</td>
                        <td className="py-2.5 text-right text-gray-600">{fmt(h.avgPrice)}</td>
                        <td className="py-2.5 text-right">{fmt(h.endPrice)}</td>
                        <td className={`py-2.5 text-right font-medium ${color}`}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</td>
                        <td className={`py-2.5 text-right font-medium ${color}`}>{fmtR(rate)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            }
          </div>
        )}

        {tab === '랭킹' && (
          <div>
            {rankings.length === 0
              ? <p className="text-sm text-gray-400 py-8 text-center">아직 등록된 기록이 없어요</p>
              : <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 w-8">#</th><th className="text-left pb-2">닉네임</th>
                  <th className="text-right pb-2">수익금</th><th className="text-right pb-2">수익률</th>
                  <th className="text-right pb-2">최종자산</th>
                </tr></thead>
                <tbody>
                  {rankings.map((r, i) => {
                    const p = Number(r.profit)
                    const color = p > 0 ? 'text-red-600' : p < 0 ? 'text-blue-700' : 'text-gray-500'
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 text-lg">{medals[i] ?? <span className="text-gray-400 text-sm">{i + 1}</span>}</td>
                        <td className="py-3 font-medium">{r.nickname}</td>
                        <td className={`py-3 text-right font-medium ${color}`}>{p >= 0 ? '+' : ''}{fmt(p)}원</td>
                        <td className={`py-3 text-right font-medium ${color}`}>{fmtR(r.profit_rate)}</td>
                        <td className="py-3 text-right text-gray-600">{fmt(Number(r.final_value))}원</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            }
          </div>
        )}
      </div>
    </main>
  )
}
