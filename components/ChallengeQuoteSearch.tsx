'use client'
import { useState, useRef, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { useChallengeStore } from '@/lib/challengeStore'
import { POPULAR_KR, POPULAR_US } from '@/lib/popular'
import { searchStocks, findStock } from '@/lib/stocks'
import { useT } from '@/lib/i18n'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

function isKrSymbol(sym: string) { return sym.endsWith('.KS') || sym.endsWith('.KQ') }
function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') + '원' }
function fmtKrw(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

function tickSize(price: number): number {
  if (price < 1_000) return 1
  if (price < 5_000) return 5
  if (price < 10_000) return 10
  if (price < 50_000) return 50
  if (price < 100_000) return 100
  if (price < 500_000) return 500
  return 1_000
}

const DEFAULT_AMOUNT = 1_000_000

interface QuoteData {
  symbol: string; name: string; currency: string
  startPrice: number; endPrice: number
  chart: { timestamps: string[]; closes: number[] }
}
interface Suggestion { symbol: string; name: string; market: 'KR' | 'US' }
type OrderToast = { side: 'buy' | 'sell'; name: string; qty: number } | null

export default function ChallengeQuoteSearch({ tradeStart, tradeEnd }: { tradeStart: string; tradeEnd: string }) {
  const t = useT()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [amountMode, setAmountMode] = useState(false)
  const [amount, setAmount] = useState(DEFAULT_AMOUNT)
  const [toast, setToast] = useState<OrderToast>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const store = useChallengeStore()

  const startPrice = quote?.startPrice ?? 0
  const isUsd = quote?.currency === 'USD'
  const startPriceKrw = isUsd ? startPrice * store.usdToKrw : startPrice
  const endPriceKrw = isUsd ? (quote?.endPrice ?? 0) * store.usdToKrw : (quote?.endPrice ?? 0)
  const tick = tickSize(isUsd ? 100 : startPrice)  // USD는 금액 단위 100원
  const qtyFromAmount = startPriceKrw > 0 ? Math.floor(amount / startPriceKrw) : 0
  const effectiveQty = amountMode ? qtyFromAmount : qty

  function switchMode(mode: boolean) {
    setAmountMode(mode)
    if (mode) setAmount(Math.min(DEFAULT_AMOUNT, store.cash))
  }

  const handleInputChange = useCallback((val: string) => {
    setInput(val)
    setShowSuggestions(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setSuggestions([]); return }
    const local = searchStocks(val)
    setSuggestions(local.map(s => ({ symbol: s.symbol, name: s.name, market: s.market })))
  }, [])

  async function fetchQuote(symbol: string) {
    if (!symbol) return
    setLoading(true); setError(''); setQuote(null); setShowSuggestions(false); setQty(1)
    try {
      const res = await fetch(`/api/historical-quote?symbol=${encodeURIComponent(symbol)}&from=${tradeStart}&to=${tradeEnd}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuote(data); setInput(data.name ?? symbol)
      if (amountMode) setAmount(Math.min(DEFAULT_AMOUNT, store.cash))
    } catch (e: any) { setError(e.message || '조회 실패') }
    finally { setLoading(false) }
  }

  async function handleSearch() {
    const raw = input.trim()
    if (!raw) return
    if (/^[A-Z0-9]{1,6}$/.test(raw) || raw.includes('.')) { fetchQuote(raw); return }
    const found = findStock(raw)
    if (found) { fetchQuote(found.symbol); return }
    const results = searchStocks(raw)
    if (results.length > 0) { fetchQuote(results[0].symbol); return }
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
      ? store.buy(quote.symbol, quote.name, quote.startPrice, quote.endPrice, effectiveQty, quote.currency)
      : store.sell(quote.symbol, effectiveQty)
    if (err) { setError(err); return }
    setToast({ side, name: quote.name, qty: effectiveQty })
    setTimeout(() => setToast(null), 2500)
  }

  const isPos = (quote?.endPrice ?? 0) >= (quote?.startPrice ?? 0)
  const priceColor = isPos ? '#e24b4a' : '#185fa5'
  const changeRate = quote ? ((quote.endPrice - quote.startPrice) / quote.startPrice) * 100 : 0

  const chartData = quote?.chart.closes.length ? {
    labels: quote.chart.timestamps.map(t => t.slice(5)),
    datasets: [{ data: quote.chart.closes, borderColor: priceColor, borderWidth: 2, pointRadius: 0, tension: 0.3, fill: true, backgroundColor: isPos ? 'rgba(226,75,74,0.08)' : 'rgba(24,95,165,0.08)' }],
  } : null

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-xs text-blue-600 font-medium">
        📅 {tradeStart} ~ {tradeEnd} · 🟢 {t('marketOpen').replace('●', '').trim()} 24h
      </div>

      {/* 인기 종목 */}
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-semibold text-orange-500 mb-1.5">{t('kr')}</p>
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
          <p className="text-[11px] font-semibold text-blue-500 mb-1.5">{t('us')}</p>
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
            placeholder={t('search')}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-gray-50" />
          <button onClick={handleSearch} disabled={loading}
            className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {loading ? t('loading') : t('lookup')}
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
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">● Open 24h</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">{t('buy')} 기준가</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isUsd ? `$${quote.startPrice.toFixed(2)}` : fmt(quote.startPrice)}
                </p>
                {isUsd && <p className="text-xs text-gray-400">{fmt(startPriceKrw)}</p>}
              </div>
              <span className="text-gray-300 text-lg">→</span>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">기간 종료가</p>
                <p className="text-2xl font-bold" style={{ color: priceColor }}>
                  {isUsd ? `$${quote.endPrice.toFixed(2)}` : fmt(quote.endPrice)}
                </p>
                {isUsd && <p className="text-xs" style={{ color: priceColor }}>{fmt(endPriceKrw)}</p>}
              </div>
              <span className="text-sm font-semibold" style={{ color: priceColor }}>{fmtR(changeRate)}</span>
            </div>
          </div>

          {chartData && (
            <div className="px-1" style={{ height: 160 }}>
              <Line data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => fmt(ctx.parsed.y ?? 0) } } },
                scales: {
                  x: { ticks: { maxTicksLimit: 5, font: { size: 10 }, color: '#9ca3af' }, grid: { display: false }, border: { display: false } },
                  y: { position: 'right', ticks: { font: { size: 10 }, color: '#9ca3af', callback: v => Math.round(Number(v)).toLocaleString() }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false } },
                },
              }} />
            </div>
          )}

          <div className="px-4 py-4 space-y-3 border-t border-gray-100">
            {/* 수량/금액 토글 */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button onClick={() => switchMode(false)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${!amountMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>{t('qty')}</button>
              <button onClick={() => switchMode(true)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${amountMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>{t('amount')}</button>
            </div>

            {!amountMode ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t('qty')}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors select-none">−</button>
                    <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center font-semibold text-lg border-0 focus:outline-none bg-transparent" />
                    <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-full border border-gray-200 text-lg font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors select-none">+</button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[1, 5, 10, 50, 100].map(n => (
                    <button key={n} onClick={() => setQty(n)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${qty === n ? 'border-gray-400 bg-gray-100 text-gray-900 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setAmount(a => Math.max(tick, Math.round((a - tick) / tick) * tick))}
                    className="w-10 h-10 rounded-xl border border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors select-none shrink-0">−</button>
                  <div className="flex-1 relative">
                    <input type="number" min={0} step={tick} value={amount}
                      onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-right font-semibold focus:outline-none focus:border-gray-400 pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                  </div>
                  <button onClick={() => setAmount(a => Math.round((a + tick) / tick) * tick)}
                    className="w-10 h-10 rounded-xl border border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors select-none shrink-0">+</button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[{ label: '10만', v: 100_000 }, { label: '50만', v: 500_000 }, { label: '100만', v: 1_000_000 }, { label: '500만', v: 5_000_000 }].map(({ label, v }) => (
                    <button key={v} onClick={() => setAmount(v)}
                      className={`text-xs py-1.5 rounded-lg border transition-colors ${amount === v ? 'border-gray-400 bg-gray-100 text-gray-900 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAmount(Math.floor(store.cash / tick) * tick)}
                  className="w-full text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
                  {t('allIn')} ({fmtKrw(store.cash)}원)
                </button>
                {amount > 0 && (
                  <p className="text-xs text-gray-400 text-right">
                    → <span className="font-semibold text-gray-700">{qtyFromAmount}주</span>
                    {qtyFromAmount === 0 && <span className="text-red-400 ml-1">(금액 부족)</span>}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500">{t('buy')} → {t('sell')}</span>
              <div className="text-right">
                <p className="font-semibold">{fmt(startPriceKrw * effectiveQty)}</p>
                {isUsd && <p className="text-xs text-gray-400">${(quote.startPrice * effectiveQty).toFixed(2)}</p>}
                <p className="text-xs font-medium" style={{ color: priceColor }}>→ {fmt(endPriceKrw * effectiveQty)}</p>
                {isUsd && <p className="text-xs" style={{ color: priceColor }}>${(quote.endPrice * effectiveQty).toFixed(2)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOrder('buy')} disabled={effectiveQty < 1}
                className="py-3.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:opacity-40 transition-colors">
                {t('buy')} {effectiveQty > 0 ? `${effectiveQty}주` : ''}
              </button>
              <button onClick={() => handleOrder('sell')} disabled={effectiveQty < 1}
                className="py-3.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 transition-colors">
                {t('sell')} {effectiveQty > 0 ? `${effectiveQty}주` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium flex items-center gap-2 whitespace-nowrap ${toast.side === 'buy' ? 'bg-red-500' : 'bg-blue-500'}`}>
          <span>{toast.side === 'buy' ? t('buyComplete') : t('sellComplete')}</span>
          <span className="opacity-80">{toast.name} {toast.qty}주</span>
        </div>
      )}
    </div>
  )
}
