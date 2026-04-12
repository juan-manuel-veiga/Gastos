import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Expense } from '@/types/expense'
import { format } from 'date-fns'
import {
  fsSetExpense,
  fsDeleteExpense,
  fsSetSalary,
} from '@/services/firestore'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function currentMonthStr(): string {
  return format(new Date(), 'yyyy-MM')
}

interface ExpenseStore {
  salaries: Record<string, number>
  expenses: Expense[]
  activeMonth: string
  theme: 'dark' | 'light'

  getSalary:      (month: string) => number
  setSalary:      (month: string, salary: number) => void
  setActiveMonth: (month: string) => void
  addExpense:     (expense: Omit<Expense, 'id'>) => void
  updateExpense:  (id: string, expense: Omit<Expense, 'id'>) => void
  deleteExpense:  (id: string) => void
  toggleTheme:    () => void

  // ── Bulk setters used by the real-time Firebase listener ──────────────────
  /** Replace entire expenses array (called on every Firestore snapshot) */
  setExpenses:     (expenses: Expense[]) => void
  /** Replace entire salaries map (called on every Firestore snapshot) */
  setSalariesBulk: (salaries: Record<string, number>) => void
}

export const useStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      salaries:    {},
      expenses:    [],
      activeMonth: currentMonthStr(),
      theme:       'dark',

      getSalary: (month) => get().salaries[month] ?? 0,

      setSalary: (month, salary) => {
        set((state) => ({ salaries: { ...state.salaries, [month]: salary } }))
        fsSetSalary(month, salary).catch(console.error)
      },

      setActiveMonth: (month) => set({ activeMonth: month }),

      addExpense: async (expense) => {
  const newExpense: any = { ...expense, id: generateId() }

  Object.keys(newExpense).forEach((key) => {
    if (newExpense[key] === undefined) {
      delete newExpense[key]
    }
  })

  await fsSetExpense(newExpense)
},

      updateExpense: async (id, expense) => {
  const cleanExpense: any = { ...expense, id }

  // 🔥 eliminar undefined explícitamente
  Object.keys(cleanExpense).forEach((key) => {
    if (cleanExpense[key] === undefined) {
      delete cleanExpense[key]
    }
  })

  await fsSetExpense(cleanExpense)
},

      deleteExpense: async (id) => {
  await fsDeleteExpense(id)
},

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // ── Bulk setters (Firebase → UI, no write-back) ──────────────────────

      setExpenses: (expenses) => set({ expenses }),

      setSalariesBulk: (salaries) => set({ salaries }),
    }),
    {
      name: 'expense-tracker-storage',
      // Persist only UI preferences — data comes from Firestore
      partialize: (state) => ({
        activeMonth: state.activeMonth,
        theme:       state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.activeMonth = currentMonthStr()
      },
    }
  )
)

// ─── Selectors (unchanged) ────────────────────────────────────────────────────

export const selectMonthExpenses = (expenses: Expense[], month: string): Expense[] =>
  expenses.filter((e) => e.date.startsWith(month))

export const selectTotalSpent = (expenses: Expense[]): number =>
  expenses.reduce((sum, e) => sum + e.amount, 0)

export const selectByCategory = (expenses: Expense[]): Record<string, number> =>
  expenses.reduce(
    (acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc },
    {} as Record<string, number>
  )

export function selectAccumulatedSavings(
  expenses: Expense[],
  salaries: Record<string, number>,
  upToMonth: string
): { month: string; label: string; savings: number; cumulative: number }[] {
  const monthSet = new Set<string>([
    ...Object.keys(salaries),
    ...expenses.map((e) => e.date.slice(0, 7)),
  ])
  const sorted = Array.from(monthSet).filter((m) => m <= upToMonth).sort()

  let cumulative = 0
  return sorted.map((month) => {
    const salary = salaries[month] ?? 0
    const spent  = expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0)
    const savings = salary - spent
    cumulative += savings
    const [y, m] = month.split('-')
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('es-UY', { month: 'short', year: '2-digit' })
    return { month, label, savings, cumulative }
  })
}
