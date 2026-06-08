'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useChallengeStore } from '@/lib/challengeStore'
import { getCurrentHistoricalDate, getElapsedDays, getTotalDays } from '@/lib/challengeTime'
import ChallengeQuoteSearch from '@/components/ChallengeQuoteSearch'
import { STOCKS } from '@/lib/stocks'
import { useLang, resolveNames } from '@/lib/i18n'

interface Challenge {
  id: number; title: string; description: string
  trade_start: string; trade_end: string
  open_from: string; open_until: string; seed: number
}
interface RankRow { nickname: string; profit: number; profit_rate: number; final_value: number }

function fmt(n: number) { return Math.round(n).toLocaleString('ko-KR') }
function fmtR(r: number) { return (r >= 0 ? '+' : '') + Number(r).toFixed(2) + '%' }
function fmtPrice(p: number, cur: string) {
  return cur === 'USD'
    ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${fmt(p)}원`
}
const medals = ['🥇', '🥈', '🥉']
const TABS = ['트레이딩', '포트폴리오', '랭킹'] as const

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>()
  const lang = useLang()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [tab, setTab] = useState<typeof TABS[number]>('트레이딩')
  const [inputName, setInputName] = useState('')
  const [rankings, setRankings] = useState<RankRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const store = useChallengeStore()

  useEffect(() => {
    fetch(`/api/challenges/${id}`).then(r => r.json()).then(setChallenge)
    fetch(`/api/challenges/${id}/rankings`).then(r => r.json()).then(d => setRankings(Array.isArray(d) ? d : []))
    fetch('/api/quote?symbol=KRW%3DX').then(r => r.json()).then(d => { if (d.price) store.setUsdToKrw(d.price) }).catch(() => {})
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!challenge) return <div className="text-center py-24 text-gray-400">불러오는 중...</div>

  const now      = new Date()
  const isOpen   = now >= new Date(challenge.open_from) && now <= new Date(challenge.open_until)
  const tradeStart = challenge.trade_start.slice(0, 10)
  const tradeEnd   = challenge.trade_end.slice(0, 10)
  const openFrom   = challenge.open_from
  const openUntil  = challenge.open_until
  const currentHistoricalDate = getCurrentHistoricalDate(openFrom, openUntil, tradeStart, tradeEnd)

  /* ── 닉네임 입력 화면 ── */
  if (!store.nickname || store.challengeId !== Number(id)) {
    return (
      <main className="max-w-sm mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="text-center space-y-1.5">
          <p className="text-4xl mb-1">🏆</p>
          <h1 className="text-2xl font-bold tracking-tight">{challenge.title}</h1>
          {challenge.description && <p className="text-sm text-gray-400">{challenge.description}</p>}
        </div>
        <div className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-xs text-gray-500 space-y-1.5">
          <p>📅 시세 기간: <span className="font-medium text-gray-700">{tradeStart} ~ {tradeEnd}</span>
            <span className="text-gray-400 ml-1">({getTotalDays(tradeStart, tradeEnd)}일)</span>
          </p>
          <p>💰 시드머니: <span className="font-medium text-gray-700">{fmt(challenge.seed)}원</span></p>
          <p>⏰ 참여 마감: <span className="font-medium text-gray-700">{new Date(challenge.open_until).toLocaleDateString('ko-KR')}</span></p>
          <p className="pt-1 border-t border-gray-100 text-blue-600 font-medium">
            ⏱ 현재 시세: {currentHistoricalDate}
            <span className="text-gray-400 font-normal ml-1">
              (Day {getElapsedDays(tradeStart, currentHistoricalDate)}/{getTotalDays(tradeStart, tradeEnd)})
            </span>
          </p>
        </div>
        {!isOpen && (
          <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
            <p className="text-sm text-red-600 font-medium">참여 기간이 아닙니다</p>
          </div>
        )}
        {isOpen && <>
          <input
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
            placeholder="닉네임 (최대 20자)"
            maxLength={20}
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && inputName.trim() && store.init(Number(id), challenge.seed, inputName.trim())}
            autoFocus
          />
          <button
            disabled={!inputName.trim()}
            onClick={() => store.init(Number(id), challenge.seed, inputName.trim())}
            className="w-full bg-gray-900 text-white rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40 active:bg-gray-700 transition-colors"
          >
            챌린지 시작
          </button>
        </>}
        <Link href="/challenges" className="text-xs text-gray-400">← 챌린지 목록</Link>
      </main>
    )
  }

  /* ── 보유 종목 시세 새로고침 ── */
  async function refreshPrices() {
    setRefreshing(true)
    const holdings = Object.values(store.holdings)
    for (const h of holdings) {
      try {
        const res  = await fetch(`/api/historical-quote?symbol=${h.symbol}&from=${tradeStart}&to=${currentHistoricalDate}`)
        const data = await res.json()
        if (data.currentPrice) store.updatePrice(h.symbol, data.currentPrice)
      } catch {}
      await new Promise(r => setTimeout(r, 200))
    }
    setRefreshing(false)
  }

  const seed       = Number(challenge.seed)
  const usdToKrw   = store.usdToKrw
  const evalTotal  = Object.values(store.holdings).reduce((s, h) => {
    const val = h.curPrice * h.qty
    return s + (h.currency === 'USD' ? val * usdToKrw : val)
  }, 0)
  const finalValue = Number(store.cash) + evalTotal
  const profit     = finalValue - seed
  const profitRate = (profit / seed) * 100
  const pnlColor   = profit > 0 ? 'text-red-600' : profit < 0 ? 'text-blue-700' : 'text-gray-500'

  async function submitRanking() {
    setSubmitting(true)
    try {
      await fetch(`/api/challenges/${id}/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: store.nickname, profit, profitRate, finalValue }),
      })
      const rows = await fetch(`/api/challenges/${id}/rankings`).then(r => r.json())
      setRankings(Array.isArray(rows) ? rows : [])
      setSubmitted(true)
    } finally { setSubmitting(false) }
  }

  return (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/challenges" className="text-xs text-gray-400 shrink-0">← 챌린지</Link>
          <span className="text-gray-300 text-xs">|</span>
          <h1 className="text-sm font-semibold truncate">{challenge.title}</h1>
        </div>
        <div className="shrink-0">
          {!submitted
            ? <button onClick={submitRanking} disabled={submitting || !isOpen}
                className="text-[11px] px-3 py-1.5 bg-gray-900 text-white rounded-xl disabled:opacity-40 transition-colors font-semibold">
                {submitting ? '…' : '랭킹 등록'}
              </button>
            : <span className="text-[11px] px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-semibold">✓ 등록완료</span>
          }
        </div>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {[
          { label: '예수금',   value: fmt(store.cash) + '원' },
          { label: '평가금액', value: fmt(evalTotal) + '원' },
          { label: '총 손익',  value: (profit >= 0 ? '+' : '') + fmt(profit) + '원', color: pnlColor },
          { label: '수익률',   value: fmtR(profitRate), color: pnlColor },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-100 shadow-sm rounded-2xl px-3.5 py-3">
            <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{m.label}</p>
            <p className={`text-sm font-bold tabular truncate ${m.color ?? 'text-gray-900'}`}>{m.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 text-right mb-4">
        시세 시점: <span className="font-medium text-gray-600">{currentHistoricalDate}</span>
        &nbsp;· Day {getElapsedDays(tradeStart, currentHistoricalDate)}/{getTotalDays(tradeStart, tradeEnd)}
      </p>

      {/* 탭 */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-4 gap-0.5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        {tab === '트레이딩' && (
          <ChallengeQuoteSearch
            tradeStart={tradeStart}
            tradeEnd={tradeEnd}
            openFrom={openFrom}
            openUntil={openUntil}
          />
        )}

        {tab === '포트폴리오' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium">보유 종목</p>
              <button onClick={refreshPrices} disabled={refreshing}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {refreshing ? '업데이트 중…' : '🔄 시세 새로고침'}
              </button>
            </div>
            {Object.values(store.holdings).length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">보유 종목 없음</p>
            ) : (
              <div className="space-y-2">
                {Object.values(store.holdings).map(h => {
                  const isHUsd   = h.currency === 'USD'
                  const pnlNative = (h.curPrice - h.avgPrice) * h.qty
                  const pnlKrw   = isHUsd ? pnlNative * usdToKrw : pnlNative
                  const rate     = ((h.curPrice - h.avgPrice) / h.avgPrice) * 100
                  const color    = pnlKrw > 0 ? 'text-red-600' : pnlKrw < 0 ? 'text-blue-700' : 'text-gray-500'
                  const bg       = pnlKrw > 0 ? 'bg-red-50' : pnlKrw < 0 ? 'bg-blue-50' : 'bg-gray-50'
                  const local    = STOCKS.find(s => s.symbol === h.symbol)
                  const [pName]  = resolveNames(h.name, local?.nameKo, lang)
                  return (
                    <div key={h.symbol} className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate">{pName}</p>
                          <span className="text-[10px] shrink-0">{isHUsd ? '🇺🇸' : '🇰🇷'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {h.qty}주 · 매수 {fmtPrice(h.avgPrice, h.currency)} → 현재 {fmtPrice(h.curPrice, h.currency)}
                        </p>
                      </div>
                      <div className={`text-right px-3 py-1.5 rounded-xl ${bg} shrink-0`}>
                        <p className={`font-bold text-sm ${color}`}>{fmtR(rate)}</p>
                        <p className={`text-xs ${color}`}>{pnlKrw >= 0 ? '+' : ''}{fmt(pnlKrw)}원</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === '랭킹' && (
          <div className="space-y-2">
            {rankings.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">아직 등록된 기록이 없어요</p>
            ) : rankings.map((r, i) => {
              const p = Number(r.profit)
              const color = p > 0 ? 'text-red-600' : p < 0 ? 'text-blue-700' : 'text-gray-500'
              const bg    = p > 0 ? 'bg-red-50' : p < 0 ? 'bg-blue-50' : 'bg-gray-50'
              return (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-100">
                  <span className="text-lg w-7 text-center shrink-0 leading-none">
                    {medals[i] !== undefined ? medals[i] : <span className="text-xs text-gray-400 font-bold">{i+1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.nickname}</p>
                    <p className="text-[11px] text-gray-400 tabular truncate">최종 {fmt(Number(r.final_value))}원</p>
                  </div>
                  <div className={`text-right px-2.5 py-1.5 rounded-xl ${bg} shrink-0`}>
                    <p className={`font-bold text-xs ${color} tabular`}>{fmtR(r.profit_rate)}</p>
                    <p className={`text-[10px] font-semibold ${color} tabular`}>{p >= 0 ? '+' : ''}{fmt(p)}원</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
