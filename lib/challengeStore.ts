'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ChallengeHolding {
  name: string
  symbol: string
  qty: number
  avgPrice: number      // 매수 단가 native
  avgPriceKrw: number   // 매수 단가 KRW 환산
  curPrice: number      // 현재 시세 native (조회 시 갱신)
  currency: string
}

export interface ChallengeTrade {
  id: string
  side: 'buy' | 'sell'
  name: string
  symbol: string
  qty: number
  price: number
  priceKrw: number
  total: number
  totalKrw: number
  currency: string
  historicalDate: string // 거래 시점의 과거 날짜
}

interface ChallengeState {
  challengeId: number | null
  nickname: string
  cash: number
  seed: number
  usdToKrw: number
  holdings: Record<string, ChallengeHolding>
  history: ChallengeTrade[]
  init: (challengeId: number, seed: number, nickname: string) => void
  setUsdToKrw: (rate: number) => void
  buy: (symbol: string, name: string, price: number, qty: number, currency: string, historicalDate: string) => string | null
  sell: (symbol: string, qty: number, historicalDate: string) => string | null
  updatePrice: (symbol: string, price: number) => void
  reset: () => void
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      challengeId: null,
      nickname: '',
      cash: 10_000_000,
      seed: 10_000_000,
      usdToKrw: 1350,
      holdings: {},
      history: [],

      init(challengeId, seed, nickname) {
        const cur = get()
        if (cur.challengeId === challengeId && cur.nickname === nickname) return
        const numSeed = Number(seed)
        set({ challengeId, seed: numSeed, cash: numSeed, nickname, holdings: {}, history: [] })
      },

      setUsdToKrw(rate) { set({ usdToKrw: rate }) },

      buy(symbol, name, price, qty, currency, historicalDate) {
        const { cash, holdings, usdToKrw } = get()
        const isUsd = currency === 'USD'
        const totalNative = price * qty
        const totalKrw = isUsd ? totalNative * usdToKrw : totalNative
        const priceKrw = isUsd ? price * usdToKrw : price

        if (cash < totalKrw) return '예수금 부족'

        const prev = holdings[symbol]
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
              currency, historicalDate,
            },
            ...get().history,
          ],
        })
        return null
      },

      sell(symbol, qty, historicalDate) {
        const { cash, holdings, usdToKrw } = get()
        const h = holdings[symbol]
        if (!h || h.qty < qty) return '보유 수량 부족'

        const isUsd = h.currency === 'USD'
        const price = h.curPrice
        const totalNative = price * qty
        const totalKrw = isUsd ? totalNative * usdToKrw : totalNative
        const priceKrw = isUsd ? price * usdToKrw : price

        const newQty = h.qty - qty
        const newHoldings = { ...holdings }
        if (newQty === 0) delete newHoldings[symbol]
        else newHoldings[symbol] = { ...h, qty: newQty }

        set({
          cash: cash + totalKrw,
          holdings: newHoldings,
          history: [
            {
              id: Date.now().toString(), side: 'sell',
              name: h.name, symbol, qty,
              price, priceKrw, total: totalNative, totalKrw,
              currency: h.currency, historicalDate,
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
        const { seed } = get()
        set({ cash: seed, holdings: {}, history: [] })
      },
    }),
    {
      name: 'challenge-trading-v3',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
