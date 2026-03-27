import React from 'react'

interface Props {
  active: boolean
  size?: number
  label?: string
}

export function ActiveIndicator({ active, size = 8, label }: Props): React.ReactElement | null {
  if (!active) return null

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="rounded-full apex-dot-pulse"
        style={{
          width: size,
          height: size,
          background: '#10b981',
          boxShadow: '0 0 6px rgba(16,185,129,0.5)',
          minWidth: size,
        }}
      />
      {label && (
        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
          {label}
        </span>
      )}
    </div>
  )
}
