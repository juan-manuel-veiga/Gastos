import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Expense } from '@/types/expense'
import { format } from 'date-fns'

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

  getSalary: (month: string) => number
  setSalary: (month: string, salary: number) => void
  setActiveMonth: (month: string) => void
  addExpense: (expense: Omit<Expense, 'id'>) => void
  updateExpense: (id: string, expense: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void
  toggleTheme: () => void
}

export const useStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      salaries: {},
      expenses: [],
      // Always boot to the real current month
      activeMonth: currentMonthStr(),
      theme: 'dark',

      getSalary: (month) => get().salaries[month] ?? 0,

      setSalary: (month, salary) =>
        set((state) => ({
          salaries: { ...state.salaries, [month]: salary },
        })),

      setActiveMonth: (month) => set({ activeMonth: month }),

      addExpense: (expense) =>
        set((state) => ({
          expenses: [{ ...expense, id: generateId() }, ...state.expenses],
        })),

      updateExpense: (id, expense) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...expense, id } : e
          ),
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'expense-tracker-storage',
      // On rehydration, always snap activeMonth to the real current month
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activeMonth = currentMonthStr()
        }
      },
    }
  )
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectMonthExpenses = (expenses: Expense[], month: string): Expense[] =>
  expenses.filter((e) => e.date.startsWith(month))

export const selectTotalSpent = (expenses: Expense[]): number =>
  expenses.reduce((sum, e) => sum + e.amount, 0)

export const selectByCategory = (expenses: Expense[]): Record<string, number> =>
  expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    },
    {} as Record<string, number>
  )

/**
 * Compute accumulated savings across all months up to (and including) the
 * current active month.  Returns an array ordered oldest → newest so it can
 * be fed directly into a Recharts LineChart.
 */
export function selectAccumulatedSavings(
  expenses: Expense[],
  salaries: Record<string, number>,
  upToMonth: string
): { month: string; label: string; savings: number; cumulative: number }[] {
  // Collect all months that have either a salary or expenses
  const monthSet = new Set<string>([
    ...Object.keys(salaries),
    ...expenses.map((e) => e.date.slice(0, 7)),
  ])

  const sorted = Array.from(monthSet)
    .filter((m) => m <= upToMonth)
    .sort()

  let cumulative = 0
  return sorted.map((month) => {
    const salary = salaries[month] ?? 0
    const spent = expenses
      .filter((e) => e.date.startsWith(month))
      .reduce((s, e) => s + e.amount, 0)
    const savings = salary - spent
    cumulative += savings
    const [y, m] = month.split('-')
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('es-UY', {
      month: 'short',
      year: '2-digit',
    })
    return { month, label, savings, cumulative }
  })
}
