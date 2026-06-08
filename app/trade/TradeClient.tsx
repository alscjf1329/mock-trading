'use client'
import { useState } from 'react'
import { useTradingStore, INIT_CASH } from '@/lib/store'
import Summary from '@/components/Summary'
import QuoteSearch from '@/components/QuoteSearch'
import Portfolio from '@/components/Portfolio'
import History from '@/components/History'
import Link from 'next/link'
import { getKrMarketStatus, getUsMarketStatus } from '@/lib/marketHours'
import { useT } from '@/lib/i18n'


export default function TradePage() {
  const t = useT()
  const [tabIdx, setTabIdx] = useState(0)
  const [inputName, setInputName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { nickname, setNickname, cash, holdings } = useTradingStore()

  const evalTotal = Object.values(holdings).reduce((s, h) => s + h.curPrice * h.qty, 0)
  const finalValue = cash + evalTotal
  const profit = finalValue - INIT_CASH
  const profitRate = (profit / INIT_CASH) * 100

  /* ── 닉네임 입력 화면 ── */
  if (!nickname) {
    return (
      <main className="max-w-sm mx-auto px-4 py-24 flex flex-col items-center gap-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">모의투자</h1>
          <p className="text-sm text-gray-400">닉네임을 정하고 시드 1,000만원으로 시작하세요</p>
        </div>
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          placeholder={t('nickname')}
          maxLength={20}
          value={inputName}
          onChange={e => setInputName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && inputName.trim() && setNickname(inputName.trim())}
          autoFocus
        />
        <button
          disabled={!inputName.trim()}
          onClick={() => setNickname(inputName.trim())}
          className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors"
        >
          {t('start')}
        </button>
      </main>
    )
  }

  /* ── 랭킹 등록 ── */
  async function submitRanking() {
    setSubmitting(true)
    try {
      await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, profit, profitRate, finalValue }),
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const kr = getKrMarketStatus()
  const us = getUsMarketStatus()
  const bothClosed = !kr.isOpen && !us.isOpen

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      {/* 시장 상태 배너 */}
      {bothClosed && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">⚠️ 현재 모든 시장이 폐장 중이에요</p>
          <p className="text-xs text-amber-600 mt-0.5">🇰🇷 평일 09:00~15:30 KST &nbsp;·&nbsp; 🇺🇸 평일 23:30~06:00 KST</p>
        </div>
      )}
      {!bothClosed && (!kr.isOpen || !us.isOpen) && (
        <div className="mb-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500 flex flex-col sm:flex-row gap-1 sm:gap-4">
          <span>{kr.label} · 평일 09:00~15:30 KST</span>
          <span>{us.label} · 평일 23:30~06:00 KST</span>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="text-sm text-gray-400 shrink-0">← {t('ranking')}</Link>
          <span className="text-gray-300">|</span>
          <p className="text-sm font-semibold truncate">{nickname}</p>
        </div>
        {!submitted ? (
          <button onClick={submitRanking} disabled={submitting}
            className="text-xs px-4 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium shrink-0">
            {submitting ? '…' : t('rankingRegister')}
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium shrink-0">{t('registered')}</span>
        )}
      </div>

      <Summary />

      {/* 탭 */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {([t('trade'), t('portfolio'), t('history')] as const).map((label, i) => (
          <button key={i} onClick={() => setTabIdx(i)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tabIdx === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className={tabIdx === 0 ? '' : 'bg-white rounded-2xl border border-gray-100 p-4'}>
        {tabIdx === 0 && <QuoteSearch />}
        {tabIdx === 1 && <Portfolio />}
        {tabIdx === 2 && <History />}
      </div>
    </main>
  )
}
