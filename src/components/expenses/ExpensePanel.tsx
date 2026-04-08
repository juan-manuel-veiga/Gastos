import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ExpenseList } from './ExpenseList'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { AddExpenseModal } from './AddExpenseModal'
import { CsvImportModal } from './CsvImportModal'
import { Expense, CATEGORIES, Category } from '@/types/expense'
import { filterByMonth } from '@/utils/dateHelpers'
import { formatCurrency } from '@/utils/formatCurrency'
import { SlidersHorizontal, ChevronDown, Plus, Search, X, FileUp } from 'lucide-react'

export function ExpensePanel() {
  const { expenses, deleteExpense, activeMonth } = useStore()
  const [toDelete, setToDelete]   = useState<Expense | null>(null)
  const [toEdit, setToEdit]       = useState<Expense | undefined>(undefined)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isCsvOpen, setIsCsvOpen]   = useState(false)
  const [filterCategory, setFilterCategory] = useState<Category | 'Todas'>('Todas')
  const [searchQuery, setSearchQuery]       = useState('')

  // Keyboard shortcut N → open modal
  useEffect(() => {
    const handler = () => { setToEdit(undefined); setIsAddOpen(true) }
    window.addEventListener('open-add-expense', handler)
    return () => window.removeEventListener('open-add-expense', handler)
  }, [])

  // Reset filters on month change
  useEffect(() => {
    setFilterCategory('Todas')
    setSearchQuery('')
  }, [activeMonth])

  const filtered = useMemo(() => {
    let list = filterByMonth(expenses, activeMonth)
    if (filterCategory !== 'Todas') {
      list = list.filter((e) => e.category === filterCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, activeMonth, filterCategory, searchQuery])

  const total = filtered.reduce((s, e) => s + e.amount, 0)

  const handleConfirmDelete = () => {
    if (toDelete) { deleteExpense(toDelete.id); setToDelete(null) }
  }
  const handleEdit = (expense: Expense) => { setToEdit(expense); setIsAddOpen(true) }
  const handleCloseModal = () => { setIsAddOpen(false); setToEdit(undefined) }

  const hasActiveFilters = filterCategory !== 'Todas' || searchQuery.trim() !== ''

  const selectClass =
    'bg-surface-3 border border-white/8 text-ink-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-accent-lime/40 transition-colors [color-scheme:dark] appearance-none cursor-pointer pr-7'

  return (
    <>
      <Card className="flex flex-col overflow-hidden">

        {/* ── Single header row: title · search · category · add ── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/5 flex-wrap">

          {/* Left: label + total */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <SlidersHorizontal size={14} className="text-ink-500" />
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
              Transacciones
            </h3>
            {filtered.length > 0 && (
              <span className="text-xs font-numbers text-ink-600">
                · {formatCurrency(total)}
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search input */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-3 border border-white/8 rounded-lg pl-7 pr-7 py-1.5 text-xs text-ink-200 placeholder:text-ink-600 outline-none focus:border-white/20 transition-all w-36 focus:w-48"
              style={{ transition: 'width 200ms ease' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-300 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category dropdown */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | 'Todas')}
              className={selectClass}
            >
              <option value="Todas">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
          </div>

          {/* Import CSV button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCsvOpen(true)}
            title="Importar CSV bancario"
          >
            <FileUp size={14} />
            Importar
          </Button>

          {/* Add button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setToEdit(undefined); setIsAddOpen(true) }}
          >
            <Plus size={14} />
            Agregar
          </Button>
        </div>

        {/* Active filter summary — one thin line below header when needed */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between px-5 py-1.5 border-b border-white/5 bg-surface-3/40">
            <p className="text-xs text-ink-600">
              {filtered.length === 0
                ? 'Sin resultados'
                : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
            </p>
            <button
              onClick={() => { setFilterCategory('Todas'); setSearchQuery('') }}
              className="text-xs text-ink-500 hover:text-accent-lime transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto max-h-[480px] px-2 py-2">
          <ExpenseList
            expenses={filtered}
            onDelete={setToDelete}
            onEdit={handleEdit}
            isSearching={hasActiveFilters}
          />
        </div>
      </Card>

      <DeleteConfirmModal
        expense={toDelete}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDelete(null)}
      />

      <CsvImportModal
        isOpen={isCsvOpen}
        onClose={() => setIsCsvOpen(false)}
      />

      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={handleCloseModal}
        expense={toEdit}
      />
    </>
  )
}
