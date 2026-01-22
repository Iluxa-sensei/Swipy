import crypto from 'crypto'

const getBaseUrl = (req) => {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}

const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (padded.length % 4)) % 4
  return Buffer.from(padded + '='.repeat(padLength), 'base64').toString()
}

const verifyState = (state, secret) => {
  const [payload, signature] = (state || '').split('.')
  if (!payload || !signature) return null

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
    if (!isValid) return null
  } catch {
    return null
  }

  try {
    return JSON.parse(fromBase64Url(payload))
  } catch {
    return null
  }
}

const normalizeRedirect = (redirectTo, baseUrl) => {
  try {
    const base = new URL(baseUrl)
    const target = new URL(redirectTo, baseUrl)
    if (target.origin !== base.origin) {
      return `${baseUrl}/auth/callback`
    }
    return target.toString()
  } catch {
    return `${baseUrl}/auth/callback`
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed')
    return
  }

  const baseUrl = getBaseUrl(req)
  const { code, state, error } = req.query || {}

  if (error) {
    res.redirect(`${baseUrl}/login?oauth_error=${encodeURIComponent(error)}`)
    return
  }

  if (!code || !state) {
    res.redirect(`${baseUrl}/login?oauth_error=missing_code_or_state`)
    return
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_OAUTH_STATE_SECRET) {
    res.redirect(`${baseUrl}/login?oauth_error=missing_oauth_configuration`)
    return
  }

  const statePayload = verifyState(state, process.env.GOOGLE_OAUTH_STATE_SECRET)
  if (!statePayload) {
    res.redirect(`${baseUrl}/login?oauth_error=invalid_state`)
    return
  }

  const maxAgeMs = 10 * 60 * 1000
  if (Date.now() - statePayload.t > maxAgeMs) {
    res.redirect(`${baseUrl}/login?oauth_error=state_expired`)
    return
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenResponse.json()
  if (!tokenResponse.ok || !tokenData.id_token) {
    const reason = tokenData.error || 'token_exchange_failed'
    res.redirect(`${baseUrl}/login?oauth_error=${encodeURIComponent(reason)}`)
    return
  }

  const redirectTarget = normalizeRedirect(statePayload.redirectTo, baseUrl)
  const redirectUrl = new URL(redirectTarget)
  const hashParams = new URLSearchParams({
    provider: 'google',
    id_token: tokenData.id_token,
  })

  if (tokenData.access_token) {
    hashParams.set('access_token', tokenData.access_token)
  }

  redirectUrl.hash = hashParams.toString()
  res.redirect(redirectUrl.toString())
}
