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
      <div className="py-16 text-center">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-sm text-gray-400">{tr('noHistory')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.slice(0, 50).map(item => {
        const isUsd = item.currency === 'USD'
        return (
          <div key={item.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-bold ${
              item.side === 'buy' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {item.side === 'buy' ? tr('buy') : tr('sell')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="min-w-0">
                  {(() => {
                    const local = STOCKS.find(s => s.symbol === item.symbol)
                    const [pName, sName] = resolveNames(item.name, local?.nameKo, lang)
                    return <>
                      <p className="text-sm font-medium truncate">{pName}</p>
                      {sName && <p className="text-[11px] text-gray-400 truncate">{sName}</p>}
                    </>
                  })()}
                </div>
                <span className="text-[10px] shrink-0">{isUsd ? '🇺🇸' : '🇰🇷'}</span>
              </div>
              <p className="text-xs text-gray-400">{item.time}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium">{item.qty}주</p>
              {/* native currency 단가 */}
              <p className="text-xs text-gray-400">
                {isUsd ? `$${fmtUsd(item.price)}` : `${fmtKrw(item.price)}원`}
              </p>
              {/* KRW 실제 입출금액 */}
              <p className="text-xs font-medium text-gray-600">
                {isUsd
                  ? <span>{fmtKrw(item.totalKrw)}원 <span className="text-gray-400">(${fmtUsd(item.total)})</span></span>
                  : `${fmtKrw(item.totalKrw)}원`}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
