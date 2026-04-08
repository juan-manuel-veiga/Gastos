import { Expense } from '@/types/expense'
import { ExpenseItem } from './ExpenseItem'
import { Receipt, SearchX } from 'lucide-react'

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  isSearching?: boolean
}

export function ExpenseList({ expenses, onDelete, onEdit, isSearching }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-ink-600">
        {isSearching ? (
          <>
            <SearchX size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-medium text-ink-500">Sin resultados</p>
            <p className="text-xs mt-1 text-ink-600">Probá con otra búsqueda</p>
          </>
        ) : (
          <>
            <Receipt size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-medium text-ink-500">Sin gastos en este período</p>
            <p className="text-xs mt-1">
              Presioná{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-white/10 font-mono text-ink-400">
                N
              </kbd>{' '}
              para agregar uno
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
