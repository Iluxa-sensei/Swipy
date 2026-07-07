/**
 * Manual verification script for newsletter unsubscribe flow.
 *
 * Usage (after running supabase/ADD_NEWSLETTER_SUBSCRIBERS.sql):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/verify-unsubscribe.mjs
 *
 * Optional:
 *   API_BASE=https://swipy.space node scripts/verify-unsubscribe.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiBase = (process.env.API_BASE || 'http://localhost:3000').replace(/\/$/, '')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const testEmail = `unsubscribe-test-${Date.now()}@example.com`

async function callApi(token) {
  const url = `${apiBase}/api/unsubscribe?token=${encodeURIComponent(token)}`
  const response = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body }
}

async function main() {
  console.log('1. Missing token → invalid_token')
  const missing = await callApi('')
  console.log('   ', missing)

  console.log('2. Invalid token → invalid_token')
  const invalid = await callApi('not-a-real-token')
  console.log('   ', invalid)

  console.log('3. Create test subscriber')
  const { data: inserted, error: insertError } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: testEmail })
    .select('id, unsubscribe_token, subscribed')
    .single()

  if (insertError) {
    console.error('Insert failed:', insertError.message)
    process.exit(1)
  }

  console.log('   token:', inserted.unsubscribe_token)

  console.log('4. Valid token → success')
  const first = await callApi(inserted.unsubscribe_token)
  console.log('   ', first)

  const { data: afterFirst } = await supabase
    .from('newsletter_subscribers')
    .select('subscribed, unsubscribed_at')
    .eq('id', inserted.id)
    .single()
  console.log('   db subscribed=false:', afterFirst?.subscribed === false)

  console.log('5. Same token again → already_unsubscribed')
  const second = await callApi(inserted.unsubscribe_token)
  console.log('   ', second)

  console.log('6. Cleanup test row')
  await supabase.from('newsletter_subscribers').delete().eq('id', inserted.id)

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
