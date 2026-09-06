import type { VercelRequest, VercelResponse } from '@vercel/node'

const gatewayUrl = 'https://ai-gateway.vercel.sh/v1/chat/completions'

async function authenticate(req: VercelRequest) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!token || !url || !key) return null
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })
  if (!r.ok) return null
  return await r.json()
}

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  const user = await authenticate(req)
  if (!user?.id) return send(res, 401, { error: 'Sign in required' })
  const key = process.env.AI_GATEWAY_API_KEY
  if (!key) return send(res, 503, { error: 'AI is not configured. Add AI_GATEWAY_API_KEY in Vercel.' })

  try {
    const { mode = 'concierge', messages = [], context = {} } = req.body ?? {}
    if (mode === 'staff') {
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
      const sbKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
      const profile = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, { headers: { apikey: sbKey!, Authorization: req.headers.authorization! } }).then(r => r.json())
      const role = profile?.[0]?.role
      if (!['staff','manager','admin'].includes(role)) return send(res, 403, { error: 'Staff access required' })
    }
    if (!Array.isArray(messages) || messages.length > 20) return send(res, 400, { error: 'Invalid message history' })

    const system = mode === 'staff'
      ? `You are Coffee House Staff Copilot. Give concise, operationally useful answers from the supplied dashboard context. Never invent metrics. Identify anomalies, bottlenecks, inventory/order risks and concrete next actions. If data is missing, say so. Context: ${JSON.stringify(context).slice(0, 12000)}`
      : `You are Coffee House AI Concierge, a premium coffee sommelier and ordering assistant. Recommend only from the supplied catalog. Consider craving, budget, temperature, sweetness, milk preference, caffeine and mood. Explain why. Never claim unavailable products are available. Context: ${JSON.stringify(context).slice(0, 12000)}`

    const upstream = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
        temperature: 0.35,
        max_tokens: 700,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    })
    const data = await upstream.json()
    if (!upstream.ok) return send(res, upstream.status, { error: data?.error?.message || 'AI provider error' })
    return send(res, 200, { reply: data?.choices?.[0]?.message?.content || 'I could not find a good answer.' })
  } catch (error) {
    console.error('AI route error', error)
    return send(res, 500, { error: 'AI request failed' })
  }
}
