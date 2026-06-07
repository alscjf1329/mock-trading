'use client'
import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js'
import { useTradingStore } from '@/lib/store'
import { POPULAR_KR, POPULAR_US } from '@/lib/popular'
import { getMarketStatus } from '@/lib/marketHours'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

function fmt(n: number, currency: string) {
  if (currency === 'USD') return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return Math.round(n).toLocaleString('ko-KR') + '원'
}
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

interface QuoteData {
  symbol: string
  name: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  currency: string
  chart: { timestamps: string[]; closes: (number | null)[] }
}

export default function QuoteSearch() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const { buy, sell, usdToKrw } = useTradingStore()

  async function fetchQuote(symbol?: string) {
    const sym = symbol || input.trim()
    if (!sym) return
    setLoading(true)
    setError('')
    setQuote(null)
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuote(data)
      setInput(sym)
    } catch (e: any) {
      setError(e.message || '조회 실패')
    } finally {
      setLoading(false)
    }
  }

  function handleOrder(side: 'buy' | 'sell') {
    if (!quote) return
    const err = side === 'buy'
      ? buy(quote.symbol, quote.name, quote.price, qty, quote.currency)
      : sell(quote.symbol, quote.price, qty)
    if (err) alert(err)
    else alert(`${side === 'buy' ? '매수' : '매도'} 완료! ${quote.name} ${qty}주 @ ${fmt(quote.price, quote.currency)}`)
  }

  const isPos = (quote?.changePercent ?? 0) >= 0
  const priceColor = isPos ? '#e24b4a' : '#185fa5'
  const isUsd = quote?.currency === 'USD'
  const marketStatus = quote ? getMarketStatus(quote.currency) : null

  const chartData = quote ? {
    labels: quote.chart.timestamps.map(t => t.slice(5)),
    datasets: [{
      data: quote.chart.closes,
      borderColor: priceColor,
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    }],
  } : null

  const totalCost = quote ? quote.price * qty : 0
  const totalKrw = isUsd ? totalCost * usdToKrw : totalCost

  return (
    <div className="space-y-4">
      {/* 인기 종목 */}
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-semibold text-orange-500 mb-1.5">🇰🇷 국내주</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_KR.map(p => (
              <button
                key={p.symbol}
                onClick={() => fetchQuote(p.symbol)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-blue-500 mb-1.5">🇺🇸 미국주</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_US.map(p => (
              <button
                key={p.symbol}
                onClick={() => fetchQuote(p.symbol)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 직접 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchQuote()}
          placeholder="종목코드 입력 (005930.KS, NVDA, ...)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        />
        <button
          onClick={() => fetchQuote()}
          disabled={loading}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {quote && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-medium">{quote.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isUsd ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                  {isUsd ? '🇺🇸 US' : '🇰🇷 KR'}
                </span>
              </div>
              <p className="text-2xl font-medium mt-1" style={{ color: priceColor }}>
                {fmt(quote.price, quote.currency)}
              </p>
              <p className="text-sm mt-0.5" style={{ color: priceColor }}>
                {quote.change >= 0 ? '+' : ''}{fmt(quote.change, quote.currency)} ({fmtR(quote.changePercent)}) 전일 대비
              </p>
            </div>
            <div className="text-xs text-gray-400 text-right space-y-0.5">
              <p>시가 {fmt(quote.open, quote.currency)}</p>
              <p>고가 {fmt(quote.high, quote.currency)}</p>
              <p>저가 {fmt(quote.low, quote.currency)}</p>
              <p>거래량 {(quote.volume ?? 0).toLocaleString()}</p>
            </div>
          </div>

          {chartData && (
            <div style={{ height: 180 }}>
              <Line data={chartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                  x: { ticks: { maxTicksLimit: 6, font: { size: 11 } }, grid: { display: false } },
                  y: { ticks: { font: { size: 11 }, callback: (v) => fmt(Number(v), quote.currency) }, grid: { color: 'rgba(0,0,0,0.05)' } },
                },
              }} />
            </div>
          )}

          {marketStatus && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${marketStatus.isOpen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span>{marketStatus.label}</span>
              {!marketStatus.isOpen && <span className="text-gray-400">· {marketStatus.nextOpen}</span>}
            </div>
          )}

          <div className="flex gap-3 items-center pt-2 border-t border-gray-200">
            <div>
              <label className="text-xs text-gray-400 block mb-1">수량</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">예상금액</label>
              <p className="text-sm font-medium">{fmt(totalCost, quote.currency)}</p>
              {isUsd && (
                <p className="text-xs text-gray-400">≈ {Math.round(totalKrw).toLocaleString('ko-KR')}원</p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => handleOrder('buy')}
                disabled={!marketStatus?.isOpen}
                title={!marketStatus?.isOpen ? '장이 열려있지 않습니다' : undefined}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                매수
              </button>
              <button
                onClick={() => handleOrder('sell')}
                disabled={!marketStatus?.isOpen}
                title={!marketStatus?.isOpen ? '장이 열려있지 않습니다' : undefined}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                매도
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
