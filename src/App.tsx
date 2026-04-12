import { useEffect } from 'react'
import { useStore } from '@/store'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useFirebaseSync } from '@/hooks/useFirebaseSync'
import { Header } from '@/components/dashboard/Header'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { ChartsSection } from '@/components/charts/ChartsSection'
import { ExpensePanel } from '@/components/expenses/ExpensePanel'
import { MigrationModal, useShouldMigrate } from '@/components/sync/MigrationModal'
import { getCurrentMonthStr } from '@/utils/dateHelpers'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function App() {
  const { toggleTheme, setActiveMonth } = useStore()

  // Start real-time Firebase listener
  const syncState = useFirebaseSync()

  // Check once if we need to offer a localStorage → Firestore migration
  const { shouldShow, checking, localData } = useShouldMigrate()

  // Always snap to real current month on mount
  useEffect(() => {
    setActiveMonth(getCurrentMonthStr())
  }, [setActiveMonth])

  useKeyboard({
    n:       () => window.dispatchEvent(new CustomEvent('open-add-expense')),
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

      <footer className="py-3 px-6 flex items-center justify-between">
        <p className="text-xs text-ink-700">
          <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-white/8 font-mono text-ink-500">N</kbd>{' '}
          agregar gasto
        </p>

        {/* Firebase sync status pill */}
        <div className="flex items-center gap-1.5">
          {syncState === 'connecting' && (
            <span className="flex items-center gap-1.5 text-xs text-ink-600">
              <RefreshCw size={11} className="animate-spin" />
              Conectando…
            </span>
          )}
          {syncState === 'synced' && (
            <span className="flex items-center gap-1.5 text-xs text-accent-lime/60">
              <Wifi size={11} />
              Firebase sincronizado
            </span>
          )}
          {syncState === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-accent-rose/70">
              <WifiOff size={11} />
              Sin conexión a Firebase
            </span>
          )}
        </div>
      </footer>

      {/* Migration prompt — one-shot, only when local data exists and Firestore is empty */}
      {!checking && shouldShow && localData && (
        <MigrationModal
          isOpen={true}
          onClose={() => window.location.reload()}
          localData={localData}
        />
      )}
    </div>
  )
}
