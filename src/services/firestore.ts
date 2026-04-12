/**
 * firestore.ts — all Firestore interactions.
 *
 * Data model
 * ──────────
 * Collection: "expenses"   — one doc per Expense, id = expense.id
 * Collection: "salaries"   — one doc per month, id = "yyyy-MM"
 *
 * The onSnapshot callbacks receive a second argument `hasPendingWrites`.
 * Callers skip local-echo snapshots (hasPendingWrites === true) to avoid
 * overwriting optimistic updates before the server confirms them.
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Expense } from '@/types/expense'

// ─── Collection refs ──────────────────────────────────────────────────────────

const expensesCol = () => collection(db, 'expenses')
const salariesCol = () => collection(db, 'salaries')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip undefined fields — Firestore rejects them */
function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function fsSetExpense(expense: Expense): Promise<void> {
  const { id, ...rest } = expense
  await setDoc(doc(expensesCol(), id), {
    ...clean(rest as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  })
}

export async function fsDeleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(expensesCol(), id))
}

export async function fsBatchSetExpenses(expenses: Expense[]): Promise<void> {
  const CHUNK = 500
  for (let i = 0; i < expenses.length; i += CHUNK) {
    const batch = writeBatch(db)
    expenses.slice(i, i + CHUNK).forEach((expense) => {
      const { id, ...rest } = expense
      batch.set(doc(expensesCol(), id), {
        ...clean(rest as Record<string, unknown>),
        updatedAt: serverTimestamp(),
      })
    })
    await batch.commit()
  }
}

export async function fsGetAllExpenses(): Promise<Expense[]> {
  const snap = await getDocs(query(expensesCol(), orderBy('date', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense))
}

/**
 * Real-time subscription.
 * onData receives expenses + hasPendingWrites.
 * Skip updates when hasPendingWrites === true to avoid stomping local state.
 */
export function fsSubscribeExpenses(
  onData: (expenses: Expense[], hasPendingWrites: boolean) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(expensesCol(), orderBy('date', 'desc')),
    { includeMetadataChanges: true },
    (snap) => {
      const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense))
      onData(expenses, snap.metadata.hasPendingWrites)
    },
    (err) => {
      console.error('[Firestore] expenses snapshot error:', err)
      onError?.(err)
    }
  )
}

// ─── Salaries ─────────────────────────────────────────────────────────────────

export async function fsSetSalary(month: string, amount: number): Promise<void> {
  await setDoc(doc(salariesCol(), month), {
    amount,
    updatedAt: serverTimestamp(),
  })
}

export async function fsBatchSetSalaries(
  salaries: Record<string, number>
): Promise<void> {
  const entries = Object.entries(salaries).filter(([, v]) => v > 0)
  if (entries.length === 0) return
  const batch = writeBatch(db)
  entries.forEach(([month, amount]) => {
    batch.set(doc(salariesCol(), month), { amount, updatedAt: serverTimestamp() })
  })
  await batch.commit()
}

export async function fsGetAllSalaries(): Promise<Record<string, number>> {
  const snap = await getDocs(salariesCol())
  const result: Record<string, number> = {}
  snap.docs.forEach((d) => {
    result[d.id] = (d.data() as { amount: number }).amount
  })
  return result
}

export function fsSubscribeSalaries(
  onData: (salaries: Record<string, number>, hasPendingWrites: boolean) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    salariesCol(),
    { includeMetadataChanges: true },
    (snap) => {
      const salaries: Record<string, number> = {}
      snap.docs.forEach((d) => {
        salaries[d.id] = (d.data() as { amount: number }).amount
      })
      onData(salaries, snap.metadata.hasPendingWrites)
    },
    (err) => {
      console.error('[Firestore] salaries snapshot error:', err)
      onError?.(err)
    }
  )
}
