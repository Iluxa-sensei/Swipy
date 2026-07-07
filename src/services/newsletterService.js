const UNSUBSCRIBE_API = '/api/unsubscribe'

const VALID_STATUSES = new Set(['success', 'already_unsubscribed', 'invalid_token', 'error'])

/**
 * Unsubscribe a newsletter recipient by token via the backend API.
 * @param {string} token
 * @returns {Promise<'success'|'already_unsubscribed'|'invalid_token'|'error'>}
 */
export async function unsubscribeByToken(token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return 'invalid_token'
  }

  const params = new URLSearchParams({ token: token.trim() })
  const response = await fetch(`${UNSUBSCRIBE_API}?${params.toString()}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    return 'error'
  }

  const data = await response.json().catch(() => null)
  const status = data?.status

  if (VALID_STATUSES.has(status)) {
    return status
  }

  return 'error'
}
