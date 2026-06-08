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
  const { nickname, setNickname, cash, holdings, usdToKrw } = useTradingStore()

  const evalTotal = Object.values(holdings).reduce((s, h) => {
    const val = h.curPrice * h.qty
    return s + (h.currency === 'USD' ? val * usdToKrw : val)
  }, 0)
  const finalValue = cash + evalTotal
  const profit = finalValue - INIT_CASH
  const profitRate = (profit / INIT_CASH) * 100

  /* ── 닉네임 입력 화면 ── */
  if (!nickname) {
    return (
      <main className="max-w-sm mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="text-center space-y-1.5">
          <p className="text-4xl mb-1">📈</p>
          <h1 className="text-2xl font-bold tracking-tight">모의투자</h1>
          <p className="text-sm text-gray-400">닉네임을 정하고 시드 1,000만원으로 시작</p>
        </div>
        <input
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
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
          className="w-full bg-gray-900 text-white rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40 active:bg-gray-700 transition-colors"
        >
          {t('start')}
        </button>
      </main>
    )
  }

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

  const TABS = [t('trade'), t('portfolio'), t('history')]

  return (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-2">
      {/* 시장 상태 배너 */}
      {bothClosed && (
        <div className="mb-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5">
          <p className="text-xs font-semibold text-amber-800">⚠️ 모든 시장 폐장 중</p>
          <div className="flex gap-3 mt-0.5 text-[10px] text-amber-600">
            <span>🇰🇷 09:00~15:30 KST</span>
            <span>🇺🇸 23:30~06:00 KST</span>
          </div>
        </div>
      )}
      {!bothClosed && (!kr.isOpen || !us.isOpen) && (
        <div className="mb-3 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-2">
          <div className="flex gap-3 text-[11px] text-gray-500 flex-wrap">
            <span>{kr.isOpen ? '🟢' : '🔴'} 국내 {kr.isOpen ? '개장' : '폐장'}</span>
            <span>{us.isOpen ? '🟢' : '🔴'} 미국 {us.isOpen ? '개장' : '폐장'}</span>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="text-xs text-gray-400 shrink-0">← {t('ranking')}</Link>
          <span className="text-gray-300 text-xs">|</span>
          <p className="text-sm font-semibold truncate">{nickname}</p>
        </div>
        {!submitted ? (
          <button onClick={submitRanking} disabled={submitting}
            className="text-[11px] px-3 py-1.5 bg-gray-900 text-white rounded-xl active:bg-gray-700 disabled:opacity-50 transition-colors font-semibold shrink-0">
            {submitting ? '…' : t('rankingRegister')}
          </button>
        ) : (
          <span className="text-[11px] px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-semibold shrink-0">
            {t('registered')}
          </span>
        )}
      </div>

      <Summary />

      {/* 탭 */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-4 gap-0.5">
        {TABS.map((label, i) => (
          <button key={i} onClick={() => setTabIdx(i)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
              tabIdx === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className={tabIdx !== 0 ? 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4' : ''}>
        {tabIdx === 0 && <QuoteSearch />}
        {tabIdx === 1 && <Portfolio />}
        {tabIdx === 2 && <History />}
      </div>
    </main>
  )
}
