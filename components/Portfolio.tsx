'use client'
import { useState } from 'react'
import { useTradingStore, type Holding } from '@/lib/store'

function fmtKrw(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtUsd(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

function HoldingCard({ h, usdToKrw }: { h: Holding; usdToKrw: number }) {
  const isUsd = h.currency === 'USD'
  const pnl = (h.curPrice - h.avgPrice) * h.qty
  const pnlKrw = isUsd ? pnl * usdToKrw : pnl
  const rate = ((h.curPrice - h.avgPrice) / h.avgPrice) * 100
  const isPos = pnl >= 0
  const color = isPos ? 'text-red-600' : 'text-blue-700'
  const bg = isPos ? 'bg-red-50' : 'bg-blue-50'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{h.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isUsd ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
              {isUsd ? '🇺🇸' : '🇰🇷'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{h.qty}주 보유</p>
        </div>
        <div className={`text-right px-3 py-1.5 rounded-xl ${bg}`}>
          <p className={`font-bold text-sm ${color}`}>{fmtR(rate)}</p>
          <p className={`text-xs font-medium ${color}`}>{pnlKrw >= 0 ? '+' : ''}{fmtKrw(pnlKrw)}원</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400 mb-0.5">평균단가</p>
          <p className="font-medium">{isUsd ? '$' + fmtUsd(h.avgPrice) : fmtKrw(h.avgPrice) + '원'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400 mb-0.5">현재가</p>
          <p className="font-medium">{isUsd ? '$' + fmtUsd(h.curPrice) : fmtKrw(h.curPrice) + '원'}</p>
        </div>
      </div>
      {isUsd && (
        <p className="text-[10px] text-gray-400 mt-2 text-right">원화 환산 · 환율 {fmtKrw(usdToKrw)}원</p>
      )}
    </div>
  )
}

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
    return (
      <div className="py-16 text-center">
        <p className="text-3xl mb-3">📭</p>
        <p className="text-sm text-gray-400">아직 보유 종목이 없어요</p>
      </div>
    )
  }

  const krList = list.filter(h => h.currency !== 'USD')
  const usList = list.filter(h => h.currency === 'USD')

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={refreshAll} disabled={refreshing}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {refreshing ? '업데이트 중…' : '🔄 시세 새로고침'}
        </button>
      </div>

      {krList.length > 0 && (
        <div>
          {usList.length > 0 && <p className="text-xs font-semibold text-orange-500 mb-2">🇰🇷 국내주</p>}
          <div className="space-y-2">
            {krList.map(h => <HoldingCard key={h.symbol} h={h} usdToKrw={usdToKrw} />)}
          </div>
        </div>
      )}
      {usList.length > 0 && (
        <div>
          {krList.length > 0 && <p className="text-xs font-semibold text-blue-500 mb-2 mt-3">🇺🇸 미국주</p>}
          <div className="space-y-2">
            {usList.map(h => <HoldingCard key={h.symbol} h={h} usdToKrw={usdToKrw} />)}
          </div>
        </div>
      )}
    </div>
  )
}
