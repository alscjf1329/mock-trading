'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLangStore } from '@/lib/i18n'

const NAV = [
  { href: '/',           icon: '🏅', labelKo: '랭킹',   labelEn: 'Rank'      },
  { href: '/trade',      icon: '📈', labelKo: '트레이딩', labelEn: 'Trade'    },
  { href: '/challenges', icon: '🏆', labelKo: '챌린지',  labelEn: 'Challenge' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { lang, setLang } = useLangStore()
  if (pathname.startsWith('/admin')) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-200/80 flex">
        {NAV.map(n => {
          const active = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href))
          return (
            <Link key={n.href} href={n.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                active ? 'text-gray-900' : 'text-gray-400'
              }`}>
              <span className="text-[22px] leading-none">{n.icon}</span>
              <span className={`text-[10px] font-semibold tracking-tight ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                {lang === 'ko' ? n.labelKo : n.labelEn}
              </span>
            </Link>
          )
        })}
        {/* 언어 토글 */}
        <button
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          className="w-14 flex flex-col items-center justify-center py-2.5 gap-0.5 text-gray-400 active:text-gray-700 transition-colors">
          <span className="text-[13px] font-bold leading-none">{lang === 'ko' ? 'EN' : '한'}</span>
          <span className="text-[10px] font-semibold">{lang === 'ko' ? 'EN' : 'KO'}</span>
        </button>
      </div>
    </nav>
  )
}
