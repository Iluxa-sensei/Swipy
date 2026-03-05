import React from 'react'

/**
 * Renders GPT job summary text: **bold** → <strong>, ### → subheading, "- " → list with middle dot (·).
 */
function renderInlineContent(content) {
    const segments = content.split(/\*\*/)
    return segments.map((seg, j) =>
        j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-text-primary">
                {seg}
            </strong>
        ) : (
            seg
        )
    )
}

export function JobSummaryContent({ text, className = '' }) {
    if (!text || typeof text !== 'string') return null

    const lines = text.split(/\n/)
    return (
        <div className={`leading-relaxed whitespace-pre-line ${className}`}>
            {lines.map((line, i) => {
                const isHeading = line.startsWith('###')
                const isListItem = !isHeading && line.startsWith('- ')
                const content = isHeading
                    ? line.replace(/^#+\s*/, '').trim()
                    : isListItem
                        ? line.slice(2)
                        : line
                const contentNodes = renderInlineContent(content)

                if (isHeading) {
                    return (
                        <h3 key={i} className="text-base font-semibold text-text-primary mt-4 mb-1 first:mt-0">
                            {contentNodes}
                        </h3>
                    )
                }
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
