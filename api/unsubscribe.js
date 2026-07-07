/**
 * Vercel Serverless: GET|POST /api/unsubscribe?token=...
 * Unsubscribes a newsletter recipient by unique token (idempotent).
 * Requires VITE_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'nodejs' }

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/

function getTokenFromRequest(request) {
  const url = new URL(request.url)
  const queryToken = url.searchParams.get('token')
  if (queryToken && queryToken.trim()) {
    return queryToken.trim()
  }
  return null
}

function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return false
  }
  return TOKEN_PATTERN.test(token.trim())
}

function jsonResponse(body, status = 200) {
  return Response.json(body, { status })
}

async function unsubscribeByToken(token) {
  if (!validateToken(token)) {
    return { status: 'invalid_token' }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Unsubscribe API: Supabase service role is not configured')
    return { status: 'error' }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.rpc('unsubscribe_newsletter', {
    p_token: token.trim(),
  })

  if (error) {
    console.error('Unsubscribe API: RPC error', error.message)
    return { status: 'error' }
  }

  const status = data?.status
  if (status === 'success' || status === 'already_unsubscribed' || status === 'invalid_token') {
    return { status }
  }

  console.error('Unsubscribe API: unexpected RPC response', data)
  return { status: 'error' }
}

async function handleUnsubscribe(request) {
  const token = getTokenFromRequest(request)
  const result = await unsubscribeByToken(token)
  return jsonResponse(result, result.status === 'error' ? 500 : 200)
}

export async function GET(request) {
  try {
    return await handleUnsubscribe(request)
  } catch (err) {
    console.error('Unsubscribe GET error:', err)
    return jsonResponse({ status: 'error' }, 500)
  }
}

export async function POST(request) {
  try {
    return await handleUnsubscribe(request)
  } catch (err) {
    console.error('Unsubscribe POST error:', err)
    return jsonResponse({ status: 'error' }, 500)
  }
}
