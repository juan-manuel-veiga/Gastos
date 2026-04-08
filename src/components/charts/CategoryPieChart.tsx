import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore, selectMonthExpenses, selectByCategory } from '@/store'
import { CATEGORY_COLORS } from '@/types/expense'
import { formatCurrency } from '@/utils/formatCurrency'
import { Card } from '@/components/ui/Card'
import { PieChart as PieIcon } from 'lucide-react'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-surface-3 border border-white/10 rounded-xl px-3 py-2 shadow-modal text-sm">
      <p className="font-medium text-ink-100">{item.name}</p>
      <p className="text-ink-400 font-numbers">{formatCurrency(item.value)}</p>
    </div>
  )
}

export function CategoryPieChart() {
  const { activeMonth, expenses } = useStore()
  const monthExpenses = selectMonthExpenses(expenses, activeMonth)
  const byCategory    = selectByCategory(monthExpenses)
  const total         = Object.values(byCategory).reduce((s, v) => s + v, 0)

  const data = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#666',
      pct: total > 0 ? ((value / total) * 100).toFixed(0) : '0',
    }))

  const isEmpty = data.length === 0

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <PieIcon size={14} className="text-ink-500" />
        <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
          Por Categoría
        </h3>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-36 text-ink-600">
          <PieIcon size={32} className="mb-2 opacity-20" />
          <p className="text-sm">Sin gastos este mes</p>
        </div>
      ) : (
        /* gap-12 = wider separation between donut and legend */
        <div className="flex flex-col sm:flex-row gap-12 items-start">

          {/* Donut chart */}
          <div className="h-52 w-full sm:w-52 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={98}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={0}
                  animationDuration={600}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Vertical divider — visible on sm+ */}
          <div className="hidden sm:block w-px self-stretch bg-white/5 flex-shrink-0 -mx-6" />

          {/* Legend grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 self-center w-full">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-ink-400 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-numbers text-ink-300">
                    {formatCurrency(item.value)}
                  </span>
                  <span
                    className="text-xs font-numbers px-1.5 py-0.5 rounded-md min-w-[36px] text-center"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {item.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
