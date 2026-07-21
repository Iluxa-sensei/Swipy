import React from 'react'
import JobMatchCard from './JobMatchCard.jsx'

const MatchResultsGrid = ({ matches = [], onSeeAll, onRetrySearch, onEditProfile, onStartOver }) => {
  if (!matches.length) {
    return (
      <div className="rounded-2xl border border-glass-border bg-bg-secondary/40 p-6 space-y-4">
        <div className="text-center">
          <p className="text-text-primary font-medium">No matches available yet.</p>
          <p className="text-sm text-text-secondary mt-1">
            Try broadening your search or update your profile details.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onRetrySearch}
            className="rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try broader search
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="rounded-xl border border-accent-primary/40 px-4 py-2.5 text-sm font-semibold text-accent-primary hover:bg-accent-primary/10"
          >
            Edit profile
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="rounded-xl border border-glass-border px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-primary/40"
          >
            Start over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 relative">
      {matches.map((match) => {
        const blurred = match.rank > 3
        return <JobMatchCard key={match.id} match={match} blurred={blurred} />
      })}

      {matches.some((m) => m.rank > 3) && (
        <div className="sticky bottom-4 flex justify-center">
          <button
            type="button"
            onClick={onSeeAll}
            className="rounded-full border border-accent-primary/40 bg-bg-primary/95 px-5 py-2.5 text-sm font-semibold text-accent-primary shadow-lg backdrop-blur-xl"
          >
            See All Matches
          </button>
        </div>
      )}
    </div>
  )
}

export default MatchResultsGrid
