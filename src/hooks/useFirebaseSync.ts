/**
 * useFirebaseSync
 *
 * Mounts real-time Firestore listeners on app start.
 * When Firestore emits a snapshot, the Zustand store is updated.
 *
 * This hook is the ONLY place that reads from Firestore in real-time.
 * All writes go through the store actions (which call firestore.ts directly).
 */

import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { fsSubscribeExpenses, fsSubscribeSalaries } from '@/services/firestore'

export type SyncState = 'connecting' | 'synced' | 'error'

export function useFirebaseSync() {
  const { setExpenses, setSalariesBulk } = useStore()
  const [syncState, setSyncState] = useState<SyncState>('connecting')

  useEffect(() => {
    let expensesReady = false
    let salariesReady = false

    const checkReady = () => {
      if (expensesReady && salariesReady) setSyncState('synced')
    }

    const unsubExpenses = fsSubscribeExpenses(
      (expenses) => {
        setExpenses(expenses)
        expensesReady = true
        checkReady()
      },
      () => setSyncState('error')
    )

    const unsubSalaries = fsSubscribeSalaries(
      (salaries) => {
        setSalariesBulk(salaries)
        salariesReady = true
        checkReady()
      },
      () => setSyncState('error')
    )

    return () => {
      unsubExpenses()
      unsubSalaries()
    }
  }, [setExpenses, setSalariesBulk])

  return syncState
}
