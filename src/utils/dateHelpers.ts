import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isToday,
  isYesterday,
  addMonths,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Expense } from '@/types/expense'

export function formatDate(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Hoy'
  if (isYesterday(d)) return 'Ayer'
  return format(d, "d 'de' MMMM", { locale: es })
}

export function formatMonthYear(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: es })
}

export function getCurrentMonthStr(): string {
  return format(new Date(), 'yyyy-MM')
}

export function navigateMonth(monthStr: string, direction: 1 | -1): string {
  const [y, m] = monthStr.split('-').map(Number)
  const base = new Date(y, m - 1, 1)
  const next = direction === 1 ? addMonths(base, 1) : subMonths(base, 1)
  return format(next, 'yyyy-MM')
}

export function isCurrentMonth(monthStr: string): boolean {
  return monthStr === getCurrentMonthStr()
}

export function filterByMonth(expenses: Expense[], monthStr: string): Expense[] {
  return expenses.filter((e) => e.date.startsWith(monthStr))
}

export interface DailySpend {
  day: string
  amount: number
  cumulative: number
}

export function buildDailySpend(expenses: Expense[], monthStr: string): DailySpend[] {
  const [y, m] = monthStr.split('-').map(Number)
  const base = new Date(y, m - 1, 1)
  const days = eachDayOfInterval({
    start: startOfMonth(base),
    end: endOfMonth(base),
  })

  let cumulative = 0
  return days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const amount = expenses
      .filter((e) => e.date === dayStr)
      .reduce((s, e) => s + e.amount, 0)
    cumulative += amount
    return {
      day: format(day, 'd MMM', { locale: es }),
      amount,
      cumulative,
    }
  })
}
