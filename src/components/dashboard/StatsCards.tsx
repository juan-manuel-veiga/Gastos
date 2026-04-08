import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Target, Pencil, Check, X, PiggyBank } from 'lucide-react'
import { useStore, selectMonthExpenses, selectTotalSpent, selectAccumulatedSavings } from '@/store'
import { formatCurrency } from '@/utils/formatCurrency'
import { Card } from '@/components/ui/Card'
import {
  LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

// ─── Generic stat card ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: string
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ label, value, sub, icon, accent, trend }: StatCardProps) {
  return (
    <Card className="p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-ink-500 uppercase tracking-wider">{label}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent ? `${accent}18` : undefined }}
        >
          <span style={{ color: accent || '#a9a590' }}>{icon}</span>
        </div>
      </div>
      <p className="font-numbers text-2xl font-bold text-ink-100 tracking-tight">
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1.5 flex items-center gap-1 ${
          trend === 'up'   ? 'text-accent-rose' :
          trend === 'down' ? 'text-accent-lime' :
          'text-ink-500'
        }`}>
          {trend === 'up'   && <TrendingUp   size={11} />}
          {trend === 'down' && <TrendingDown size={11} />}
          {sub}
        </p>
      )}
    </Card>
  )
}

// ─── Editable salary card ─────────────────────────────────────────────────────

function SalaryCard({ activeMonth }: { activeMonth: string }) {
  const { getSalary, setSalary } = useStore()
  const salary = getSalary(activeMonth)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')

  const startEdit = () => { setDraft(salary > 0 ? String(salary) : ''); setEditing(true) }
  const commit    = () => { setSalary(activeMonth, parseFloat(draft) || 0); setEditing(false) }
  const cancel    = () => setEditing(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  commit()
    if (e.key === 'Escape') cancel()
  }

  return (
    <Card className="p-5 animate-slide-up group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-ink-500 uppercase tracking-wider">Sueldo</p>
        <div className="flex items-center gap-1.5">
          {!editing && (
            <button
              onClick={startEdit}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-ink-600 hover:text-accent-lime hover:bg-accent-lime/10 transition-all"
              title="Editar sueldo"
            >
              <Pencil size={12} />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-lime/18">
            <DollarSign size={16} className="text-accent-lime" />
          </div>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            autoFocus
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className="w-full bg-surface-3 border border-accent-lime/40 rounded-xl px-3 py-2 font-numbers text-xl font-bold text-ink-100 outline-none focus:ring-1 focus:ring-accent-lime/20 transition-all placeholder:text-ink-700"
          />
          <div className="flex gap-2">
            <button onClick={commit} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent-lime/15 border border-accent-lime/30 text-accent-lime text-xs font-semibold hover:bg-accent-lime/25 transition-colors">
              <Check size={12} /> Guardar
            </button>
            <button onClick={cancel} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-3 border border-white/8 text-ink-500 text-xs font-semibold hover:text-ink-300 transition-colors">
              <X size={12} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p
            className="font-numbers text-2xl font-bold text-ink-100 tracking-tight cursor-pointer hover:text-accent-lime transition-colors"
            onClick={startEdit}
            title="Clic para editar"
          >
            {salary > 0
              ? formatCurrency(salary)
              : <span className="text-ink-600 text-lg">— clic para agregar</span>}
          </p>
          <p className="text-xs text-ink-500 mt-1.5">
            {salary === 0 ? 'Sin sueldo configurado' : 'Ingreso del mes'}
          </p>
        </>
      )}
    </Card>
  )
}

// ─── Accumulated savings card ─────────────────────────────────────────────────

function AccumulatedSavingsCard() {
  const { expenses, salaries, activeMonth } = useStore()
  const rows = selectAccumulatedSavings(expenses, salaries, activeMonth)

  const total = rows.length > 0 ? rows[rows.length - 1].cumulative : 0
  const isPositive = total >= 0

  // Tooltip for mini chart
  function MiniTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
    if (!active || !payload?.length) return null
    const { label, cumulative } = payload[0].payload
    return (
      <div className="bg-surface-3 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs shadow-modal">
        <p className="text-ink-500">{label}</p>
        <p className="font-numbers font-semibold text-ink-100">{formatCurrency(cumulative)}</p>
      </div>
    )
  }

  return (
    <Card className="p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-ink-500 uppercase tracking-wider">Ahorro Acumulado</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPositive ? 'bg-accent-lime/18' : 'bg-accent-rose/18'}`}>
          <PiggyBank size={16} className={isPositive ? 'text-accent-lime' : 'text-accent-rose'} />
        </div>
      </div>

      <p className={`font-numbers text-2xl font-bold tracking-tight ${isPositive ? 'text-ink-100' : 'text-accent-rose'}`}>
        {total === 0 && rows.length === 0
          ? <span className="text-ink-600 text-lg">Sin datos aún</span>
          : formatCurrency(total)}
      </p>

      <p className="text-xs text-ink-500 mt-1.5">
        {rows.length > 1
          ? `En ${rows.length} meses registrados`
          : rows.length === 1
          ? 'Este mes'
          : 'Configurá tu sueldo para ver esto'}
      </p>

      {/* Mini sparkline — only show when there are 2+ data points */}
      {rows.length >= 2 && (
        <div className="mt-4 h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <Tooltip content={<MiniTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke={isPositive ? '#c8f54a' : '#f54a6e'}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function StatsCards() {
  const { activeMonth, expenses, getSalary } = useStore()
  const salary        = getSalary(activeMonth)
  const monthExpenses = selectMonthExpenses(expenses, activeMonth)
  const totalSpent    = selectTotalSpent(monthExpenses)
  const remaining     = salary - totalSpent

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <SalaryCard activeMonth={activeMonth} />

      <StatCard
        label="Gastado"
        value={formatCurrency(totalSpent)}
        sub={
          salary > 0
            ? `Disponible: ${formatCurrency(Math.max(remaining, 0))}`
            : `${monthExpenses.length} transacciones`
        }
        icon={<TrendingUp size={16} />}
        accent="#f54a6e"
        trend={remaining < 0 ? 'up' : 'neutral'}
      />

      <StatCard
        label="Balance"
        value={formatCurrency(Math.abs(remaining))}
        sub={remaining >= 0 ? 'a favor este mes' : 'en negativo este mes'}
        icon={<Target size={16} />}
        accent={remaining >= 0 ? '#4ab8f5' : '#f54a6e'}
        trend={remaining < 0 ? 'up' : 'neutral'}
      />

      <AccumulatedSavingsCard />
    </div>
  )
}
