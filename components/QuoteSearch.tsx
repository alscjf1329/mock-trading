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

function isKrSymbol(sym: string) { return sym.endsWith('.KS') || sym.endsWith('.KQ') }
function fmtKrw(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtUsd(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtPrice(n: number, currency: string) {
  return currency === 'USD' ? '$' + fmtUsd(n) : fmtKrw(n) + '원'
}
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

interface QuoteData {
  symbol: string; name: string; price: number; previousClose: number
  change: number; changePercent: number; open: number; high: number
  low: number; volume: number; currency: string
  chart: { timestamps: string[]; closes: (number | null)[] }
}

type OrderToast = { side: 'buy' | 'sell'; name: string; qty: number; price: number; currency: string } | null

export default function QuoteSearch() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState<OrderToast>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchResults, setSearchResults] = useState<{ symbol: string; label: string; exchange: string }[]>([])
  const [searching, setSearching] = useState(false)
  const { buy, sell, usdToKrw } = useTradingStore()

  const ALL_STOCKS = [
    ...POPULAR_KR.map(p => ({ ...p, exchange: 'KR' })),
    ...POPULAR_US.map(p => ({ ...p, exchange: 'US' })),
  ]

  // 로컬 인기종목 먼저, 없으면 Yahoo 검색 결과
  const localMatches = input.trim().length > 0
    ? ALL_STOCKS.filter(s =>
        s.label.toLowerCase().includes(input.toLowerCase()) ||
        s.symbol.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 6)
    : []
  const suggestions = localMatches.length > 0 ? localMatches : searchResults

  let searchTimer: ReturnType<typeof setTimeout>
  function handleInputChange(val: string) {
    setInput(val)
    setShowSuggestions(true)
    clearTimeout(searchTimer)
    if (!val.trim()) { setSearchResults([]); return }
    const local = ALL_STOCKS.filter(s =>
      s.label.toLowerCase().includes(val.toLowerCase()) ||
      s.symbol.toLowerCase().includes(val.toLowerCase())
    )
    if (local.length > 0) { setSearchResults([]); return }
    // 로컬에 없으면 300ms 디바운스로 Yahoo 검색
    searchTimer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } finally { setSearching(false) }
    }, 300)
  }

  async function resolveSymbol(raw: string): Promise<string> {
    // 이미 심볼처럼 생겼으면 그대로
    if (/^[A-Z0-9.^=-]{1,12}$/.test(raw)) return raw
    // 로컬 인기종목에서 찾기
    const local = ALL_STOCKS.find(s => s.label === raw || s.symbol === raw)
    if (local) return local.symbol
    // Yahoo 검색으로 첫 번째 결과 심볼 반환
    const res = await fetch(`/api/search?q=${encodeURIComponent(raw)}`)
    const data = await res.json()
    if (Array.isArray(data) && data[0]?.symbol) return data[0].symbol
    return raw
  }

  async function fetchQuote(symbol?: string) {
    const raw = (symbol || input).trim()
    if (!raw) return
    setLoading(true); setError(''); setQuote(null)
    try {
      const sym = await resolveSymbol(raw)
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuote(data); setInput(sym); setQty(1)
    } catch (e: any) { setError(e.message || '조회 실패') }
    finally { setLoading(false) }
  }

  function handleOrder(side: 'buy' | 'sell') {
    if (!quote) return
    const err = side === 'buy'
      ? buy(quote.symbol, quote.name, quote.price, qty, quote.currency)
      : sell(quote.symbol, quote.price, qty)
    if (err) { setError(err); return }
    setToast({ side, name: quote.name, qty, price: quote.price, currency: quote.currency })
    setTimeout(() => setToast(null), 2500)
  }

  const isPos = (quote?.changePercent ?? 0) >= 0
  const priceColor = isPos ? '#e24b4a' : '#185fa5'
  const isUsd = quote?.currency === 'USD'
  const marketStatus = quote ? getMarketStatus(quote.currency) : null
  const totalCost = (quote?.price ?? 0) * qty
  const totalKrw = isUsd ? totalCost * usdToKrw : totalCost

  const chartData = quote ? {
    labels: quote.chart.timestamps.map(t => t.slice(5)),
    datasets: [{
      data: quote.chart.closes,
      borderColor: priceColor,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      fill: true,
      backgroundColor: isPos ? 'rgba(226,75,74,0.08)' : 'rgba(24,95,165,0.08)',
    }],
  } : null

  return (
    <div className="space-y-3">

      {/* 인기 종목 — 가로 스크롤 */}
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-semibold text-orange-500 mb-1.5">🇰🇷 국내주</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {POPULAR_KR.map(p => (
              <button key={p.symbol} onClick={() => fetchQuote(p.symbol)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  quote?.symbol === p.symbol
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-blue-500 mb-1.5">🇺🇸 미국주</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {POPULAR_US.map(p => (
              <button key={p.symbol} onClick={() => fetchQuote(p.symbol)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  quote?.symbol === p.symbol
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 검색 + 자동완성 */}
      <div className="relative">
        <div className="flex gap-2">
          <input type="text" value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); fetchQuote() } if (e.key === 'Escape') setShowSuggestions(false) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="종목명 또는 코드 검색 (삼성, NVDA …)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-gray-50" />
          <button onClick={() => { setShowSuggestions(false); fetchQuote() }} disabled={loading}
            className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {loading ? '…' : '조회'}
          </button>
        </div>

        {/* 드롭다운 */}
        {showSuggestions && input.trim().length > 0 && (searching || suggestions.length > 0) && (
          <div className="absolute z-10 left-0 right-12 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {searching && <p className="text-xs text-gray-400 px-4 py-3">검색 중...</p>}
            {suggestions.map(s => (
              <button key={s.symbol}
                onMouseDown={() => { fetchQuote(s.symbol); setShowSuggestions(false) }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isKrSymbol(s.symbol) ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {isKrSymbol(s.symbol) ? '🇰🇷' : '🇺🇸'}
                  </span>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <span className="text-xs text-gray-400">{s.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
      )}

      {/* 종목 카드 */}
      {quote && (
        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">

          {/* 가격 헤더 */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-base truncate">{quote.name}</span>
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${isUsd ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                  {isUsd ? '🇺🇸 US' : '🇰🇷 KR'}
                </span>
              </div>
              {marketStatus && (
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${marketStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {marketStatus.isOpen ? '● 개장' : '● 폐장'}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold" style={{ color: priceColor }}>
              {fmtPrice(quote.price, quote.currency)}
            </p>
            <p className="text-sm mt-0.5" style={{ color: priceColor }}>
              {quote.change >= 0 ? '+' : ''}{fmtPrice(quote.change, quote.currency)} ({fmtR(quote.changePercent)}) 전일 대비
            </p>
          </div>

          {/* 차트 */}
          {chartData && (
            <div className="px-1" style={{ height: 160 }}>
              <Line data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false,
                  callbacks: { label: ctx => fmtPrice(ctx.parsed.y ?? 0, quote.currency) }
                }},
                scales: {
                  x: { ticks: { maxTicksLimit: 5, font: { size: 10 }, color: '#9ca3af' }, grid: { display: false }, border: { display: false } },
                  y: { position: 'right', ticks: { font: { size: 10 }, color: '#9ca3af', callback: v => fmtPrice(Number(v), quote.currency) }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
                },
              }} />
            </div>
          )}

          {/* OHLCV */}
          <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-500 overflow-x-auto gap-4">
            {[
              ['시가', fmtPrice(quote.open, quote.currency)],
              ['고가', fmtPrice(quote.high, quote.currency)],
              ['저가', fmtPrice(quote.low, quote.currency)],
              ['거래량', (quote.volume ?? 0).toLocaleString()],
            ].map(([label, val]) => (
              <div key={label} className="shrink-0 text-center">
                <p className="text-gray-400 mb-0.5">{label}</p>
                <p className="font-medium text-gray-700">{val}</p>
              </div>
            ))}
          </div>

          {/* 주문 패널 */}
          <div className="px-4 py-4 space-y-3 border-t border-gray-100">

            {/* 수량 조절 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">수량</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  −
                </button>
                <span className="w-10 text-center font-semibold text-lg">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  +
                </button>
              </div>
            </div>

            {/* 예상금액 */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500">예상금액</span>
              <div className="text-right">
                <p className="font-semibold">{fmtPrice(totalCost, quote.currency)}</p>
                {isUsd && <p className="text-xs text-gray-400">≈ {fmtKrw(totalKrw)}원</p>}
              </div>
            </div>

            {/* 매수/매도 버튼 */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOrder('buy')}
                disabled={!marketStatus?.isOpen}
                className="py-3.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                매수
              </button>
              <button onClick={() => handleOrder('sell')}
                disabled={!marketStatus?.isOpen}
                className="py-3.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                매도
              </button>
            </div>
            {!marketStatus?.isOpen && (
              <p className="text-xs text-center text-gray-400">{marketStatus?.nextOpen}</p>
            )}
          </div>
        </div>
      )}

      {/* 주문 완료 토스트 */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium flex items-center gap-2 transition-all ${toast.side === 'buy' ? 'bg-red-500' : 'bg-blue-500'}`}>
          <span>{toast.side === 'buy' ? '✓ 매수 완료' : '✓ 매도 완료'}</span>
          <span className="opacity-80">{toast.name} {toast.qty}주 · {fmtPrice(toast.price, toast.currency)}</span>
        </div>
      )}
    </div>
  )
}
