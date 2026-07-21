import React from 'react'

const JobMatchCard = ({ match, blurred = false }) => {
  return (
    <div className={`rounded-2xl border border-glass-border bg-bg-secondary/50 p-4 transition-all ${blurred ? 'blur-[6px] pointer-events-none select-none' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{match.job_title}</h3>
          <p className="text-sm text-text-secondary">{match.company || 'Company not specified'}</p>
        </div>
        <div className="rounded-full bg-accent-primary/20 px-3 py-1 text-xs font-semibold text-accent-primary">
          {match.match_score}%
        </div>
      </div>

      {match.why_match && (
        <p className="text-sm text-text-secondary mb-3">{match.why_match}</p>
      )}

      {Array.isArray(match.rewritten_bullets) && match.rewritten_bullets.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-text-secondary mb-1">Optimized experience bullets</p>
          <ul className="space-y-1">
            {match.rewritten_bullets.map((bullet, idx) => (
              <li key={`${idx}-${bullet}`} className="text-sm text-text-primary">• {bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(match.skill_gaps) && match.skill_gaps.length > 0 && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary mb-1">Skill gaps</p>
          <ul className="space-y-1">
            {match.skill_gaps.map((gapItem, idx) => (
              <li key={`${idx}-${gapItem?.gap || 'gap'}`} className="text-sm text-text-secondary">
                <span className="text-text-primary">{gapItem?.gap || 'Gap'}:</span> {gapItem?.suggestion || ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.apply_url && (
        <a
          href={match.apply_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Apply now
          <i className="fas fa-arrow-up-right-from-square text-[10px]"></i>
        </a>
      )}
    </div>
  )
}

export default JobMatchCard
