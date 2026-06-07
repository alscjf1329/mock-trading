'use client'
import { useState } from 'react'
import { useTradingStore, INIT_CASH } from '@/lib/store'

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtUsd(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

export default function Portfolio() {
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
    return <p className="text-sm text-gray-400 py-8 text-center">보유 종목 없음</p>
  }

  const krList = list.filter(h => h.currency !== 'USD')
  const usList = list.filter(h => h.currency === 'USD')

  function HoldingRow({ h }: { h: typeof list[number] }) {
    const isUsd = h.currency === 'USD'
    const pnl = (h.curPrice - h.avgPrice) * h.qty
    const pnlKrw = isUsd ? pnl * usdToKrw : pnl
    const rate = ((h.curPrice - h.avgPrice) / h.avgPrice) * 100
    const color = pnl > 0 ? 'text-red-600' : pnl < 0 ? 'text-blue-700' : 'text-gray-500'
    return (
      <tr className="border-b border-gray-50 hover:bg-gray-50">
        <td className="py-2.5 font-medium">
          <div className="flex items-center gap-2">
            {h.name}
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isUsd ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
              {isUsd ? 'US' : 'KR'}
            </span>
          </div>
        </td>
        <td className="py-2.5 text-right text-gray-600">{h.qty}주</td>
        <td className="py-2.5 text-right text-gray-600">
          {isUsd ? '$' + fmtUsd(h.avgPrice) : fmt(h.avgPrice) + '원'}
        </td>
        <td className="py-2.5 text-right">
          {isUsd ? '$' + fmtUsd(h.curPrice) : fmt(h.curPrice) + '원'}
        </td>
        <td className={`py-2.5 text-right font-medium ${color}`}>
          {pnlKrw >= 0 ? '+' : ''}{fmt(pnlKrw)}원
          {isUsd && <span className="text-xs text-gray-400 block">(${fmtUsd(pnl)})</span>}
        </td>
        <td className={`py-2.5 text-right font-medium ${color}`}>{fmtR(rate)}</td>
      </tr>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {refreshing ? '업데이트 중...' : '시세 새로고침'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">종목</th>
              <th className="text-right pb-2 font-medium">수량</th>
              <th className="text-right pb-2 font-medium">평균단가</th>
              <th className="text-right pb-2 font-medium">현재가</th>
              <th className="text-right pb-2 font-medium">평가손익 (KRW)</th>
              <th className="text-right pb-2 font-medium">수익률</th>
            </tr>
          </thead>
          <tbody>
            {krList.length > 0 && usList.length > 0 && (
              <tr><td colSpan={6} className="pt-2 pb-1 text-xs font-semibold text-orange-500">🇰🇷 국내주</td></tr>
            )}
            {krList.map(h => <HoldingRow key={h.symbol} h={h} />)}
            {usList.length > 0 && (
              <tr><td colSpan={6} className="pt-4 pb-1 text-xs font-semibold text-blue-500">🇺🇸 미국주</td></tr>
            )}
            {usList.map(h => <HoldingRow key={h.symbol} h={h} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
