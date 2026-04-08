import { useEffect } from 'react'

interface ShortcutMap {
  [key: string]: (e: KeyboardEvent) => void
}

export function useKeyboard(shortcuts: ShortcutMap, active = true) {
  useEffect(() => {
    if (!active) return

    const handler = (e: KeyboardEvent) => {
      // Don't fire in input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return
      }

      const key = buildKey(e)
      if (shortcuts[key]) {
        e.preventDefault()
        shortcuts[key](e)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts, active])
}

function buildKey(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.shiftKey) parts.push('shift')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}
