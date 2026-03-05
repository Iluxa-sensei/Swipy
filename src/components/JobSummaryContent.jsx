import React from 'react'

/**
 * Renders GPT job summary text: **bold** → <strong>, lines starting with "- " → list with middle dot (·).
 */
export function JobSummaryContent({ text, className = '' }) {
    if (!text || typeof text !== 'string') return null

    const lines = text.split(/\n/)
    return (
        <div className={`leading-relaxed whitespace-pre-line ${className}`}>
            {lines.map((line, i) => {
                const isListItem = line.startsWith('- ')
                const content = isListItem ? line.slice(2) : line
                const segments = content.split(/\*\*/)
                const contentNodes = segments.map((seg, j) =>
                    j % 2 === 1 ? (
                        <strong key={j} className="font-semibold text-text-primary">
                            {seg}
                        </strong>
                    ) : (
                        seg
                    )
                )

                if (isListItem) {
                    return (
                        <div key={i} className="flex gap-2 mt-1 first:mt-0">
                            <span className="text-text-secondary flex-shrink-0" aria-hidden>
                                ·
                            </span>
                            <span className="text-text-secondary">{contentNodes}</span>
                        </div>
                    )
                }
                return (
                    <div key={i} className="text-text-secondary mt-1 first:mt-0">
                        {contentNodes}
                    </div>
                )
            })}
        </div>
    )
}
