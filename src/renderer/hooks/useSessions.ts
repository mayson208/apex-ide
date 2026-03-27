import { useEffect, useCallback } from 'react'
import { useSessionStore } from '../store/sessionStore'
import type { ApexSession } from '../store/sessionStore'

export function useSessions() {
  const { setSessions, setClaudeProcesses, setLoading } = useSessionStore()

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const sessions = await window.apex.sessions.list()
      setSessions(sessions as ApexSession[])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [setSessions, setLoading])

  const detectProcesses = useCallback(async () => {
    try {
      const processes = await window.apex.process.detectClaude()
      setClaudeProcesses(processes as never[])
    } catch {
      setClaudeProcesses([])
    }
  }, [setClaudeProcesses])

  useEffect(() => {
    loadSessions()
    detectProcesses()

    window.apex.process.startPolling()

    const unsub = window.apex.process.onUpdate((processes) => {
      setClaudeProcesses(processes as never[])
    })

    return () => {
      unsub()
      window.apex.process.stopPolling()
    }
  }, [loadSessions, detectProcesses, setClaudeProcesses])

  return { loadSessions, detectProcesses }
}
