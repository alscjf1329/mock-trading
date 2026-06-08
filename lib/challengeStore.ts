'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ChallengeHolding {
  name: string
  symbol: string
  qty: number
  avgPrice: number      // 매수 기준가 native
  avgPriceKrw: number   // 매수 기준가 KRW 환산
  endPrice: number      // 챌린지 종료일 종가 native
  currency: string
}

export interface ChallengeTrade {
  id: string
  side: 'buy' | 'sell'
  name: string
  symbol: string
  qty: number
  price: number         // native currency 단가
  priceKrw: number      // KRW 환산 단가
  total: number         // native currency 합계
  totalKrw: number      // KRW 합계
  currency: string
}

interface ChallengeState {
  challengeId: number | null
  nickname: string
  cash: number          // 항상 KRW
  seed: number          // 초기 시드 KRW
  usdToKrw: number
  holdings: Record<string, ChallengeHolding>
  history: ChallengeTrade[]
  init: (challengeId: number, seed: number, nickname: string) => void
  setUsdToKrw: (rate: number) => void
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

      buy(symbol, name, startPrice, endPrice, qty, currency) {
        const { cash, holdings, usdToKrw } = get()
        const isUsd = currency === 'USD'
        const totalNative = startPrice * qty
        const totalKrw = isUsd ? totalNative * usdToKrw : totalNative
        const priceKrw = isUsd ? startPrice * usdToKrw : startPrice

        if (cash < totalKrw) return '예수금 부족'

        const prev = holdings[symbol]
        const newQty = (prev?.qty ?? 0) + qty
        const newAvg = prev
          ? (prev.avgPrice * prev.qty + totalNative) / newQty
          : startPrice
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
              endPrice, currency,
            },
          },
          history: [
            {
              id: Date.now().toString(), side: 'buy',
              name, symbol, qty,
              price: startPrice, priceKrw,
              total: totalNative, totalKrw,
              currency,
            },
            ...get().history,
          ],
        })
        return null
      },

      sell(symbol, qty) {
        const { cash, holdings, usdToKrw } = get()
        const h = holdings[symbol]
        if (!h || h.qty < qty) return '보유 수량 부족'

        const isUsd = h.currency === 'USD'
        const totalNative = h.endPrice * qty
        const totalKrw = isUsd ? totalNative * usdToKrw : totalNative
        const priceKrw = isUsd ? h.endPrice * usdToKrw : h.endPrice

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
              price: h.endPrice, priceKrw,
              total: totalNative, totalKrw,
              currency: h.currency,
            },
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
      name: 'challenge-trading-v2',  // 스키마 변경으로 버전 올림
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
