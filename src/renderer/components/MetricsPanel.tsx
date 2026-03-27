import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Cpu, MemoryStick } from 'lucide-react'
import { useSessionStore } from '../store/sessionStore'
import { useProjectStore } from '../store/projectStore'
import { ActiveIndicator } from './ActiveIndicator'

interface SystemMetrics {
  cpuPercent: number
  memoryUsedMB: number
  memoryTotalMB: number
}

function useSystemMetrics(): SystemMetrics {
  const [metrics, setMetrics] = useState<SystemMetrics>({ cpuPercent: 0, memoryUsedMB: 0, memoryTotalMB: 8192 })

  useEffect(() => {
    // Rough client-side estimate via performance API
    const update = () => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      if (mem) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsedMB: Math.round(mem.usedJSHeapSize / 1024 / 1024),
          memoryTotalMB: Math.round(mem.jsHeapSizeLimit / 1024 / 1024),
        }))
      }
    }
    update()
    const t = setInterval(update, 2000)
    return () => clearInterval(t)
  }, [])

  return metrics
}

function ArcGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1)
  const r = 36
  const cx = 44
  const cy = 44
  const circumference = Math.PI * r
  const dashOffset = circumference * (1 - pct)

  return (
    <svg width="88" height="52" viewBox="0 0 88 52">
      <path
        d={`M 8,44 A ${r},${r} 0 0 1 80,44`}
        fill="none"
        stroke="var(--apex-border-default)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d={`M 8,44 A ${r},${r} 0 0 1 80,44`}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${dashOffset}`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--apex-text-primary)">
        {Math.round(pct * 100)}%
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="var(--apex-text-muted)">
        {value}/{max}
      </text>
    </svg>
  )
}

export function MetricsPanel(): React.ReactElement {
  const { claudeProcesses } = useSessionStore()
  const { fsEvents } = useProjectStore()
  const metrics = useSystemMetrics()
  const [uptime, setUptime] = useState<Record<number, number>>({})

  useEffect(() => {
    const t = setInterval(() => {
      setUptime((prev) => {
        const next = { ...prev }
        claudeProcesses.forEach((p) => {
          const proc = p as { pid: number; startedAt: number }
          if (!next[proc.pid]) next[proc.pid] = Date.now()
        })
        return next
      })
    }, 1000)
    return () => clearInterval(t)
  }, [claudeProcesses])

  const formatUptime = (startMs: number): string => {
    const secs = Math.floor((Date.now() - startMs) / 1000)
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }

  return (
    <div
      className="flex flex-col gap-4 overflow-y-auto"
      style={{ width: '300px', minWidth: '300px', padding: '16px', borderLeft: '1px solid var(--apex-border-subtle)' }}
    >
      {/* System Pulse */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={13} color="var(--apex-text-muted)" />
          <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            System Pulse
          </span>
        </div>

        <div className="flex items-center justify-around mb-3">
          <div className="flex flex-col items-center gap-1">
            <ArcGauge value={metrics.cpuPercent} max={100} color="var(--apex-accent-cyan)" />
            <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)' }}>CPU</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArcGauge
              value={metrics.memoryUsedMB}
              max={metrics.memoryTotalMB}
              color="var(--apex-accent-violet)"
            />
            <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)' }}>Memory</span>
          </div>
        </div>

        {/* Memory bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <MemoryStick size={11} color="var(--apex-text-muted)" />
              <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)' }}>Heap</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--apex-text-secondary)' }}>
              {metrics.memoryUsedMB}MB / {metrics.memoryTotalMB}MB
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'var(--apex-border-subtle)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--apex-accent-violet)' }}
              animate={{ width: `${(metrics.memoryUsedMB / metrics.memoryTotalMB) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--apex-border-subtle)' }} />

      {/* Claude Sessions Feed */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ActiveIndicator active={claudeProcesses.length > 0} size={7} />
          <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Claude Sessions
          </span>
          {claudeProcesses.length > 0 && (
            <span className="ml-auto" style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.3)' }}>
              {claudeProcesses.length}
            </span>
          )}
        </div>

        {claudeProcesses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6" style={{ color: 'var(--apex-text-disabled)', fontSize: '12px' }}>
            <div style={{ fontSize: '24px', opacity: 0.3 }}>⬡</div>
            <div>No active sessions</div>
            <div style={{ fontSize: '11px', color: 'var(--apex-text-disabled)' }}>Launch claude in terminal to start</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {claudeProcesses.map((p) => {
              const proc = p as { pid: number; cwd: string; startedAt: number }
              const projectName = proc.cwd?.split(/[/\\]/).pop() || 'Unknown'
              return (
                <motion.div
                  key={proc.pid}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 apex-active-pulse"
                  style={{
                    background: 'rgba(16,185,129,0.07)',
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full apex-dot-pulse" style={{ background: '#10b981', minWidth: 8 }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apex-text-primary)' }}>
                          {projectName}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--apex-text-muted)', fontFamily: 'var(--apex-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {proc.cwd || 'Unknown dir'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#10b981', marginTop: 4 }}>
                        PID {proc.pid} · {uptime[proc.pid] ? formatUptime(uptime[proc.pid]) : 'starting...'}
                      </div>
                    </div>
                    <button
                      onClick={() => window.apex.process.kill(proc.pid)}
                      className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-accent-rose)', padding: 2 }}
                      title="Kill process"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      <div style={{ height: 1, background: 'var(--apex-border-subtle)' }} />

      {/* Activity Feed */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            File Activity
          </span>
        </div>
        <div className="flex flex-col gap-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {fsEvents.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--apex-text-disabled)', textAlign: 'center', padding: '16px 0' }}>
              Watching for file changes...
            </div>
          ) : (
            fsEvents.slice(0, 20).map((ev, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span
                  style={{
                    fontSize: '9px',
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: ev.event === 'add' ? 'rgba(16,185,129,0.15)' : ev.event === 'unlink' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: ev.event === 'add' ? '#10b981' : ev.event === 'unlink' ? '#f43f5e' : '#f59e0b',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {ev.event.slice(0, 3)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--apex-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {ev.path.split(/[/\\]/).pop()}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--apex-text-disabled)', whiteSpace: 'nowrap' }}>
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
