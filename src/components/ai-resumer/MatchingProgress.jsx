import React from 'react'
import Loader from '../Loader.jsx'

const STAGES = [
  { id: 'queued', label: 'Preparing' },
  { id: 'parsing', label: 'Reading profile' },
  { id: 'matching', label: 'Matching jobs' },
  { id: 'completed', label: 'Results ready' },
]

const MatchingProgress = ({ status, stageMessage }) => {
  const label = stageMessage || (status === 'queued' ? 'Queued...' : 'Working on your matches...')
  const currentIndex = Math.max(0, STAGES.findIndex((stage) => stage.id === status))
  const progressByStatus = {
    queued: 12,
    parsing: 38,
    matching: 76,
    completed: 100,
  }
  const progress = progressByStatus[status] || 8

  return (
    <div className="overflow-hidden rounded-2xl border border-glass-border bg-bg-secondary/60">
      <div className="h-1.5 bg-bg-tertiary">
        <div
          className="h-full bg-gradient-to-r from-blue-400 via-accent-primary to-cyan-400 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 text-center">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-primary/30 bg-accent-primary/10">
          <Loader />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent-primary animate-ping"></span>
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent-primary"></span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary mb-2">AI Resumer</p>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Building your best job matches</h3>
        <p className="text-sm text-text-secondary min-h-[20px]">{label}</p>
        <p className="mt-2 text-xs text-text-secondary/70">This keeps running if you leave the page.</p>

        <div className="mt-6 grid grid-cols-4 gap-1">
          {STAGES.map((stage, index) => {
            const isComplete = index < currentIndex
            const isCurrent = index === currentIndex
            return (
              <div key={stage.id} className="flex flex-col items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] transition-all ${
                  isComplete
                    ? 'border-accent-primary bg-accent-primary text-white'
                    : isCurrent
                      ? 'border-accent-primary bg-accent-primary/20 text-accent-primary animate-pulse'
                      : 'border-glass-border bg-bg-tertiary text-text-secondary'
                }`}>
                  {isComplete ? <i className="fas fa-check"></i> : index + 1}
                </div>
                <span className={`text-[10px] leading-tight ${isCurrent || isComplete ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-xl border border-glass-border/60 bg-bg-primary/40 p-3 text-left">
          <div className="flex items-center gap-2">
            <i className="fas fa-wand-magic-sparkles text-accent-primary text-xs"></i>
            <p className="text-xs font-medium text-text-primary">What AI is doing now</p>
          </div>
          <p className="mt-2 text-xs text-text-secondary">{label}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-tertiary">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-transparent via-accent-primary/70 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchingProgress
