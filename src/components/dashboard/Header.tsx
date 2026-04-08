import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { useStore } from '@/store'
import { formatMonthYear, navigateMonth, isCurrentMonth, getCurrentMonthStr } from '@/utils/dateHelpers'

export function Header() {
  const { activeMonth, setActiveMonth } = useStore()
  const atCurrentMonth = isCurrentMonth(activeMonth)

  const goBack = () => setActiveMonth(navigateMonth(activeMonth, -1))
  const goForward = () => setActiveMonth(navigateMonth(activeMonth, 1))

  return (
    <header className="flex items-center justify-between py-5 px-6 lg:px-8 border-b border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-accent-lime flex items-center justify-center shadow-glow-lime">
          <Wallet size={16} className="text-surface" />
        </div>
        <h1 className="font-display text-lg font-semibold text-ink-100 leading-none">
          Gastos
        </h1>
      </div>

      {/* Month navigator — centrado */}
      <div className="flex items-center gap-1">
        <button
          onClick={goBack}
          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-100 hover:bg-surface-3 transition-colors"
          title="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2 px-3">
          <span className="font-display text-sm font-semibold text-ink-100 capitalize min-w-[140px] text-center">
            {formatMonthYear(activeMonth)}
          </span>
          {!atCurrentMonth && (
            <button
              onClick={() => setActiveMonth(getCurrentMonthStr())}
              className="text-xs text-accent-lime hover:underline"
              title="Volver al mes actual"
            >
              hoy
            </button>
          )}
        </div>

        <button
          onClick={goForward}
          disabled={atCurrentMonth}
          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-100 hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Spacer to balance logo */}
      <div className="w-[88px] flex-shrink-0" />
    </header>
  )
}
