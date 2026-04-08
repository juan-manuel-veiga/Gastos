import { useState, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store'
import { CATEGORIES, Category } from '@/types/expense'
import { parseBankCSV, ParsedRow } from '@/utils/csvParser'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/dateHelpers'
import {
  Upload, FileText, Check, X, AlertCircle,
  ChevronDown, CheckSquare, Square,
} from 'lucide-react'

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'upload' | 'preview' | 'done'

interface ImportRow extends ParsedRow {
  selected: boolean
  category: Category
}

// ─── Auto-categoriser ─────────────────────────────────────────────────────────

const KEYWORD_MAP: { keywords: string[]; category: Category }[] = [
  { keywords: ['supermercado', 'disco', 'tienda inglesa', 'devoto', 'geant', 'tata', 'el dorado', 'market'], category: 'Supermercado' },
  { keywords: ['ute ', 'antel', 'ose ', 'gas ', 'electricidad', 'internet', 'telefon', 'fibertel', 'claro', 'movistar'], category: 'Utilidades' },
  { keywords: ['uber', 'cabify', 'cutcsa', 'taxi', 'peaje', 'combustible', 'nafta', 'ancap', 'copetrol'], category: 'Transporte' },
  { keywords: ['restaurant', 'mcdonald', 'burger', 'pizza', 'sushi', 'delivery', 'rappi', 'pedidos', 'kfc', 'subway', 'cafe', 'café', 'bar '], category: 'Salidas' },
  { keywords: ['feria', 'verdura', 'mercado'], category: 'Feria' },
  { keywords: ['vuelo', 'aerolinea', 'aerolínea', 'hotel', 'airbnb', 'booking', 'latam', 'gol ', 'sky '], category: 'Viaje' },
  { keywords: ['comida', 'almuerzo', 'cena', 'desayuno'], category: 'Comida preparada' },
]

function guessCategory(title: string): Category {
  const lower = title.toLowerCase()
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return category
  }
  return 'Otros'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CsvImportModal({ isOpen, onClose }: CsvImportModalProps) {
  const { addExpense } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep]           = useState<Step>('upload')
  const [rows, setRows]           = useState<ImportRow[]>([])
  const [skipped, setSkipped]     = useState(0)
  const [errors, setErrors]       = useState<string[]>([])
  const [fileName, setFileName]   = useState('')
  const [dragging, setDragging]   = useState(false)
  const [importing, setImporting] = useState(false)

  // ── Reset on close ─────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep('upload')
    setRows([])
    setErrors([])
    setFileName('')
    onClose()
  }

  // ── File processing ────────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setErrors(['El archivo debe ser un CSV (.csv)'])
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseBankCSV(text)
      setSkipped(result.skipped)
      setErrors(result.errors)

      const importRows: ImportRow[] = result.rows.map((row) => ({
        ...row,
        selected: true,
        category: guessCategory(row.title),
      }))
      setRows(importRows)
      setStep('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ── Row operations ─────────────────────────────────────────────────────────
  const toggleRow        = (idx: number) =>
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))

  const setRowCategory   = (idx: number, cat: Category) =>
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, category: cat } : r))

  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected)
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })))
  }

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setImporting(true)
    for (const row of rows.filter((r) => r.selected)) {
      addExpense({ title: row.title, amount: row.amount, category: row.category, date: row.date })
    }
    await new Promise((r) => setTimeout(r, 300))
    setImporting(false)
    setStep('done')
  }

  const selectedCount = rows.filter((r) => r.selected).length
  const allSelected   = rows.length > 0 && rows.every((r) => r.selected)

  const selectClass =
    'bg-surface-3 border border-white/8 text-ink-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-accent-lime/40 [color-scheme:dark] appearance-none cursor-pointer pr-5'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === 'upload'  ? 'Importar extracto bancario' :
        step === 'preview' ? `Vista previa — ${rows.length} movimientos` :
        'Importación completada'
      }
      size="xl"
    >

      {/* ── STEP 1: Upload ── */}
      {step === 'upload' && (
        <div className="space-y-5">
          <p className="text-sm text-ink-400 leading-relaxed">
            Subí el CSV de tu extracto bancario. El archivo debe tener las columnas{' '}
            <span className="font-semibold text-ink-200">FECHA</span>,{' '}
            <span className="font-semibold text-ink-200">CONCEPTO</span> y{' '}
            <span className="font-semibold text-ink-200">DEBITO</span>.
            Solo se importan los débitos (gastos).
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3
              h-44 rounded-2xl border-2 border-dashed cursor-pointer
              transition-all duration-200
              ${dragging
                ? 'border-accent-lime bg-accent-lime/8 scale-[1.01]'
                : 'border-white/10 bg-surface-3 hover:border-white/20'}
            `}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-accent-lime/20' : 'bg-surface-4'}`}>
              <Upload size={22} className={dragging ? 'text-accent-lime' : 'text-ink-500'} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-300">
                {dragging ? 'Soltá el archivo aquí' : 'Arrastrá tu CSV o hacé clic'}
              </p>
              <p className="text-xs text-ink-600 mt-1">Solo archivos .csv</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Column format hint */}
          <div className="bg-surface-3 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
              Columnas requeridas
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { col: 'FECHA',    desc: 'Fecha del movimiento',  eg: '15/03/2025' },
                { col: 'CONCEPTO', desc: 'Descripción del gasto', eg: 'SUPERMERCADO DISCO' },
                { col: 'DEBITO',   desc: 'Monto debitado',        eg: '1.250,00' },
              ].map(({ col, desc, eg }) => (
                <div key={col} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-accent-lime font-mono">{col}</span>
                  <span className="text-xs text-ink-500">{desc}</span>
                  <span className="text-xs text-ink-700 font-mono">{eg}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-600 pt-1 border-t border-white/5">
              Las filas donde DEBITO está vacío se ignoran automáticamente (créditos, saldos, etc.)
            </p>
          </div>

          {errors.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-rose/8 border border-accent-rose/20">
              <AlertCircle size={14} className="text-accent-rose flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-rose">{errors[0]}</p>
            </div>
          )}

          <Button variant="ghost" onClick={handleClose} fullWidth>Cancelar</Button>
        </div>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">

          {/* Stats bar */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="text-ink-600" />
              <span className="text-ink-400 font-medium truncate max-w-[220px]">{fileName}</span>
            </div>
            <span className="text-accent-lime font-semibold font-numbers">{rows.length} movimientos</span>
            {skipped > 0 && <span className="text-ink-600">{skipped} líneas ignoradas</span>}
            <div className="flex-1" />
            <span className="text-ink-400">{selectedCount} seleccionados</span>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-ink-600">
              <AlertCircle size={32} className="mb-2 opacity-30" />
              <p className="text-sm font-medium text-ink-400">No se encontraron movimientos válidos</p>
              <p className="text-xs mt-1 text-ink-600 text-center max-w-xs">
                Verificá que el archivo tenga las columnas FECHA, CONCEPTO y DEBITO
              </p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setStep('upload')}>
                Intentar de nuevo
              </Button>
            </div>
          ) : (
            <>
              {/* Select all + column headers */}
              <div className="flex items-center gap-3 px-4 py-2 bg-surface-3 rounded-xl text-xs text-ink-600 font-semibold uppercase tracking-wider">
                <button onClick={toggleAll} className="flex items-center gap-2 text-ink-400 hover:text-ink-200 transition-colors flex-shrink-0">
                  {allSelected
                    ? <CheckSquare size={13} className="text-accent-lime" />
                    : <Square size={13} />}
                </button>
                {/* Widths mirror the data rows below */}
                <span className="w-20 flex-shrink-0">Fecha</span>
                <span className="flex-1 min-w-0">Concepto</span>
                <span className="w-36 flex-shrink-0">Categoría</span>
                <span className="w-24 text-right flex-shrink-0">Monto</span>
              </div>

              {/* Scrollable rows */}
              <div className="max-h-[380px] overflow-y-auto rounded-xl border border-white/6 divide-y divide-white/4">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      row.selected
                        ? 'bg-surface-2 hover:bg-surface-3'
                        : 'bg-surface-2 opacity-40'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleRow(idx)}
                      className="flex-shrink-0 text-ink-500 hover:text-ink-200 transition-colors"
                    >
                      {row.selected
                        ? <CheckSquare size={14} className="text-accent-lime" />
                        : <Square size={14} />}
                    </button>

                    {/* FECHA */}
                    <span className="text-xs font-numbers text-ink-500 flex-shrink-0 w-20">
                      {formatDate(row.date)}
                    </span>

                    {/* CONCEPTO — full width, wraps if needed */}
                    <span className="text-xs text-ink-200 flex-1 min-w-0 leading-relaxed">
                      {row.title}
                    </span>

                    {/* Category selector */}
                    <div className="relative flex-shrink-0 w-36">
                      <select
                        value={row.category}
                        onChange={(e) => setRowCategory(idx, e.target.value as Category)}
                        onClick={(e) => e.stopPropagation()}
                        className={`${selectClass} w-full`}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none" />
                    </div>

                    {/* DEBITO */}
                    <span className="text-xs font-numbers font-semibold text-ink-100 flex-shrink-0 w-24 text-right">
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  ← Volver
                </Button>
                <div className="flex-1" />
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={selectedCount === 0 || importing}
                >
                  {importing ? 'Importando…' : (
                    <>
                      <Check size={14} />
                      Importar {selectedCount} gasto{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 'done' && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-lime/15 border border-accent-lime/25 flex items-center justify-center">
            <Check size={28} className="text-accent-lime" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-display font-semibold text-ink-100">¡Importación exitosa!</p>
            <p className="text-sm text-ink-500">
              {selectedCount} gasto{selectedCount !== 1 ? 's' : ''} agregado{selectedCount !== 1 ? 's' : ''} a tu lista
            </p>
          </div>
          <Button variant="primary" onClick={handleClose} fullWidth>Listo</Button>
        </div>
      )}
    </Modal>
  )
}
