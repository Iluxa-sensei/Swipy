import React, { useEffect, useState } from 'react'
import { startupService } from '../../services/startupService.js'

const SwipyStartupPicker = ({ userId, isOpen, onClose, onSelect }) => {
  const [loading, setLoading] = useState(false)
  const [startups, setStartups] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !userId) return

    let mounted = true
    const loadStartups = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await startupService.getUserStartups(userId)
        if (!mounted) return
        setStartups(data || [])
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load startups')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadStartups()
    return () => { mounted = false }
  }, [isOpen, userId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="w-full sm:w-[520px] bg-bg-secondary border border-glass-border rounded-t-3xl sm:rounded-3xl p-5 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-text-primary mb-1">Attach Swipy startup</h3>
        <p className="text-sm text-text-secondary mb-4">Pick one of your registered startups as work experience.</p>

        {loading && <p className="text-sm text-text-secondary">Loading your startups...</p>}
        {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

        {!loading && startups.length === 0 && (
          <p className="text-sm text-text-secondary mb-4">No startups found for your profile yet.</p>
        )}

        <div className="space-y-2">
          {startups.map((startup) => (
            <button
              key={startup.id}
              type="button"
              onClick={() => onSelect(startup)}
              className="w-full rounded-xl border border-glass-border bg-bg-primary/60 p-3 text-left hover:bg-bg-tertiary/60"
            >
              <p className="text-sm font-semibold text-text-primary">{startup.name}</p>
              <p className="text-xs text-text-secondary mt-1">
                {[startup.industry, startup.stage, startup.location].filter(Boolean).join(' • ')}
              </p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 rounded-xl border border-glass-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-tertiary/50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default SwipyStartupPicker
