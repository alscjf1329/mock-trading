'use client'
import { useTradingStore } from '@/lib/store'
import { useT, useLang, resolveNames } from '@/lib/i18n'
import { STOCKS } from '@/lib/stocks'

function fmtKrw(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtUsd(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function History() {
  const tr = useT()
  const lang = useLang()
  const { history } = useTradingStore()

  if (history.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm text-gray-400">{tr('noHistory')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.slice(0, 50).map(item => {
        const isUsd = item.currency === 'USD'
        const local = STOCKS.find(s => s.symbol === item.symbol)
        const [pName, sName] = resolveNames(item.name, local?.nameKo, lang)
        return (
          <div key={item.id} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl px-3.5 py-3 shadow-sm">
            {/* 매수/매도 뱃지 */}
            <span className={`shrink-0 text-[11px] px-2 py-1 rounded-lg font-bold ${
              item.side === 'buy' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {item.side === 'buy' ? tr('buy') : tr('sell')}
            </span>

            {/* 종목명 + 시간 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold truncate">{pName}</p>
                <span className="text-[10px] shrink-0">{isUsd ? '🇺🇸' : '🇰🇷'}</span>
              </div>
              {sName && <p className="text-[11px] text-gray-400 truncate">{sName}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
            </div>

            {/* 수량 + 금액 */}
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-gray-700 tabular">{item.qty}주</p>
              <p className="text-[11px] text-gray-500 tabular">
                {isUsd ? `$${fmtUsd(item.price)}` : `${fmtKrw(item.price)}원`}
              </p>
              <p className="text-[11px] font-semibold text-gray-700 tabular">
                {fmtKrw(item.totalKrw)}원
              </p>
              {isUsd && (
                <p className="text-[10px] text-gray-400 tabular">${fmtUsd(item.total)}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
