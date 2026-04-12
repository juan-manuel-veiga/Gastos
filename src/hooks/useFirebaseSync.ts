/**
 * useFirebaseSync
 *
 * Subscribes to Firestore real-time updates and syncs them into Zustand.
 *
 * Key fix: we use `snapshot.metadata.hasPendingWrites` to skip snapshots
 * that are local echoes of our own writes. We only apply remote data when
 * the snapshot comes from the server (hasPendingWrites === false), which
 * prevents the listener from reverting optimistic local updates.
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
        // Skip the local echo — only update Zustand when the server confirms
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
