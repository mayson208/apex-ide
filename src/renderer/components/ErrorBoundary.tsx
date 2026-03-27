import React, { Component, ErrorInfo } from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex flex-col items-center justify-center h-full gap-4"
          style={{ background: 'var(--apex-bg-base)', color: 'var(--apex-text-secondary)', padding: '2rem' }}
        >
          <div style={{ fontSize: '48px', opacity: 0.3 }}>⚠</div>
          <div style={{ fontSize: '16px', color: 'var(--apex-text-primary)', fontWeight: 600 }}>
            Something went wrong
          </div>
          <div
            className="selectable"
            style={{
              fontSize: '12px',
              color: 'var(--apex-accent-rose)',
              background: 'var(--apex-bg-surface)',
              padding: '12px 16px',
              borderRadius: '8px',
              maxWidth: '600px',
              fontFamily: 'var(--apex-font-mono)',
              wordBreak: 'break-all',
            }}
          >
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px',
              background: 'var(--apex-accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
