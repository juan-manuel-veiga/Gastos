/**
 * firestore.ts
 *
 * All Firestore interactions live here.
 * The rest of the app imports only from this file — not from firebase/firestore directly.
 *
 * Data model
 * ──────────
 * Collection: "expenses"
 *   Documents: one per Expense, id = expense.id
 *   Fields: { title, amount, originalAmount?, isShared?, category, date, updatedAt }
 *
 * Collection: "salaries"
 *   Documents: one per month, id = "yyyy-MM"
 *   Fields: { amount, updatedAt }
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

// ─── Expenses ─────────────────────────────────────────────────────────────────

/** Write (create or overwrite) a single expense */
export async function fsSetExpense(expense: Expense): Promise<void> {
  const { id, ...rest } = expense
  const cleanData = Object.fromEntries(
  Object.entries({
    ...rest,
    updatedAt: serverTimestamp(),
  }).filter(([_, v]) => v !== undefined)
)

await setDoc(doc(expensesCol(), id), cleanData)
}

/** Delete a single expense */
export async function fsDeleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(expensesCol(), id))
}

/** Bulk-write many expenses (used during migration) */
export async function fsBatchSetExpenses(expenses: Expense[]): Promise<void> {
  // Firestore batch limit is 500 writes
  const CHUNK = 500
  for (let i = 0; i < expenses.length; i += CHUNK) {
    const batch = writeBatch(db)
    expenses.slice(i, i + CHUNK).forEach((expense) => {
      const { id, ...rest } = expense
      batch.set(doc(expensesCol(), id), {
        ...rest,
        updatedAt: serverTimestamp(),
      })
    })
    await batch.commit()
  }
}

/** One-time fetch of all expenses (used on first load / migration check) */
export async function fsGetAllExpenses(): Promise<Expense[]> {
  const snap = await getDocs(query(expensesCol(), orderBy('date', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense))
}

/**
 * Subscribe to real-time expense updates.
 * Returns an unsubscribe function.
 * onData fires immediately with the current snapshot, then on every change.
 */
export function fsSubscribeExpenses(
  onData: (expenses: Expense[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(expensesCol(), orderBy('date', 'desc')),
    (snap) => {
      const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense))
      onData(expenses)
    },
    (err) => {
      console.error('[Firestore] expenses snapshot error:', err)
      onError?.(err)
    }
  )
}

// ─── Salaries ─────────────────────────────────────────────────────────────────

/** Write salary for a specific month */
export async function fsSetSalary(month: string, amount: number): Promise<void> {
  await setDoc(doc(salariesCol(), month), {
    amount,
    updatedAt: serverTimestamp(),
  })
}

/** Bulk-write many salaries (used during migration) */
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

/** One-time fetch of all salaries */
export async function fsGetAllSalaries(): Promise<Record<string, number>> {
  const snap = await getDocs(salariesCol())
  const result: Record<string, number> = {}
  snap.docs.forEach((d) => {
    result[d.id] = (d.data() as { amount: number }).amount
  })
  return result
}

/**
 * Subscribe to real-time salary updates.
 * Returns an unsubscribe function.
 */
export function fsSubscribeSalaries(
  onData: (salaries: Record<string, number>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    salariesCol(),
    (snap) => {
      const salaries: Record<string, number> = {}
      snap.docs.forEach((d) => {
        salaries[d.id] = (d.data() as { amount: number }).amount
      })
      onData(salaries)
    },
    (err) => {
      console.error('[Firestore] salaries snapshot error:', err)
      onError?.(err)
    }
  )
}
