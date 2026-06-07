'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Challenge {
  id: number; title: string; description: string
  trade_start: string; trade_end: string
  open_from: string; open_until: string; seed: number
}

const EMPTY = {
  title: '', description: '',
  trade_start: '', trade_end: '',
  open_from: '', open_until: '',
  seed: 10000000,
}

export default function AdminDashboard() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [list, setList] = useState<Challenge[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('admin-pw')
    if (!stored) { router.push('/admin'); return }
    setPw(stored)
    loadList(stored)
  }, [])

  async function loadList(password: string) {
    const res = await fetch('/api/admin/challenges', { headers: { 'x-admin-password': password } })
    if (!res.ok) { router.push('/admin'); return }
    const data = await res.json()
    setList(Array.isArray(data) ? data : [])
  }

  function toLocalDatetimeValue(iso: string) {
    if (!iso) return ''
    return new Date(iso).toISOString().slice(0, 16)
  }

  async function handleSave() {
    setSaving(true); setMsg('')
    try {
      const body = {
        ...form,
        seed: Number(form.seed),
        open_from: new Date(form.open_from).toISOString(),
        open_until: new Date(form.open_until).toISOString(),
      }
      const url = editing ? `/api/admin/challenges/${editing}` : '/api/admin/challenges'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      setMsg(editing ? '수정됨 ✓' : '추가됨 ✓')
      setForm(EMPTY); setEditing(null)
      await loadList(pw)
    } catch (e: any) {
      setMsg('오류: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('정말 삭제할까요?')) return
    await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE', headers: { 'x-admin-password': pw } })
    await loadList(pw)
  }

  function startEdit(c: Challenge) {
    setEditing(c.id)
    setForm({
      title: c.title, description: c.description,
      trade_start: c.trade_start, trade_end: c.trade_end,
      open_from: toLocalDatetimeValue(c.open_from),
      open_until: toLocalDatetimeValue(c.open_until),
      seed: c.seed,
    })
  }

  const F = (label: string, key: keyof typeof EMPTY, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={String(form[key])}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
      />
    </div>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold">챌린지 관리</h1>
        <div className="flex gap-3">
          <Link href="/challenges" className="text-sm text-gray-400 hover:text-gray-600">← 챌린지 목록</Link>
          <button onClick={() => { sessionStorage.removeItem('admin-pw'); router.push('/admin') }} className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </div>
      </div>

      {/* 폼 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8">
        <h2 className="font-medium mb-4">{editing ? '챌린지 수정' : '새 챌린지 추가'}</h2>
        <div className="grid grid-cols-2 gap-3">
          {F('제목', 'title', 'text', '코로나 쇼크 챌린지')}
          {F('시드머니 (원)', 'seed', 'number', '10000000')}
        </div>
        <div className="mt-3">
          <label className="text-xs text-gray-500 block mb-1">설명</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="챌린지 설명을 입력하세요"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {F('시세 시작일 (과거)', 'trade_start', 'date')}
          {F('시세 종료일 (과거)', 'trade_end', 'date')}
          {F('참여 시작일시', 'open_from', 'datetime-local')}
          {F('참여 종료일시', 'open_until', 'datetime-local')}
        </div>
        <div className="flex gap-2 mt-4 items-center">
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.trade_start || !form.trade_end || !form.open_from || !form.open_until}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            {saving ? '저장 중...' : editing ? '수정 저장' : '추가'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(EMPTY) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              취소
            </button>
          )}
          {msg && <span className="text-sm text-gray-500">{msg}</span>}
        </div>
      </div>

      {/* 목록 */}
      <div className="space-y-3">
        {list.length === 0
          ? <p className="text-sm text-gray-400 text-center py-8">챌린지 없음</p>
          : list.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-start">
              <div>
                <p className="font-medium">{c.title}</p>
                {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                  <p>시세: {c.trade_start} ~ {c.trade_end}</p>
                  <p>참여: {new Date(c.open_from).toLocaleString('ko-KR')} ~ {new Date(c.open_until).toLocaleString('ko-KR')}</p>
                  <p>시드: {Number(c.seed).toLocaleString('ko-KR')}원</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(c)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">수정</button>
                <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">삭제</button>
              </div>
            </div>
          ))
        }
      </div>
    </main>
  )
}
