'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ChallengeHolding {
  name: string
  symbol: string
  qty: number
  avgPrice: number   // 매수 기준가 (챌린지 시작일 종가)
  endPrice: number   // 챌린지 종료일 종가
  currency: string
}

export interface ChallengeTrade {
  id: string
  side: 'buy' | 'sell'
  name: string
  symbol: string
  qty: number
  price: number
  total: number
}

interface ChallengeState {
  challengeId: number | null
  nickname: string
  cash: number
  seed: number
  holdings: Record<string, ChallengeHolding>
  history: ChallengeTrade[]
  init: (challengeId: number, seed: number, nickname: string) => void
  buy: (symbol: string, name: string, startPrice: number, endPrice: number, qty: number, currency: string) => string | null
  sell: (symbol: string, qty: number) => string | null
  reset: () => void
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      challengeId: null,
      nickname: '',
      cash: 10_000_000,
      seed: 10_000_000,
      holdings: {},
      history: [],

      init(challengeId, seed, nickname) {
        const cur = get()
        if (cur.challengeId === challengeId && cur.nickname === nickname) return
        const numSeed = Number(seed)
        set({ challengeId, seed: numSeed, cash: numSeed, nickname, holdings: {}, history: [] })
      },

      buy(symbol, name, startPrice, endPrice, qty, currency) {
        const total = startPrice * qty
        const { cash, holdings } = get()
        if (cash < total) return '예수금 부족'
        const prev = holdings[symbol]
        const newAvg = prev
          ? (prev.avgPrice * prev.qty + total) / (prev.qty + qty)
          : startPrice
        set({
          cash: cash - total,
          holdings: {
            ...holdings,
            [symbol]: { name, symbol, qty: (prev?.qty ?? 0) + qty, avgPrice: newAvg, endPrice, currency },
          },
          history: [
            { id: Date.now().toString(), side: 'buy', name, symbol, qty, price: startPrice, total },
            ...get().history,
          ],
        })
        return null
      },

      sell(symbol, qty) {
        const { cash, holdings } = get()
        const h = holdings[symbol]
        if (!h || h.qty < qty) return '보유 수량 부족'
        const total = h.endPrice * qty
        const newQty = h.qty - qty
        const newHoldings = { ...holdings }
        if (newQty === 0) delete newHoldings[symbol]
        else newHoldings[symbol] = { ...h, qty: newQty }
        set({
          cash: cash + total,
          holdings: newHoldings,
          history: [
            { id: Date.now().toString(), side: 'sell', name: h.name, symbol, qty, price: h.endPrice, total },
            ...get().history,
          ],
        })
        return null
      },

      reset() {
        const { seed } = get()
        set({ cash: seed, holdings: {}, history: [] })
      },
    }),
    {
      name: 'challenge-trading-v1',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
