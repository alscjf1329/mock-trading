'use client'
import { useTradingStore } from '@/lib/store'

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }

export default function History() {
  const { history, reset } = useTradingStore()

  if (history.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">거래내역 없음</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { if (confirm('전체 초기화할까요?')) reset() }}
          className="text-xs px-3 py-1.5 border border-red-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          초기화
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {history.slice(0, 50).map(t => (
          <div key={t.id} className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                t.side === 'buy' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {t.side === 'buy' ? '매수' : '매도'}
              </span>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-gray-400">{t.time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">{t.qty}주 × {fmt(t.price)}</p>
              <p className="text-xs text-gray-400">{fmt(t.total)}원</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
