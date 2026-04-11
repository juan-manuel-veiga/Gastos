/**
 * MigrationModal
 *
 * Shown once when the app detects data in localStorage but Firestore is empty.
 * Lets the user preview and confirm migrating their local data to the cloud.
 *
 * After a successful migration, sets a flag in localStorage so the prompt
 * never appears again.
 */

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { fsBatchSetExpenses, fsBatchSetSalaries, fsGetAllExpenses } from '@/services/firestore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatMonthYear } from '@/utils/dateHelpers'
import type { Expense } from '@/types/expense'
import { CloudUpload, Check, AlertCircle, Database, ArrowRight } from 'lucide-react'

// ─── localStorage shape (what the old persist() middleware stored) ────────────

interface LocalStorageData {
  expenses: Expense[]
  salaries: Record<string, number>
}

const LS_KEY        = 'expense-tracker-storage'
const MIGRATED_FLAG = 'gastos-migrated-to-firebase'

// ─── Read and parse local storage data ────────────────────────────────────────

function readLocalData(): LocalStorageData | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Zustand persist wraps data under "state"
    const state = parsed?.state ?? parsed
    const expenses: Expense[] = Array.isArray(state.expenses) ? state.expenses : []
    const salaries: Record<string, number> = state.salaries && typeof state.salaries === 'object'
      ? state.salaries
      : {}
    if (expenses.length === 0 && Object.keys(salaries).length === 0) return null
    return { expenses, salaries }
  } catch {
    return null
  }
}

export function hasMigratedFlag(): boolean {
  return localStorage.getItem(MIGRATED_FLAG) === 'true'
}

function setMigratedFlag(): void {
  localStorage.setItem(MIGRATED_FLAG, 'true')
}

// ─── Hook: should we show the migration prompt? ───────────────────────────────

export function useShouldMigrate(): {
  shouldShow: boolean
  checking: boolean
  localData: LocalStorageData | null
} {
  const [checking, setChecking]     = useState(true)
  const [shouldShow, setShouldShow] = useState(false)
  const [localData, setLocalData]   = useState<LocalStorageData | null>(null)

  useEffect(() => {
    if (hasMigratedFlag()) { setChecking(false); return }

    const local = readLocalData()
    if (!local) { setChecking(false); return }

    // Only prompt if Firestore is actually empty
    fsGetAllExpenses()
      .then((remote) => {
        if (remote.length === 0) {
          setLocalData(local)
          setShouldShow(true)
        } else {
          // Remote already has data — mark as migrated silently
          setMigratedFlag()
        }
      })
      .catch(() => {
        // Can't reach Firestore — show the prompt anyway so user can retry
        setLocalData(local)
        setShouldShow(true)
      })
      .finally(() => setChecking(false))
  }, [])

  return { shouldShow, checking, localData }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MigrationModalProps {
  isOpen:        boolean
  onClose:       () => void
  localData:     LocalStorageData
}

type Step = 'preview' | 'migrating' | 'done' | 'error'

export function MigrationModal({ isOpen, onClose, localData }: MigrationModalProps) {
  const [step, setStep]         = useState<Step>('preview')
  const [errorMsg, setErrorMsg] = useState('')

  const { expenses, salaries } = localData
  const salaryMonths = Object.entries(salaries).filter(([, v]) => v > 0)

  const handleMigrate = async () => {
    setStep('migrating')
    try {
      await fsBatchSetExpenses(expenses)
      await fsBatchSetSalaries(salaries)
      setMigratedFlag()
      setStep('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setErrorMsg(msg)
      setStep('error')
    }
  }

  const handleSkip = () => {
    setMigratedFlag()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'migrating' ? () => {} : handleSkip}
      title="Migrar datos a la nube"
      size="md"
    >

      {/* ── Preview ── */}
      {step === 'preview' && (
        <div className="space-y-5">
          <p className="text-sm text-ink-400 leading-relaxed">
            Encontramos datos guardados localmente en este dispositivo.
            ¿Querés migrarlos a Firebase para acceder desde cualquier lugar?
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-3 rounded-xl p-4 border border-white/6">
              <p className="text-xs text-ink-600 uppercase tracking-wider mb-2">Gastos</p>
              <p className="font-numbers text-2xl font-bold text-ink-100">{expenses.length}</p>
              <p className="text-xs text-ink-600 mt-1">
                {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))} en total
              </p>
            </div>
            <div className="bg-surface-3 rounded-xl p-4 border border-white/6">
              <p className="text-xs text-ink-600 uppercase tracking-wider mb-2">Sueldos</p>
              <p className="font-numbers text-2xl font-bold text-ink-100">{salaryMonths.length}</p>
              <p className="text-xs text-ink-600 mt-1">meses configurados</p>
            </div>
          </div>

          {/* Salary breakdown */}
          {salaryMonths.length > 0 && (
            <div className="bg-surface-3 rounded-xl border border-white/6 divide-y divide-white/5 max-h-36 overflow-y-auto">
              {salaryMonths.sort(([a], [b]) => b.localeCompare(a)).map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-ink-400 capitalize">{formatMonthYear(month)}</span>
                  <span className="text-xs font-numbers font-semibold text-ink-200">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Arrow diagram */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-3 border border-white/8">
              <Database size={14} className="text-ink-500" />
              <span className="text-xs text-ink-400">Este dispositivo</span>
            </div>
            <ArrowRight size={16} className="text-accent-lime" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-lime/10 border border-accent-lime/20">
              <CloudUpload size={14} className="text-accent-lime" />
              <span className="text-xs text-accent-lime">Firebase</span>
            </div>
          </div>

          <p className="text-xs text-ink-700 text-center">
            Tus datos locales no se borran — solo se copian a la nube.
          </p>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} fullWidth>
              Saltear por ahora
            </Button>
            <Button variant="primary" onClick={handleMigrate} fullWidth>
              <CloudUpload size={14} />
              Migrar ahora
            </Button>
          </div>
        </div>
      )}

      {/* ── Migrating ── */}
      {step === 'migrating' && (
        <div className="flex flex-col items-center gap-5 py-6">
          <div className="w-14 h-14 rounded-2xl bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center">
            <CloudUpload size={24} className="text-accent-lime animate-bounce" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold text-ink-100">Migrando datos…</p>
            <p className="text-xs text-ink-500">
              Subiendo {expenses.length} gastos y {salaryMonths.length} sueldos
            </p>
          </div>
          <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-accent-lime rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-lime/15 border border-accent-lime/25 flex items-center justify-center">
            <Check size={28} className="text-accent-lime" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-display font-semibold text-ink-100">¡Migración completa!</p>
            <p className="text-sm text-ink-500">
              {expenses.length} gastos y {salaryMonths.length} sueldos en Firebase.
            </p>
            <p className="text-xs text-ink-700 mt-2">
              Tus datos ahora se sincronizan en la nube.
            </p>
          </div>
          <Button variant="primary" onClick={onClose} fullWidth>
            Listo
          </Button>
        </div>
      )}

      {/* ── Error ── */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-rose/8 border border-accent-rose/20">
            <AlertCircle size={16} className="text-accent-rose flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink-100">Error durante la migración</p>
              <p className="text-xs text-ink-500 mt-1 font-mono break-all">{errorMsg}</p>
            </div>
          </div>
          <p className="text-xs text-ink-500">
            Tus datos locales siguen intactos. Podés reintentar más tarde o usar la app sin la nube.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} fullWidth>Cancelar</Button>
            <Button variant="primary" onClick={() => { setStep('preview') }} fullWidth>
              Reintentar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
