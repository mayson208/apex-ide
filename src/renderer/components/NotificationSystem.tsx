import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useAppStore, type Notification } from '../store/appStore'

function NotifIcon({ type }: { type: Notification['type'] }) {
  const size = 16
  switch (type) {
    case 'success': return <CheckCircle size={size} color="#10b981" />
    case 'error': return <AlertCircle size={size} color="#f43f5e" />
    case 'warning': return <AlertTriangle size={size} color="#f59e0b" />
    default: return <Info size={size} color="#6366f1" />
  }
}

function getAccent(type: Notification['type']): string {
  switch (type) {
    case 'success': return '#10b981'
    case 'error': return '#f43f5e'
    case 'warning': return '#f59e0b'
    default: return '#6366f1'
  }
}

function NotifCard({ notif }: { notif: Notification }): React.ReactElement {
  const { removeNotification } = useAppStore()
  const accent = getAccent(notif.type)

  useEffect(() => {
    if (notif.autoDismiss !== false) {
      const t = setTimeout(() => removeNotification(notif.id), 4000)
      return () => clearTimeout(t)
    }
  }, [notif.id, notif.autoDismiss, removeNotification])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-start gap-3 p-3 rounded-xl shadow-2xl"
      style={{
        width: '320px',
        background: 'var(--apex-bg-elevated)',
        border: `1px solid ${accent}40`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${accent}20`,
      }}
    >
      <div className="mt-0.5 shrink-0">
        <NotifIcon type={notif.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-primary)' }}>
          {notif.title}
        </div>
        {notif.message && (
          <div style={{ fontSize: '12px', color: 'var(--apex-text-secondary)', marginTop: 2 }}>
            {notif.message}
          </div>
        )}
      </div>
      <button
        onClick={() => removeNotification(notif.id)}
        className="shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-secondary)', padding: 0 }}
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function NotificationSystem(): React.ReactElement {
  const { notifications } = useAppStore()

  return (
    <div
      className="fixed flex flex-col gap-2 z-50"
      style={{ top: '48px', right: '16px', pointerEvents: 'none' }}
    >
      <AnimatePresence>
        {notifications.map((n) => (
          <div key={n.id} style={{ pointerEvents: 'all' }}>
            <NotifCard notif={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
