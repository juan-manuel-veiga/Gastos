import { Trash2, Pencil, Users } from 'lucide-react'
import { Expense, CATEGORY_COLORS } from '@/types/expense'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/dateHelpers'

interface ExpenseItemProps {
  expense: Expense
  onDelete: (expense: Expense) => void
  onEdit: (expense: Expense) => void
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Utilidades: '⚡',
  Supermercado: '🛒',
  Feria: '🥬',
  Otros: '📦',
  Mermelada: '🐱',
  Viaje: '✈️',
  Salidas: '🍻',
  'Comida preparada': '🥡',
  Transporte: '🚌',
}

export function ExpenseItem({ expense, onDelete, onEdit }: ExpenseItemProps) {
  const color = CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || '#888'
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦'
  const displayAmount = expense.isShared
    ? (expense.originalAmount ?? expense.amount * 2)
    : expense.amount

  return (
    <div className="group flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-surface-3 transition-colors animate-fade-in">

      {/* Category icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
        style={{ backgroundColor: `${color}15` }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-ink-100 truncate">{expense.title}</p>

          {/* Category tag */}
          <span
            className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {expense.category}
          </span>

          {/* Shared badge */}
          {expense.isShared && (
            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 bg-accent-sky/12 text-accent-sky border border-accent-sky/20">
              <Users size={10} />
              Compartido
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-ink-600">{formatDate(expense.date)}</span>
          {expense.isShared && (
            <span className="text-xs text-ink-700">
              · mitad: {formatCurrency(expense.amount)}
            </span>
          )}
        </div>
      </div>

      {/* Amount + actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="font-numbers font-semibold text-sm text-ink-100 mr-1">
          {formatCurrency(displayAmount)}
        </span>
        <button
          onClick={() => onEdit(expense)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-600 hover:text-accent-sky hover:bg-accent-sky/10 transition-all"
          title="Editar"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(expense)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-600 hover:text-accent-rose hover:bg-accent-rose/10 transition-all"
          title="Eliminar"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
