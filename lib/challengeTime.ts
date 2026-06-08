/**
 * 실제 현재 시각을 참여 기간에 매핑해서 "현재 과거 날짜" 계산
 *
 * 예) openFrom=2026-06-01, openUntil=2026-07-01 (30일 참여)
 *     tradeStart=2020-01-01, tradeEnd=2020-03-31 (90일 과거)
 *     오늘=2026-06-15 (50% 진행) → 2020-02-14 (과거 50%)
 */
export function getCurrentHistoricalDate(
  openFrom:   string,
  openUntil:  string,
  tradeStart: string,
  tradeEnd:   string,
): string {
  const now       = Date.now()
  const fromMs    = new Date(openFrom).getTime()
  const untilMs   = new Date(openUntil).getTime()
  const progress  = Math.max(0, Math.min(1, (now - fromMs) / (untilMs - fromMs)))

  const startMs   = new Date(tradeStart).getTime()
  const endMs     = new Date(tradeEnd).getTime()
  const mappedMs  = startMs + progress * (endMs - startMs)

  return new Date(mappedMs).toISOString().slice(0, 10)
}

/** 참여 기간 진행률 0~1 */
export function getChallengeProgress(openFrom: string, openUntil: string): number {
  const now    = Date.now()
  const fromMs = new Date(openFrom).getTime()
  const untilMs= new Date(openUntil).getTime()
  return Math.max(0, Math.min(1, (now - fromMs) / (untilMs - fromMs)))
}

/** 경과 일수 계산 (과거 타임라인 기준) */
export function getElapsedDays(tradeStart: string, currentHistoricalDate: string): number {
  const startMs  = new Date(tradeStart).getTime()
  const currentMs= new Date(currentHistoricalDate).getTime()
  return Math.round((currentMs - startMs) / 86400000)
}

/** 전체 챌린지 기간 일수 (과거 타임라인 기준) */
export function getTotalDays(tradeStart: string, tradeEnd: string): number {
  return Math.round(
    (new Date(tradeEnd).getTime() - new Date(tradeStart).getTime()) / 86400000
  )
}
