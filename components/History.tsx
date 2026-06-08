'use client'
import { useTradingStore } from '@/lib/store'

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }

export default function History() {
  const { history, reset } = useTradingStore()

  if (history.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-sm text-gray-400">거래내역 없음</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { if (confirm('전체 초기화할까요?')) reset() }}
          className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
          초기화
        </button>
      </div>
      <div className="space-y-2">
        {history.slice(0, 50).map(t => (
          <div key={t.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-bold ${
              t.side === 'buy' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {t.side === 'buy' ? '매수' : '매도'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-xs text-gray-400">{t.time}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium">{t.qty}주</p>
              <p className="text-xs text-gray-400">{fmt(t.total)}원</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
