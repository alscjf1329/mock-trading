import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Lang = 'ko' | 'en'

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
}

export const useLangStore = create<LangState>()(
  persist(
    set => ({
      lang: 'ko',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'lang-pref', storage: createJSONStorage(() => localStorage) }
  )
)

const T = {
  ko: {
    buy: '매수', sell: '매도',
    qty: '수량', amount: '금액',
    ranking: '랭킹', trade: '트레이딩', challenge: '챌린지',
    portfolio: '포트폴리오', history: '거래내역',
    rankingRegister: '랭킹 등록', registered: '✓ 등록완료',
    expectedAmt: '예상금액', totalKrw: '원화 환산',
    marketOpen: '● 개장', marketClosed: '● 폐장',
    kr: '🇰🇷 국내주', us: '🇺🇸 미국주',
    search: '검색 (삼성물산, 팔란티어, NVDA …)',
    lookup: '조회', loading: '…',
    allIn: '전액',
    prevClose: '전일 대비',
    open_: '시가', high: '고가', low: '저가', volume: '거래량',
    nickname: '닉네임 (최대 20자)',
    start: '시작하기 →',
    noHoldings: '아직 보유 종목이 없어요',
    noHistory: '아직 거래내역이 없어요',
    refreshPrice: '🔄 시세 새로고침',
    updating: '업데이트 중…',
    buyComplete: '✓ 매수 완료', sellComplete: '✓ 매도 완료',
  },
  en: {
    buy: 'Buy', sell: 'Sell',
    qty: 'Qty', amount: 'Amount',
    ranking: 'Ranking', trade: 'Trade', challenge: 'Challenge',
    portfolio: 'Portfolio', history: 'History',
    rankingRegister: 'Register', registered: '✓ Registered',
    expectedAmt: 'Est. amount', totalKrw: 'KRW equiv.',
    marketOpen: '● Open', marketClosed: '● Closed',
    kr: '🇰🇷 Korean', us: '🇺🇸 US',
    search: 'Search (Samsung, Palantir, NVDA …)',
    lookup: 'Go', loading: '…',
    allIn: 'All in',
    prevClose: 'vs prev close',
    open_: 'Open', high: 'High', low: 'Low', volume: 'Vol',
    nickname: 'Nickname (max 20)',
    start: 'Start →',
    noHoldings: 'No holdings yet',
    noHistory: 'No trades yet',
    refreshPrice: '🔄 Refresh prices',
    updating: 'Updating…',
    buyComplete: '✓ Bought', sellComplete: '✓ Sold',
  },
} as const

export type TKeys = keyof typeof T.ko

export function useT() {
  const lang = useLangStore(s => s.lang)
  return (key: TKeys) => T[lang][key] as string
}

export function useLang() {
  return useLangStore(s => s.lang)
}

/**
 * 종목명 표시 헬퍼
 * - lang='ko': nameKo 있으면 nameKo, 없으면 name
 * - lang='en': name
 * @returns [primary, secondary | null]  secondary는 부제목 (다를 때만)
 */
export function resolveNames(
  name: string,
  nameKo: string | null | undefined,
  lang: 'ko' | 'en'
): [string, string | null] {
  if (!nameKo || nameKo === name) return [name, null]
  if (lang === 'ko') return [nameKo, name]
  return [name, nameKo]
}
