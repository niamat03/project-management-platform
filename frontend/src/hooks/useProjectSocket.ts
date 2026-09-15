import { useEffect, useRef } from 'react'
import { tokenStorage } from '../services/api'

type EventHandler = (payload: any) => void

/**
 * One WebSocket connection per mounted project view. Handles reconnection
 * with backoff so a dropped connection (sleep/wifi blip) recovers on its
 * own instead of silently going stale (section 47).
 */
export function useProjectSocket(projectId: number | undefined, handlers: Record<string, EventHandler>) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!projectId) return

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closedByCleanup = false
    let attempt = 0

    const connect = () => {
      const token = tokenStorage.getAccess()
      if (!token) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${protocol}//${window.location.host}/ws/projects/${projectId}/?token=${token}`
      socket = new WebSocket(url)

      socket.onopen = () => {
        attempt = 0
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const handler = handlersRef.current[data.event]
          handler?.(data.payload)
        } catch {
          // ignore malformed frames
        }
      }

      socket.onclose = () => {
        if (closedByCleanup) return
        attempt += 1
        const delay = Math.min(1000 * 2 ** attempt, 15000)
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      closedByCleanup = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [projectId])
}
