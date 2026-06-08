import { STOCKS } from './stocks'

export const POPULAR_KR = STOCKS
  .filter(s => s.market === 'KR')
  .slice(0, 10)
  .map(s => ({ symbol: s.symbol, label: s.name }))

export const POPULAR_US = STOCKS
  .filter(s => s.market === 'US')
  .slice(0, 10)
  .map(s => ({ symbol: s.symbol, label: s.name }))
