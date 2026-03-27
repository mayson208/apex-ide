import { useState, useEffect, useCallback } from 'react'
import { useSessionStore } from '../store/sessionStore'

export function useClaudeProcess(projectPath?: string) {
  const { claudeProcesses } = useSessionStore()
  const [isActive, setIsActive] = useState(false)

  const checkActive = useCallback(() => {
    if (!projectPath) {
      setIsActive(claudeProcesses.length > 0)
      return
    }
    const active = claudeProcesses.some((p) => {
      const proc = p as { cwd: string }
      return proc.cwd && (proc.cwd === projectPath || proc.cwd.startsWith(projectPath))
    })
    setIsActive(active)
  }, [claudeProcesses, projectPath])

  useEffect(() => {
    checkActive()
  }, [checkActive])

  const activeProcess = projectPath
    ? claudeProcesses.find((p) => {
        const proc = p as { cwd: string }
        return proc.cwd && (proc.cwd === projectPath || proc.cwd.startsWith(projectPath))
      })
    : claudeProcesses[0]

  return { isActive, activeProcess, allProcesses: claudeProcesses }
}
