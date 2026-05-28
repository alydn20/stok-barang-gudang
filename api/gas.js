const ts = () => new Date().toISOString()

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { _url, action, ...params } = req.query
    if (!_url) return res.status(400).json({ error: 'GAS URL diperlukan.' })
    console.log(`[${ts()}] GET  action=${action || '-'}`)
    try {
      const t0       = Date.now()
      const response = await fetch(`${_url}?${new URLSearchParams({ action, ...params })}`)
      const data     = await response.json()
      console.log(`[${ts()}] GET  action=${action} → ${response.status} (${Date.now()-t0}ms)`)
      return res.json(data)
    } catch (e) {
      console.error(`[${ts()}] GET  action=${action} → ERROR: ${e.message}`)
      return res.status(502).json({ error: 'Gagal menghubungi GAS: ' + e.message })
    }
  }

  if (req.method === 'POST') {
    const { _url, action, ...body } = req.body || {}
    if (!_url) return res.status(400).json({ error: 'GAS URL diperlukan.' })
    console.log(`[${ts()}] POST action=${action || '-'}`)
    try {
      const t0       = Date.now()
      const response = await fetch(_url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...body }),
      })
      const data = await response.json()
      const ok   = data?.success !== false && !data?.error
      console.log(`[${ts()}] POST action=${action} → ${response.status} success=${ok} (${Date.now()-t0}ms)`)
      if (!ok) console.warn(`[${ts()}] POST action=${action} data:`, JSON.stringify(data))
      return res.json(data)
    } catch (e) {
      console.error(`[${ts()}] POST action=${action} → ERROR: ${e.message}`)
      return res.status(502).json({ error: 'Gagal menghubungi GAS: ' + e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
