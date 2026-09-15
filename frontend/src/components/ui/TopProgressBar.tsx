import { useEffect, useState } from 'react'
import { useLoadingStore } from '../../stores/loadingStore'

/**
 * A slim bar under the top of the viewport that appears whenever at least
 * one API request is in flight. Purely visual reassurance that "the app is
 * working" during a slow request - the kind of feedback that was missing
 * when a ~4.5s login made the app look hung.
 */
export function TopProgressBar() {
  const isLoading = useLoadingStore((s) => s.count > 0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setVisible(true)
      return
    }
    // Keep the bar mounted briefly so it can finish its transition to 100%
    // instead of vanishing abruptly the instant the request resolves.
    const timeout = setTimeout(() => setVisible(false), 250)
    return () => clearTimeout(timeout)
  }, [isLoading])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-transparent">
      <div
        className={`h-full bg-brand-500 transition-all ease-out ${
          isLoading ? 'w-4/5 duration-[3000ms]' : 'w-full duration-200'
        }`}
      />
    </div>
  )
}
