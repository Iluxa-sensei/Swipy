import crypto from 'crypto'

const getBaseUrl = (req) => {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const signState = (payload, secret) => {
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${hmac}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { redirectTo } = req.body || {}
  const baseUrl = getBaseUrl(req)
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_OAUTH_STATE_SECRET) {
    res.status(500).json({ error: 'Missing Google OAuth configuration' })
    return
  }

  const statePayload = {
    t: Date.now(),
    redirectTo: redirectTo || `${baseUrl}/auth/callback`,
  }

  const encodedPayload = toBase64Url(JSON.stringify(statePayload))
  const state = signState(encodedPayload, process.env.GOOGLE_OAUTH_STATE_SECRET)

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'consent',
    access_type: 'offline',
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  res.status(200).json({ authUrl })
}
