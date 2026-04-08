import { useEffect } from 'react'
import { useStore } from '@/store'
import { useKeyboard } from '@/hooks/useKeyboard'
import { Header } from '@/components/dashboard/Header'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { ChartsSection } from '@/components/charts/ChartsSection'
import { ExpensePanel } from '@/components/expenses/ExpensePanel'
import { getCurrentMonthStr } from '@/utils/dateHelpers'

export default function App() {
  const { toggleTheme, setActiveMonth } = useStore()

  // Auto month detection: snap to real current month on every mount.
  // Handles the "first day of new month" case without relying on persisted value.
  useEffect(() => {
    setActiveMonth(getCurrentMonthStr())
  }, [setActiveMonth])

  useKeyboard({
    n: () => window.dispatchEvent(new CustomEvent('open-add-expense')),
    'mod+d': toggleTheme,
  })

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-4">
        <StatsCards />
        <ChartsSection />
        <ExpensePanel />
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-ink-700">
          Presioná{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-white/8 font-mono text-ink-500">
            N
          </kbd>{' '}
          para agregar un gasto
        </p>
      </footer>
    </div>
  )
}
