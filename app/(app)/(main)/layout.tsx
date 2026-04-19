'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Target, Megaphone, Palette, TrendingUp, CalendarDays, Bell, Search,
} from 'lucide-react'

const navItems = [
  { href: '/home', label: 'Inicio', icon: Home },
  { href: '/strategies', label: 'Estrategias', icon: Target },
  { href: '/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/branding', label: 'Branding', icon: Palette },
  { href: '/research', label: 'Tendencias', icon: TrendingUp },
  { href: '/calendar', label: 'Calendario', icon: CalendarDays },
]

const pageTitle: Record<string, string> = {
  '/home': 'Inicio',
  '/strategies': 'Estrategias',
  '/campaigns': 'Campañas',
  '/branding': 'Branding',
  '/research': 'Tendencias',
  '/calendar': 'Calendario',
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title =
    pageTitle[pathname] ??
    pageTitle[Object.keys(pageTitle).find(k => pathname.startsWith(k) && k !== '/home') ?? '/home'] ??
    'Ally'

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-[244px] shrink-0 flex-col border-r border-border bg-white">

        {/* Logo */}
        <div className="h-[60px] flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] ig-grad flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 12L14.74 12.26L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.26L3 12L9.26 11.74L5 7L10.91 8.26L12 2Z" fill="white" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="text-[17px] font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Ally
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Marketing IA</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 pb-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[14px] transition-all duration-150 ${
                  active ? 'bg-rose-50 text-rose-700' : 'text-[#262626] hover:bg-gray-50'
                }`}
              >
                <Icon
                  className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                    active ? 'text-rose-600' : 'text-[#8e8e8e] group-hover:text-[#262626]'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={active ? 'font-semibold' : 'font-normal'}>{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full ig-grad" />}
              </Link>
            )
          })}
        </nav>

        {/* User pill */}
        <div className="px-3 pb-5 border-t border-border pt-3">
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-gray-50">
            <div className="story-ring shrink-0">
              <div className="story-ring-inner">
                <div className="w-7 h-7 rounded-full ig-grad flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">A</span>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">Mi cuenta</p>
              <p className="text-[11px] text-muted-foreground">Ally Pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top navbar */}
        <header className="h-[60px] flex items-center justify-between px-5 border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[8px] ig-grad flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 12L14.74 12.26L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.26L3 12L9.26 11.74L5 7L10.91 8.26L12 2Z" fill="white" />
                </svg>
              </div>
              <span className="text-[16px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>Ally</span>
            </div>
            <span className="hidden md:block text-[16px] font-bold text-foreground" style={{ letterSpacing: '-0.025em' }}>
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-muted-foreground">
              <Search className="w-4 h-4" />
            </button>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ig-grad" />
            </button>
            <div className="story-ring ml-1 cursor-pointer">
              <div className="story-ring-inner">
                <div className="w-7 h-7 rounded-full ig-grad flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-10 pb-10">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-border bg-white">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 transition-colors ${
                  active ? 'text-[#262626]' : 'text-[#8e8e8e]'
                }`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
