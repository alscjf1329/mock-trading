'use client'
import { useState, useRef, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js'
import { useChallengeStore } from '@/lib/challengeStore'
import { POPULAR_KR, POPULAR_US } from '@/lib/popular'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

function isKrSymbol(sym: string) { return sym.endsWith('.KS') || sym.endsWith('.KQ') }
function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') + '원' }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

const ALL_STOCKS = [
  ...POPULAR_KR.map(p => ({ symbol: p.symbol, label: p.label, exchange: 'KR' })),
  ...POPULAR_US.map(p => ({ symbol: p.symbol, label: p.label, exchange: 'US' })),
]

interface QuoteData {
  symbol: string; name: string; currency: string
  startPrice: number; endPrice: number
  chart: { timestamps: string[]; closes: number[] }
}
interface Suggestion { symbol: string; label: string; exchange: string }
type OrderToast = { side: 'buy' | 'sell'; name: string; qty: number } | null

interface Props {
  tradeStart: string
  tradeEnd: string
}

export default function ChallengeQuoteSearch({ tradeStart, tradeEnd }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState<OrderToast>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const store = useChallengeStore()

  const handleInputChange = useCallback((val: string) => {
    setInput(val)
    setShowSuggestions(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setSuggestions([]); return }

    const local = ALL_STOCKS.filter(s =>
      s.label.includes(val) || s.label.toLowerCase().includes(val.toLowerCase()) ||
      s.symbol.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 6)
    setSuggestions(local)

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
        const data: any[] = await res.json()
        if (!Array.isArray(data)) return
        const merged = [...local]
        for (const d of data) {
          if (!merged.find(m => m.symbol === d.symbol)) {
            merged.push({ symbol: d.symbol, label: d.label ?? d.symbol, exchange: d.exchange ?? '' })
          }
        }
        setSuggestions(merged.slice(0, 8))
      } finally { setSearching(false) }
    }, 300)
  }, [])

  async function fetchQuote(symbol?: string) {
    const sym = symbol || input.trim()
    if (!sym) return
    setLoading(true); setError(''); setQuote(null); setShowSuggestions(false)
    try {
      const res = await fetch(`/api/historical-quote?symbol=${encodeURIComponent(sym)}&from=${tradeStart}&to=${tradeEnd}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuote(data); setInput(data.name ?? sym); setQty(1)
    } catch (e: any) { setError(e.message || '조회 실패') }
    finally { setLoading(false) }
  }

  async function handleSearch() {
    const raw = input.trim()
    if (!raw) return
    if (/^[A-Z0-9]{1,6}$/.test(raw) || raw.includes('.')) { fetchQuote(raw); return }
    const local = ALL_STOCKS.find(s => s.label === raw || s.label.toLowerCase() === raw.toLowerCase())
    if (local) { fetchQuote(local.symbol); return }
    if (suggestions.length > 0) { fetchQuote(suggestions[0].symbol); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(raw)}`)
      const data: any[] = await res.json()
      if (data?.[0]?.symbol) fetchQuote(data[0].symbol)
      else { setError('종목을 찾을 수 없어요'); setLoading(false) }
    } catch { setError('검색 실패'); setLoading(false) }
  }

  function handleOrder(side: 'buy' | 'sell') {
    if (!quote) return
    const err = side === 'buy'
      ? store.buy(quote.symbol, quote.name, quote.startPrice, quote.endPrice, qty, quote.currency)
      : store.sell(quote.symbol, qty)
    if (err) { setError(err); return }
    setToast({ side, name: quote.name, qty })
    setTimeout(() => setToast(null), 2500)
  }

  const isPos = (quote?.endPrice ?? 0) >= (quote?.startPrice ?? 0)
  const priceColor = isPos ? '#e24b4a' : '#185fa5'
  const changeRate = quote ? ((quote.endPrice - quote.startPrice) / quote.startPrice) * 100 : 0

  const chartData = quote?.chart.closes.length ? {
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

      <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-xs text-blue-600 font-medium">
        📅 시세 기준: {tradeStart} ~ {tradeEnd} · 장 마감 없음 🟢
      </div>

      {/* 인기 종목 */}
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

      {/* 검색창 */}
      <div className="relative">
        <div className="flex gap-2">
          <input type="text" value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') setShowSuggestions(false) }}
            onFocus={() => input.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="종목명 검색 (삼성물산, 팔란티어 …)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-gray-50" />
          <button onClick={handleSearch} disabled={loading}
            className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {loading ? '…' : '조회'}
          </button>
        </div>

        {showSuggestions && input.trim().length > 0 && (
          <div className="absolute z-10 left-0 right-12 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {searching && suggestions.length === 0 && (
              <p className="text-xs text-gray-400 px-4 py-3">검색 중...</p>
            )}
            {suggestions.map(s => (
              <button key={s.symbol}
                onMouseDown={() => fetchQuote(s.symbol)}
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
            {!searching && suggestions.length === 0 && (
              <p className="text-xs text-gray-400 px-4 py-3">결과 없음</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
      )}

      {/* 종목 카드 */}
      {quote && (
        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-base truncate">{quote.name}</span>
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${isKrSymbol(quote.symbol) ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                  {isKrSymbol(quote.symbol) ? '🇰🇷 KR' : '🇺🇸 US'}
                </span>
              </div>
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">● 거래가능</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">매수 기준가</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(quote.startPrice)}</p>
              </div>
              <div className="text-gray-300 text-lg">→</div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">기간 종료가</p>
                <p className="text-2xl font-bold" style={{ color: priceColor }}>{fmt(quote.endPrice)}</p>
              </div>
              <span className="text-sm font-semibold ml-1" style={{ color: priceColor }}>{fmtR(changeRate)}</span>
            </div>
          </div>

          {chartData && (
            <div className="px-1" style={{ height: 160 }}>
              <Line data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false,
                  callbacks: { label: ctx => fmt(ctx.parsed.y ?? 0) }
                }},
                scales: {
                  x: { ticks: { maxTicksLimit: 5, font: { size: 10 }, color: '#9ca3af' }, grid: { display: false }, border: { display: false } },
                  y: { position: 'right', ticks: { font: { size: 10 }, color: '#9ca3af', callback: v => Math.round(Number(v)).toLocaleString() }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
                },
              }} />
            </div>
          )}

          <div className="px-4 py-4 space-y-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">수량</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">−</button>
                <span className="w-10 text-center font-semibold text-lg">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">+</button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500">매수금액 → 청산 시</span>
              <div className="text-right">
                <p className="font-semibold">{fmt(quote.startPrice * qty)}</p>
                <p className="text-xs font-medium" style={{ color: priceColor }}>→ {fmt(quote.endPrice * qty)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOrder('buy')}
                className="py-3.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors">
                매수
              </button>
              <button onClick={() => handleOrder('sell')}
                className="py-3.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-colors">
                매도
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.side === 'buy' ? 'bg-red-500' : 'bg-blue-500'}`}>
          <span>{toast.side === 'buy' ? '✓ 매수 완료' : '✓ 매도 완료'}</span>
          <span className="opacity-80">{toast.name} {toast.qty}주</span>
        </div>
      )}
    </div>
  )
}
