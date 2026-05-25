export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { _url, ...params } = req.query
    if (!_url) return res.status(400).json({ error: 'GAS URL diperlukan.' })
    try {
      const response = await fetch(`${_url}?${new URLSearchParams(params)}`)
      const data = await response.json()
      return res.json(data)
    } catch (e) {
      return res.status(502).json({ error: 'Gagal menghubungi GAS: ' + e.message })
    }
  }

  if (req.method === 'POST') {
    const { _url, ...body } = req.body || {}
    if (!_url) return res.status(400).json({ error: 'GAS URL diperlukan.' })
    try {
      const response = await fetch(_url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      return res.json(data)
    } catch (e) {
      return res.status(502).json({ error: 'Gagal menghubungi GAS: ' + e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
