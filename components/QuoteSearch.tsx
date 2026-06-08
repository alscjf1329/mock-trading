'use client'
import { useState, useRef, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { useTradingStore } from '@/lib/store'
import { POPULAR_KR, POPULAR_US } from '@/lib/popular'
import { searchStocks, findStock } from '@/lib/stocks'
import { getMarketStatus } from '@/lib/marketHours'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

function isKrSymbol(sym: string) { return sym.endsWith('.KS') || sym.endsWith('.KQ') }
function fmtKrw(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtUsd(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtPrice(n: number, cur: string) { return cur === 'USD' ? '$' + fmtUsd(n) : fmtKrw(n) + '원' }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

interface QuoteData {
  symbol: string; name: string; price: number; previousClose: number
  change: number; changePercent: number; open: number; high: number
  low: number; volume: number; currency: string
  chart: { timestamps: string[]; closes: (number | null)[] }
}
interface Suggestion { symbol: string; name: string; market: 'KR' | 'US' }
type OrderToast = { side: 'buy' | 'sell'; name: string; qty: number; price: number; currency: string } | null

export default function QuoteSearch() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [amountMode, setAmountMode] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [toast, setToast] = useState<OrderToast>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { buy, sell, usdToKrw, cash } = useTradingStore()

  // 금액 모드에서 수량 계산
  const price = quote?.price ?? 0
  const priceKrw = quote?.currency === 'USD' ? price * usdToKrw : price
  const amountKrw = Number(amountInput.replace(/[^0-9]/g, '')) || 0
  const qtyFromAmount = priceKrw > 0 ? Math.floor(amountKrw / priceKrw) : 0
  const effectiveQty = amountMode ? qtyFromAmount : qty

  const handleInputChange = useCallback((val: string) => {
    setInput(val)
    setShowSuggestions(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setSuggestions([]); return }

    // 로컬 즉시 표시
    const local = searchStocks(val)
    setSuggestions(local.map(s => ({ symbol: s.symbol, name: s.name, market: s.market })))
  }, [])

  async function fetchQuote(symbol: string) {
    if (!symbol) return
    setLoading(true); setError(''); setQuote(null); setShowSuggestions(false); setQty(1)
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuote(data); setInput(data.name ?? symbol)
    } catch (e: any) { setError(e.message || '조회 실패') }
    finally { setLoading(false) }
  }

  async function handleSearch() {
    const raw = input.trim()
    if (!raw) return
    // 1. 심볼 직접 입력
    if (/^[A-Z0-9]{1,6}$/.test(raw) || raw.includes('.')) { fetchQuote(raw); return }
    // 2. 로컬 alias 매칭
    const found = findStock(raw)
    if (found) { fetchQuote(found.symbol); return }
    // 3. 로컬 검색 결과 첫 번째
    const results = searchStocks(raw)
    if (results.length > 0) { fetchQuote(results[0].symbol); return }
    // 4. Yahoo 검색 fallback (영문 등 알 수 없는 종목)
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(raw)}`)
      const data: any[] = await res.json()
      if (data?.[0]?.symbol) fetchQuote(data[0].symbol)
      else { setError('종목을 찾을 수 없어요'); setLoading(false) }
    } catch { setError('검색 실패'); setLoading(false) }
  }

  function handleOrder(side: 'buy' | 'sell') {
    if (!quote || effectiveQty < 1) return
    const err = side === 'buy'
      ? buy(quote.symbol, quote.name, quote.price, effectiveQty, quote.currency)
      : sell(quote.symbol, quote.price, effectiveQty)
    if (err) { setError(err); return }
    setToast({ side, name: quote.name, qty: effectiveQty, price: quote.price, currency: quote.currency })
    setTimeout(() => setToast(null), 2500)
  }

  const isPos = (quote?.changePercent ?? 0) >= 0
  const priceColor = isPos ? '#e24b4a' : '#185fa5'
  const isUsd = quote?.currency === 'USD'
  const marketStatus = quote ? getMarketStatus(quote.currency) : null
  const totalCost = price * effectiveQty
  const totalKrw = isUsd ? totalCost * usdToKrw : totalCost

  const chartData = quote ? {
    labels: quote.chart.timestamps.map(t => t.slice(5)),
    datasets: [{ data: quote.chart.closes, borderColor: priceColor, borderWidth: 2, pointRadius: 0, tension: 0.3, fill: true, backgroundColor: isPos ? 'rgba(226,75,74,0.08)' : 'rgba(24,95,165,0.08)' }],
  } : null

  return (
    <div className="space-y-3">
      {/* 인기 종목 */}
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-semibold text-orange-500 mb-1.5">🇰🇷 국내주</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {POPULAR_KR.map(p => (
              <button key={p.symbol} onClick={() => fetchQuote(p.symbol)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${quote?.symbol === p.symbol ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600'}`}>
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
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${quote?.symbol === p.symbol ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'}`}>
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
            placeholder="검색 (삼성물산, 팔란티어, NVDA …)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-gray-50" />
          <button onClick={handleSearch} disabled={loading}
            className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {loading ? '…' : '조회'}
          </button>
        </div>

        {showSuggestions && input.trim().length > 0 && suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-12 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map(s => (
              <button key={s.symbol} onMouseDown={() => fetchQuote(s.symbol)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.market === 'KR' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {s.market === 'KR' ? '🇰🇷' : '🇺🇸'}
                  </span>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <span className="text-xs text-gray-400">{s.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}

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
            <p className="text-3xl font-bold" style={{ color: priceColor }}>{fmtPrice(quote.price, quote.currency)}</p>
            <p className="text-sm mt-0.5" style={{ color: priceColor }}>
              {quote.change >= 0 ? '+' : ''}{fmtPrice(quote.change, quote.currency)} ({fmtR(quote.changePercent)}) 전일 대비
            </p>
          </div>

          {/* 차트 */}
          {chartData && (
            <div className="px-1" style={{ height: 160 }}>
              <Line data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => fmtPrice(ctx.parsed.y ?? 0, quote.currency) } } },
                scales: {
                  x: { ticks: { maxTicksLimit: 5, font: { size: 10 }, color: '#9ca3af' }, grid: { display: false }, border: { display: false } },
                  y: { position: 'right', ticks: { font: { size: 10 }, color: '#9ca3af', callback: v => fmtPrice(Number(v), quote.currency) }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
                },
              }} />
            </div>
          )}

          {/* OHLCV */}
          <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-500 overflow-x-auto gap-4">
            {[['시가', fmtPrice(quote.open, quote.currency)], ['고가', fmtPrice(quote.high, quote.currency)], ['저가', fmtPrice(quote.low, quote.currency)], ['거래량', (quote.volume ?? 0).toLocaleString()]].map(([label, val]) => (
              <div key={label} className="shrink-0 text-center">
                <p className="text-gray-400 mb-0.5">{label}</p>
                <p className="font-medium text-gray-700">{val}</p>
              </div>
            ))}
          </div>

          {/* 주문 패널 */}
          <div className="px-4 py-4 space-y-3 border-t border-gray-100">

            {/* 수량/금액 토글 */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button onClick={() => setAmountMode(false)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${!amountMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                수량
              </button>
              <button onClick={() => setAmountMode(true)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${amountMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                금액
              </button>
            </div>

            {!amountMode ? (
              /* 수량 모드 */
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">수량</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">−</button>
                  <span className="w-10 text-center font-semibold text-lg">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">+</button>
                </div>
              </div>
            ) : (
              /* 금액 모드 */
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text" inputMode="numeric"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="투자 금액 (원)"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                {/* 빠른 금액 버튼 */}
                <div className="flex gap-1.5">
                  {['100000', '500000', '1000000', '3000000'].map(v => (
                    <button key={v} onClick={() => setAmountInput(v)}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
                      {Number(v).toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {['5000000', '10000000'].map(v => (
                    <button key={v} onClick={() => setAmountInput(v)}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
                      {Number(v).toLocaleString()}
                    </button>
                  ))}
                  <button onClick={() => setAmountInput(String(Math.floor(cash)))}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
                    전액
                  </button>
                </div>
                {amountKrw > 0 && (
                  <p className="text-xs text-gray-400 text-right">
                    → <span className="font-medium text-gray-700">{qtyFromAmount}주</span> 매수 가능
                    {qtyFromAmount === 0 && <span className="text-red-400 ml-1">(금액 부족)</span>}
                  </p>
                )}
              </div>
            )}

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
                disabled={!marketStatus?.isOpen || effectiveQty < 1}
                className="py-3.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                매수 {effectiveQty > 0 ? `${effectiveQty}주` : ''}
              </button>
              <button onClick={() => handleOrder('sell')}
                disabled={!marketStatus?.isOpen || effectiveQty < 1}
                className="py-3.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                매도 {effectiveQty > 0 ? `${effectiveQty}주` : ''}
              </button>
            </div>
            {!marketStatus?.isOpen && (
              <p className="text-xs text-center text-gray-400">{marketStatus?.nextOpen}</p>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.side === 'buy' ? 'bg-red-500' : 'bg-blue-500'}`}>
          <span>{toast.side === 'buy' ? '✓ 매수 완료' : '✓ 매도 완료'}</span>
          <span className="opacity-80">{toast.name} {toast.qty}주 · {fmtPrice(toast.price, toast.currency)}</span>
        </div>
      )}
    </div>
  )
}
