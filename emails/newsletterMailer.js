import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = join(__dirname, 'newsletter.html')
const SWIPY_BASE_URL = 'https://swipy.space'

/**
 * Generate a secure random unsubscribe token (64 hex chars).
 * Prefer DB trigger on insert; use this when creating subscribers in application code.
 */
export function generateUnsubscribeToken() {
  return randomBytes(32).toString('hex')
}

/**
 * Build the public unsubscribe URL for a subscriber token.
 * @param {string} unsubscribeToken
 */
export function buildUnsubscribeUrl(unsubscribeToken) {
  const params = new URLSearchParams({ token: unsubscribeToken })
  return `${SWIPY_BASE_URL}/unsubscribe?${params.toString()}`
}

/**
 * Replace {{placeholder}} tokens in the newsletter HTML template.
 * @param {Record<string, string>} variables
 */
export function renderNewsletterTemplate(variables) {
  let html = readFileSync(TEMPLATE_PATH, 'utf8')
  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value ?? '')
  }
  return html
}

/**
 * Build email payload for one recipient, including List-Unsubscribe headers.
 * @param {{
 *   to: string,
 *   unsubscribeToken: string,
 *   headline: string,
 *   bodyParagraph1: string,
 *   bodyParagraph2?: string,
 *   ctaUrl?: string,
 *   ctaLabel?: string,
 *   subject?: string,
 * }} options
 */
export function buildNewsletterEmail(options) {
  const {
    to,
    unsubscribeToken,
    headline,
    bodyParagraph1,
    bodyParagraph2 = '',
    ctaUrl = SWIPY_BASE_URL,
    ctaLabel = 'Visit Swipy',
    subject = 'Updates from Swipy',
  } = options

  if (!unsubscribeToken) {
    throw new Error('Each recipient must have an unsubscribeToken before sending.')
  }

  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken)

  const html = renderNewsletterTemplate({
    headline,
    body_paragraph_1: bodyParagraph1,
    body_paragraph_2: bodyParagraph2,
    cta_url: ctaUrl,
    cta_label: ctaLabel,
    unsubscribe_url: unsubscribeUrl,
  })

  return {
    to,
    subject,
    html,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}

/**
 * Example: send via your email provider (Resend, SendGrid, etc.).
 * Each recipient must be loaded with their own unsubscribe_token from newsletter_subscribers.
 */
export function buildBatchNewsletterEmails(recipients, content) {
  return recipients.map((recipient) =>
    buildNewsletterEmail({
      to: recipient.email,
      unsubscribeToken: recipient.unsubscribe_token,
      ...content,
    })
  )
}
