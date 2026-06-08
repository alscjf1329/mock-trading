'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const INIT_CASH = 10_000_000

export interface Holding {
  name: string
  symbol: string
  qty: number
  avgPrice: number    // 매수 평균가 (native currency)
  curPrice: number    // 현재가 (native currency)
  avgPriceKrw: number // 매수 평균가 (KRW — 실제 출금된 단가)
  currency: string
}

export interface Trade {
  id: string
  side: 'buy' | 'sell'
  name: string
  symbol: string
  qty: number
  price: number    // native currency 단가
  priceKrw: number // KRW 환산 단가 (실제 입출금 기준)
  total: number    // native currency 합계
  totalKrw: number // KRW 합계 (실제 입출금액)
  currency: string
  time: string
}

interface TradingState {
  nickname: string
  cash: number           // 항상 KRW
  holdings: Record<string, Holding>
  history: Trade[]
  usdToKrw: number
  setNickname: (name: string) => void
  setUsdToKrw: (rate: number) => void
  buy: (symbol: string, name: string, price: number, qty: number, currency: string) => string | null
  sell: (symbol: string, price: number, qty: number) => string | null
  updatePrice: (symbol: string, price: number) => void
  reset: () => void
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      nickname: '',
      cash: INIT_CASH,
      holdings: {},
      history: [],
      usdToKrw: 1350,

      setNickname(name) { set({ nickname: name }) },
      setUsdToKrw(rate) { set({ usdToKrw: rate }) },

      buy(symbol, name, price, qty, currency) {
        const { cash, holdings, usdToKrw } = get()
        const isUsd = currency === 'USD'
        const totalNative = price * qty
        const totalKrw = isUsd ? totalNative * usdToKrw : totalNative
        const priceKrw = isUsd ? price * usdToKrw : price

        if (cash < totalKrw) return '예수금 부족'

        const prev = holdings[symbol]
        // avgPrice, avgPriceKrw 모두 가중평균
        const newQty = (prev?.qty ?? 0) + qty
        const newAvg = prev
          ? (prev.avgPrice * prev.qty + totalNative) / newQty
          : price
        const newAvgKrw = prev
          ? (prev.avgPriceKrw * prev.qty + totalKrw) / newQty
          : priceKrw

        set({
          cash: cash - totalKrw,
          holdings: {
            ...holdings,
            [symbol]: {
              name, symbol, qty: newQty,
              avgPrice: newAvg, avgPriceKrw: newAvgKrw,
              curPrice: price, currency,
            },
          },
          history: [
            {
              id: Date.now().toString(), side: 'buy',
              name, symbol, qty,
              price, priceKrw, total: totalNative, totalKrw,
              currency,
              time: new Date().toLocaleString('ko-KR'),
            },
            ...get().history,
          ],
        })
        return null
      },

      sell(symbol, price, qty) {
        const { cash, holdings, usdToKrw } = get()
        const holding = holdings[symbol]
        if (!holding || holding.qty < qty) return '보유 수량 부족'

        const isUsd = holding.currency === 'USD'
        const totalNative = price * qty
        const totalKrw = isUsd ? totalNative * usdToKrw : totalNative
        const priceKrw = isUsd ? price * usdToKrw : price

        const newQty = holding.qty - qty
        const newHoldings = { ...holdings }
        if (newQty === 0) delete newHoldings[symbol]
        else newHoldings[symbol] = { ...holding, qty: newQty, curPrice: price }

        set({
          cash: cash + totalKrw,
          holdings: newHoldings,
          history: [
            {
              id: Date.now().toString(), side: 'sell',
              name: holding.name, symbol, qty,
              price, priceKrw, total: totalNative, totalKrw,
              currency: holding.currency,
              time: new Date().toLocaleString('ko-KR'),
            },
            ...get().history,
          ],
        })
        return null
      },

      updatePrice(symbol, price) {
        const h = get().holdings[symbol]
        if (!h) return
        set({ holdings: { ...get().holdings, [symbol]: { ...h, curPrice: price } } })
      },

      reset() {
        set({ cash: INIT_CASH, holdings: {}, history: [] })
      },
    }),
    {
      name: 'mock-trading-v5',  // 스키마 변경으로 버전 올림
      storage: createJSONStorage(() => localStorage),
    }
  )
)
