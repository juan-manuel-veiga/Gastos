import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'
import { Expense } from '@/types/expense'
import { formatCurrency } from '@/utils/formatCurrency'

interface DeleteConfirmModalProps {
  expense: Expense | null
  onConfirm: () => void
  onClose: () => void
}

export function DeleteConfirmModal({ expense, onConfirm, onClose }: DeleteConfirmModalProps) {
  if (!expense) return null

  return (
    <Modal isOpen={!!expense} onClose={onClose} title="Eliminar Gasto" size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-rose/8 border border-accent-rose/15">
          <Trash2 size={16} className="text-accent-rose mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink-100">{expense.title}</p>
            <p className="text-xs text-ink-500 mt-0.5">
              {formatCurrency(expense.amount)} · {expense.category}
            </p>
          </div>
        </div>
        <p className="text-sm text-ink-400">
          ¿Estás seguro que querés eliminar este gasto? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} fullWidth>
            <Trash2 size={14} />
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
