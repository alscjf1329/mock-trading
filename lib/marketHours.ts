export interface MarketStatus {
  isOpen: boolean
  label: string
  nextOpen: string
}

function isWeekday(date: Date) {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

export function getKrMarketStatus(): MarketStatus {
  const now = new Date()
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const h = kst.getHours()
  const m = kst.getMinutes()
  const minutes = h * 60 + m

  const isOpen = isWeekday(kst) && minutes >= 9 * 60 && minutes < 15 * 60 + 30

  return {
    isOpen,
    label: isOpen ? '🟢 국내장 개장' : '🔴 국내장 폐장',
    nextOpen: isOpen ? '' : '평일 09:00~15:30 KST',
  }
}

export function getUsMarketStatus(): MarketStatus {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const h = et.getHours()
  const m = et.getMinutes()
  const minutes = h * 60 + m

  const isOpen = isWeekday(et) && minutes >= 9 * 60 + 30 && minutes < 16 * 60

  return {
    isOpen,
    label: isOpen ? '🟢 미국장 개장' : '🔴 미국장 폐장',
    nextOpen: isOpen ? '' : '평일 09:30~16:00 ET (한국 23:30~06:00)',
  }
}

export function getMarketStatus(currency: string): MarketStatus {
  return currency === 'USD' ? getUsMarketStatus() : getKrMarketStatus()
}
