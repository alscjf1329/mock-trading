'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLangStore } from '@/lib/i18n'

const NAV_KO = [
  { href: '/', label: '랭킹', labelEn: 'Ranking', icon: '🏅' },
  { href: '/trade', label: '트레이딩', labelEn: 'Trade', icon: '📈' },
  { href: '/challenges', label: '챌린지', labelEn: 'Challenge', icon: '🏆' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { lang, setLang } = useLangStore()
  if (pathname.startsWith('/admin')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex sm:hidden">
      {NAV_KO.map(n => {
        const active = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href))
        return (
          <Link key={n.href} href={n.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${active ? 'text-gray-900' : 'text-gray-400'}`}>
            <span className="text-xl">{n.icon}</span>
            <span className={`text-[10px] font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>
              {lang === 'ko' ? n.label : n.labelEn}
            </span>
          </Link>
        )
      })}
      {/* 언어 토글 */}
      <button
        onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
        className="w-14 flex flex-col items-center justify-center py-3 gap-0.5 text-gray-400 active:text-gray-700 transition-colors">
        <span className="text-base font-bold">{lang === 'ko' ? 'EN' : '한'}</span>
        <span className="text-[10px] font-medium">{lang === 'ko' ? 'EN' : 'KO'}</span>
      </button>
    </nav>
  )
}
