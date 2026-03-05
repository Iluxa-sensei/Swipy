/**
 * Vercel Serverless: POST /api/job-summary
 * Body: { url, title?, company?, location?, experience? }
 * Requires VITE_GPT_API_KEY and SCRAPINGBEE_API_KEY in Vercel env.
 */
import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.VITE_GPT_API_KEY || process.env.OPENAI_API_KEY
const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY
const SCRAPINGBEE_BASE_URL = 'https://app.scrapingbee.com/api/v1'

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

export const config = { runtime: 'nodejs' }

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { url, title, company, location, experience } = body
    if (!url || !String(url).trim()) {
      return Response.json({ error: 'Job URL is required' }, { status: 400 })
    }
    if (!openai || !OPENAI_API_KEY) {
      return Response.json(
        { error: 'OpenAI API key is not configured. Add VITE_GPT_API_KEY in Vercel Environment Variables.' },
        { status: 503 }
      )
    }
    if (!SCRAPINGBEE_API_KEY) {
      return Response.json(
        { error: 'SCRAPINGBEE_API_KEY is not configured in Vercel Environment Variables for job summary.' },
        { status: 503 }
      )
    }

    const sbParams = new URLSearchParams({
      api_key: SCRAPINGBEE_API_KEY,
      url: String(url).trim(),
      render_js: 'false',
      return_page_text: 'true',
    })
    const targetUrl = `${SCRAPINGBEE_BASE_URL}?${sbParams.toString()}`
    const pageRes = await fetch(targetUrl)
    if (!pageRes.ok) {
      const text = await pageRes.text()
      return Response.json(
        { error: `Browse API error ${pageRes.status}`, details: text.slice(0, 300) },
        { status: pageRes.status }
      )
    }

    const pageText = await pageRes.text()
    const snippet = pageText.slice(0, 8000)
    if (!snippet.trim()) {
      return Response.json({ summary: null, fallback: true })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a concise job-description summariser. Given text from a job vacancy page, output 4–7 short bullet points: main responsibilities, key requirements/skills, seniority, work model, location, salary if present. Write in clear English for an "About this role" section.',
        },
        {
          role: 'user',
          content:
            `Job title: ${title || 'Unknown'}\nCompany: ${company || 'Unknown'}\nLocation: ${location || 'Unknown'}\nSeniority: ${experience || 'Unknown'}\nURL: ${url}\n\nPage text:\n` +
            snippet,
        },
      ],
    })

    const summary = completion.choices[0]?.message?.content?.trim() || null
    return Response.json({ summary })
  } catch (err) {
    console.error('Job summary error:', err)
    return Response.json({ error: 'Job summary failed', message: err.message }, { status: 500 })
  }
}
