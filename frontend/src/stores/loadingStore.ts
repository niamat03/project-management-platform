import { create } from 'zustand'

interface LoadingState {
  count: number
  increment: () => void
  decrement: () => void
}

/**
 * Tracks in-flight API requests so a global progress bar can show "the app
 * is working" during a slow request instead of looking frozen (this is what
 * made the ~4.5s pre-fix login feel like a broken calendar - nothing on
 * screen changed while the request was pending).
 */
export const useLoadingStore = create<LoadingState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}))
