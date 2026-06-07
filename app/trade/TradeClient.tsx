'use client'
import { useState } from 'react'
import { useTradingStore, INIT_CASH } from '@/lib/store'
import Summary from '@/components/Summary'
import QuoteSearch from '@/components/QuoteSearch'
import Portfolio from '@/components/Portfolio'
import History from '@/components/History'
import Link from 'next/link'
import { getKrMarketStatus, getUsMarketStatus } from '@/lib/marketHours'

const TABS = ['매매', '포트폴리오', '거래내역'] as const

export default function TradePage() {
  const [tab, setTab] = useState<typeof TABS[number]>('매매')
  const [inputName, setInputName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { nickname, setNickname, cash, holdings, reset } = useTradingStore()

  const evalTotal = Object.values(holdings).reduce((s, h) => s + h.curPrice * h.qty, 0)
  const finalValue = cash + evalTotal
  const profit = finalValue - INIT_CASH
  const profitRate = (profit / INIT_CASH) * 100

  if (!nickname) {
    return (
      <main className="max-w-sm mx-auto px-4 py-24 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold">모의투자</h1>
        <p className="text-gray-400 text-sm text-center">닉네임을 입력하고 시드 1,000만원으로 시작하세요</p>
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          placeholder="닉네임 (최대 20자)"
          maxLength={20}
          value={inputName}
          onChange={e => setInputName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && inputName.trim() && setNickname(inputName.trim())}
        />
        <button
          disabled={!inputName.trim()}
          onClick={() => setNickname(inputName.trim())}
          className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
        >
          시작하기
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

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {bothClosed && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex flex-col gap-1">
          <p className="font-medium">⚠️ 현재 모든 시장이 폐장 중이에요</p>
          <div className="text-xs text-amber-600 flex gap-4">
            <span>🇰🇷 국내장 · 평일 09:00~15:30 KST</span>
            <span>🇺🇸 미국장 · 평일 23:30~06:00 KST</span>
          </div>
        </div>
      )}
      {!bothClosed && (!kr.isOpen || !us.isOpen) && (
        <div className="mb-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500 flex gap-4">
          <span>{kr.label} · 평일 09:00~15:30 KST</span>
          <span>{us.label} · 평일 23:30~06:00 KST</span>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← 랭킹</Link>
          <h1 className="text-xl font-medium">{nickname}님의 모의투자</h1>
        </div>
        <div className="flex gap-2">
          {!submitted ? (
            <button
              onClick={submitRanking}
              disabled={submitting}
              className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '제출 중...' : '랭킹 등록'}
            </button>
          ) : (
            <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">등록 완료 ✓</span>
          )}
          <button
            onClick={() => { reset(); setSubmitted(false) }}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      <Summary />

      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
              tab === t
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {tab === '매매' && <QuoteSearch />}
        {tab === '포트폴리오' && <Portfolio />}
        {tab === '거래내역' && <History />}
      </div>
    </main>
  )
}
