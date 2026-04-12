/**
 * useFirebaseSync
 *
 * Subscribes to Firestore real-time updates and syncs into Zustand.
 *
 * Uses hasPendingWrites to skip local-echo snapshots so optimistic updates
 * in the store are never overwritten before the server confirms them.
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
      (expenses, hasPendingWrites) => {
        // Skip the local echo — only apply confirmed server data
        if (hasPendingWrites) return
        setExpenses(expenses)
        expensesReady = true
        checkReady()
      },
      () => setSyncState('error')
    )

    const unsubSalaries = fsSubscribeSalaries(
      (salaries, hasPendingWrites) => {
        if (hasPendingWrites) return
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
