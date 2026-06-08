'use client'
import { useEffect } from 'react'
import { useTradingStore, INIT_CASH } from '@/lib/store'

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + r.toFixed(2) + '%' }

export default function Summary() {
  const { cash, holdings, usdToKrw, setUsdToKrw } = useTradingStore()

  useEffect(() => {
    fetch('/api/quote?symbol=KRW%3DX')
      .then(r => r.json())
      .then(d => { if (d.price) setUsdToKrw(d.price) })
      .catch(() => {})
  }, [setUsdToKrw])

  const evalTotal = Object.values(holdings).reduce((s, h) => {
    const valueInKrw = h.currency === 'USD' ? h.curPrice * h.qty * usdToKrw : h.curPrice * h.qty
    return s + valueInKrw
  }, 0)

  const totalAsset = cash + evalTotal
  const pnl = totalAsset - INIT_CASH
  const rate = (pnl / INIT_CASH) * 100
  const pnlColor = pnl > 0 ? 'text-red-600' : pnl < 0 ? 'text-blue-700' : 'text-gray-600'

  const metrics = [
    { label: '예수금',   value: fmt(cash) + '원',                              color: '' },
    { label: '평가금액', value: fmt(evalTotal) + '원',                          color: '' },
    { label: '총 손익',  value: (pnl >= 0 ? '+' : '') + fmt(pnl) + '원',       color: pnlColor },
    { label: '수익률',   value: fmtR(rate),                                     color: pnlColor },
  ]

  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3.5 py-3">
            <p className="text-[11px] text-gray-400 mb-1 font-medium">{m.label}</p>
            <p className={`text-sm font-bold tabular truncate ${m.color || 'text-gray-900'}`}>{m.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 text-right mt-1.5 pr-0.5">
        USD/KRW {fmt(usdToKrw)}원 기준
      </p>
    </div>
  )
}
