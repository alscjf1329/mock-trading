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
  const pnlColor = pnl > 0 ? 'text-red-600' : pnl < 0 ? 'text-blue-700' : 'text-gray-500'

  return (
    <div className="space-y-2 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '예수금', value: fmt(cash) + '원' },
          { label: '평가금액', value: fmt(evalTotal) + '원' },
          { label: '총 손익', value: (pnl >= 0 ? '+' : '') + fmt(pnl) + '원', color: pnlColor },
          { label: '수익률', value: fmtR(rate), color: pnlColor },
        ].map(m => (
          <div key={m.label} className="bg-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-lg font-medium ${m.color ?? 'text-gray-900'}`}>{m.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-right">USD 환율 적용 {fmt(usdToKrw)}원</p>
    </div>
  )
}
