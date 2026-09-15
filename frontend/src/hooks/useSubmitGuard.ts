import { useCallback, useRef, useState } from 'react'

/**
 * Guards an async submit handler against double-submission from a fast
 * double-click. `isSubmitting` state alone isn't enough: React batches the
 * `setState(true)` call, so a second click that lands before the re-render
 * flushes can still slip through and fire a second request. The ref check
 * here is synchronous, so the second click is rejected immediately.
 */
export function useSubmitGuard<Args extends unknown[]>(handler: (...args: Args) => Promise<void>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lockRef = useRef(false)

  const guarded = useCallback(async (...args: Args) => {
    if (lockRef.current) return
    lockRef.current = true
    setIsSubmitting(true)
    try {
      await handler(...args)
    } finally {
      lockRef.current = false
      setIsSubmitting(false)
    }
  }, [handler])

  return [guarded, isSubmitting] as const
}
