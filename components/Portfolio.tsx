'use client'
import { useState } from 'react'
import { useTradingStore, type Holding } from '@/lib/store'
import { useT, useLang, resolveNames } from '@/lib/i18n'
import { STOCKS } from '@/lib/stocks'

function fmtKrw(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtUsd(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

function HoldingCard({ h, usdToKrw, lang }: { h: Holding; usdToKrw: number; lang: 'ko' | 'en' }) {
  const isUsd = h.currency === 'USD'
  const local = STOCKS.find(s => s.symbol === h.symbol)
  const [primaryName, subName] = resolveNames(h.name, local?.nameKo, lang)
  const pnl = (h.curPrice - h.avgPrice) * h.qty
  const pnlKrw = isUsd ? pnl * usdToKrw : pnl
  const rate = ((h.curPrice - h.avgPrice) / h.avgPrice) * 100
  const isPos = pnlKrw >= 0
  const color = isPos ? 'text-red-600' : 'text-blue-700'
  const bg    = isPos ? 'bg-red-50'   : 'bg-blue-50'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm leading-tight">{primaryName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
              isUsd ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {isUsd ? '🇺🇸' : '🇰🇷'}
            </span>
          </div>
          {subName && <p className="text-[11px] text-gray-400 mt-0.5">{subName}</p>}
          <p className="text-[11px] text-gray-400 mt-0.5">{h.qty}주 보유</p>
        </div>
        <div className={`text-right px-3 py-2 rounded-xl shrink-0 ${bg}`}>
          <p className={`font-bold text-sm tabular ${color}`}>{fmtR(rate)}</p>
          <p className={`text-[11px] font-semibold tabular ${color}`}>
            {pnlKrw >= 0 ? '+' : ''}{fmtKrw(pnlKrw)}원
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-gray-400 text-[10px] mb-0.5 font-medium">평균단가</p>
          <p className="font-semibold tabular truncate">
            {isUsd ? '$' + fmtUsd(h.avgPrice) : fmtKrw(h.avgPrice) + '원'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-gray-400 text-[10px] mb-0.5 font-medium">현재가</p>
          <p className="font-semibold tabular truncate">
            {isUsd ? '$' + fmtUsd(h.curPrice) : fmtKrw(h.curPrice) + '원'}
          </p>
        </div>
      </div>
      {isUsd && (
        <p className="text-[10px] text-gray-400 mt-2 text-right tabular">
          환율 {fmtKrw(usdToKrw)}원/USD
        </p>
      )}
    </div>
  )
}

export default function Portfolio() {
  const t = useT()
  const lang = useLang()
  const { holdings, updatePrice, usdToKrw } = useTradingStore()
  const [refreshing, setRefreshing] = useState(false)
  const list = Object.values(holdings)

  async function refreshAll() {
    setRefreshing(true)
    for (const h of list) {
      try {
        const res = await fetch(`/api/quote?symbol=${h.symbol}`)
        const data = await res.json()
        if (data.price) updatePrice(h.symbol, data.price)
      } catch {}
      await new Promise(r => setTimeout(r, 300))
    }
    setRefreshing(false)
  }

  if (list.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-3xl mb-2">📭</p>
        <p className="text-sm text-gray-400">{t('noHoldings')}</p>
      </div>
    )
  }

  const krList = list.filter(h => h.currency !== 'USD')
  const usList = list.filter(h => h.currency === 'USD')

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={refreshAll} disabled={refreshing}
          className="text-[11px] px-3 py-1.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium shadow-sm">
          {refreshing ? t('updating') : t('refreshPrice')}
        </button>
      </div>

      {krList.length > 0 && (
        <div>
          {usList.length > 0 && (
            <p className="text-[11px] font-bold text-orange-500 mb-2">🇰🇷 국내주</p>
          )}
          <div className="space-y-2">
            {krList.map(h => <HoldingCard key={h.symbol} h={h} usdToKrw={usdToKrw} lang={lang} />)}
          </div>
        </div>
      )}
      {usList.length > 0 && (
        <div className={krList.length > 0 ? 'mt-3' : ''}>
          {krList.length > 0 && (
            <p className="text-[11px] font-bold text-blue-500 mb-2">🇺🇸 미국주</p>
          )}
          <div className="space-y-2">
            {usList.map(h => <HoldingCard key={h.symbol} h={h} usdToKrw={usdToKrw} lang={lang} />)}
          </div>
        </div>
      )}
    </div>
  )
}
