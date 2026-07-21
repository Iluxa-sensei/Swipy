import React from 'react'

const StatusBadge = ({ status = '', message = '', onClick }) => {
  const normalized = String(status || '').toLowerCase()
  const isActive = ['queued', 'parsing', 'matching'].includes(normalized)
  if (!isActive) return null

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="inline-flex items-center gap-2 rounded-full border border-accent-primary/40 bg-bg-primary/95 px-3 py-1.5 text-xs font-medium text-accent-primary shadow-lg backdrop-blur-xl transition-colors enabled:hover:bg-accent-primary/20 enabled:cursor-pointer disabled:cursor-default"
      aria-label="View AI Resumer matching progress"
    >
      <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>
      <span>{message || 'Matching in progress...'}</span>
    </button>
  )
}

export default StatusBadge
