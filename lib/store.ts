'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const INIT_CASH = 10_000_000

export interface Holding {
  name: string
  symbol: string
  qty: number
  avgPrice: number
  curPrice: number
  currency: string
}

export interface Trade {
  id: string
  side: 'buy' | 'sell'
  name: string
  symbol: string
  qty: number
  price: number
  total: number
  time: string
}

interface TradingState {
  nickname: string
  cash: number
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

      setNickname(name) {
        set({ nickname: name })
      },

      setUsdToKrw(rate) {
        set({ usdToKrw: rate })
      },

      buy(symbol, name, price, qty, currency) {
        const total = price * qty
        const { cash, holdings } = get()
        if (cash < total) return '예수금 부족'
        const prev = holdings[symbol]
        const newAvg = prev
          ? (prev.avgPrice * prev.qty + total) / (prev.qty + qty)
          : price
        set({
          cash: cash - total,
          holdings: {
            ...holdings,
            [symbol]: { name, symbol, qty: (prev?.qty ?? 0) + qty, avgPrice: newAvg, curPrice: price, currency },
          },
          history: [
            { id: Date.now().toString(), side: 'buy', name, symbol, qty, price, total, time: new Date().toLocaleString('ko-KR') },
            ...get().history,
          ],
        })
        return null
      },

      sell(symbol, price, qty) {
        const { cash, holdings } = get()
        const holding = holdings[symbol]
        if (!holding || holding.qty < qty) return '보유 수량 부족'
        const total = price * qty
        const newQty = holding.qty - qty
        const newHoldings = { ...holdings }
        if (newQty === 0) delete newHoldings[symbol]
        else newHoldings[symbol] = { ...holding, qty: newQty, curPrice: price }
        set({
          cash: cash + total,
          holdings: newHoldings,
          history: [
            { id: Date.now().toString(), side: 'sell', name: holding.name, symbol, qty, price, total, time: new Date().toLocaleString('ko-KR') },
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
      name: 'mock-trading-v4',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
