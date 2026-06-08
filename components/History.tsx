'use client'
import { useTradingStore } from '@/lib/store'
import { useT } from '@/lib/i18n'

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }

export default function History() {
  const tr = useT()
  const { history } = useTradingStore()

  if (history.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-sm text-gray-400">{tr('noHistory')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.slice(0, 50).map(item => (
        <div key={item.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-bold ${
            item.side === 'buy' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            {item.side === 'buy' ? tr('buy') : tr('sell')}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-gray-400">{item.time}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium">{item.qty}주</p>
            <p className="text-xs text-gray-400">{fmt(item.total)}원</p>
          </div>
        </div>
      ))}
    </div>
  )
}
