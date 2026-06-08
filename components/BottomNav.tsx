'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: '랭킹', icon: '🏅' },
  { href: '/trade', label: '트레이딩', icon: '📈' },
  { href: '/challenges', label: '챌린지', icon: '🏆' },
]

export default function BottomNav() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex sm:hidden safe-bottom">
      {NAV.map(n => {
        const active = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href))
        return (
          <Link key={n.href} href={n.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${active ? 'text-gray-900' : 'text-gray-400'}`}>
            <span className="text-xl">{n.icon}</span>
            <span className={`text-[10px] font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{n.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
