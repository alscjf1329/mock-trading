'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    const res = await fetch('/api/admin/challenges', {
      headers: { 'x-admin-password': pw },
    })
    if (res.ok) {
      sessionStorage.setItem('admin-pw', pw)
      router.push('/admin/dashboard')
    } else {
      setError('비밀번호가 틀렸어요')
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-32 flex flex-col items-center gap-5">
      <h1 className="text-xl font-semibold">관리자</h1>
      <input
        type="password"
        placeholder="비밀번호"
        value={pw}
        onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        onClick={handleLogin}
        disabled={!pw}
        className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
      >
        로그인
      </button>
    </main>
  )
}
