import { useState, useRef, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store'
import { CATEGORIES, Category, Expense } from '@/types/expense'
import { formatCurrency } from '@/utils/formatCurrency'
import { format } from 'date-fns'
import { Users } from 'lucide-react'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense?: Expense
}

const DEFAULT_FORM = {
  title: '',
  amount: '',
  category: 'Otros' as Category,
  date: format(new Date(), 'yyyy-MM-dd'),
  isShared: false,
}

export function AddExpenseModal({ isOpen, onClose, expense }: AddExpenseModalProps) {
  const { addExpense, updateExpense } = useStore()
  const isEditing = !!expense
  const [form, setForm] = useState(DEFAULT_FORM)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setForm({
          title:    expense.title,
          // Show originalAmount in the field when editing a shared expense
          amount:   String(expense.isShared ? (expense.originalAmount ?? expense.amount * 2) : expense.amount),
          category: expense.category,
          date:     expense.date,
          isShared: expense.isShared ?? false,
        })
      } else {
        setForm({ ...DEFAULT_FORM, date: format(new Date(), 'yyyy-MM-dd') })
      }
      setError('')
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [isOpen, expense])

  const handleSubmit = () => {
    if (!form.title.trim()) return setError('El título es requerido')
    const rawAmount = parseFloat(form.amount)
    if (!rawAmount || rawAmount <= 0) return setError('Ingresá un monto válido')

    const storedAmount   = form.isShared ? rawAmount / 2 : rawAmount
    const originalAmount = form.isShared ? rawAmount : undefined

    const data: Omit<Expense, 'id'> = {
      title:          form.title.trim(),
      amount:         storedAmount,
      originalAmount,
      isShared:       form.isShared || undefined,
      category:       form.category,
      date:           form.date,
    }

    if (isEditing && expense) {
      updateExpense(expense.id, data)
    } else {
      addExpense(data)
    }
    onClose()
  }

  const rawAmount   = parseFloat(form.amount) || 0
  const halfAmount  = rawAmount / 2

  const field =
    'w-full bg-surface-3 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-accent-lime/50 focus:ring-1 focus:ring-accent-lime/20 transition-all'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Gasto' : 'Nuevo Gasto'}>
      <div className="space-y-4">

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Descripción</label>
          <input
            ref={titleRef}
            type="text"
            placeholder="ej. Almuerzo en el trabajo"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={field}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">
            {form.isShared ? 'Monto total (UYU)' : 'Monto (UYU)'}
          </label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="1"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={`${field} font-numbers`}
          />
          {/* Live split preview */}
          {form.isShared && rawAmount > 0 && (
            <p className="text-xs text-ink-500 mt-1.5 flex items-center gap-1.5">
              <Users size={11} />
              Tu parte:{' '}
              <span className="font-numbers font-semibold text-accent-lime">
                {formatCurrency(halfAmount)}
              </span>
              <span className="text-ink-700">· la otra mitad no se registra</span>
            </p>
          )}
        </div>

        {/* Shared toggle */}
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer select-none ${
            form.isShared
              ? 'bg-accent-sky/8 border-accent-sky/25'
              : 'bg-surface-3 border-white/8 hover:border-white/15'
          }`}
          onClick={() => setForm({ ...form, isShared: !form.isShared })}
        >
          <div className="flex items-center gap-2.5">
            <Users size={14} className={form.isShared ? 'text-accent-sky' : 'text-ink-500'} />
            <div>
              <p className={`text-sm font-medium ${form.isShared ? 'text-ink-100' : 'text-ink-400'}`}>
                Gasto Compartido
              </p>
              <p className="text-xs text-ink-600">Dividir por 2 — solo se guarda tu mitad</p>
            </div>
          </div>
          {/* Toggle pill */}
          <div
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
              form.isShared ? 'bg-accent-sky' : 'bg-surface-4'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.isShared ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Categoría</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setForm({ ...form, category: cat })}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  form.category === cat
                    ? 'bg-accent-lime/15 border-accent-lime/40 text-accent-lime'
                    : 'bg-surface-3 border-white/5 text-ink-400 hover:text-ink-200 hover:border-white/15'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Fecha</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={`${field} [color-scheme:dark]`}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-accent-rose bg-accent-rose/10 border border-accent-rose/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} fullWidth>
            {isEditing ? 'Guardar Cambios' : 'Agregar Gasto'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
