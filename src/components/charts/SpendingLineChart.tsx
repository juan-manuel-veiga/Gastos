import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useStore, selectMonthExpenses } from '@/store'
import { buildDailySpend, isCurrentMonth } from '@/utils/dateHelpers'
import { formatCurrency } from '@/utils/formatCurrency'
import { Card } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-3 border border-white/10 rounded-xl px-3 py-2 shadow-modal text-sm">
      <p className="text-ink-500 text-xs mb-1">{label}</p>
      <p className="font-numbers text-ink-100">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function SpendingLineChart() {
  const { expenses, activeMonth, getSalary } = useStore()
  const salary = getSalary(activeMonth)
  const monthExpenses = selectMonthExpenses(expenses, activeMonth)
  const data = buildDailySpend(monthExpenses, activeMonth)

  // For current month only show up to today; for past months show all
  const isCurrent = isCurrentMonth(activeMonth)
  const today = isCurrent ? parseInt(format(new Date(), 'd'), 10) : data.length
  const visibleData = data.slice(0, today)
  const isEmpty = visibleData.every((d) => d.amount === 0)

  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={14} className="text-ink-500" />
        <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
          Gasto Acumulado
        </h3>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-48 text-ink-600">
          <TrendingUp size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Sin gastos en este mes</p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8f54a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#c8f54a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: '#7d7962', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#7d7962', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {salary > 0 && (
                <ReferenceLine
                  y={salary}
                  stroke="#f54a6e"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{ value: 'Sueldo', fill: '#f54a6e', fontSize: 10, position: 'right' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#c8f54a"
                strokeWidth={2}
                fill="url(#spendGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#c8f54a', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
