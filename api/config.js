import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — ambil URL dari KV, fallback ke env var
  if (req.method === 'GET') {
    try {
      const gasUrl = (await kv.get('gas_url')) || process.env.GAS_URL || ''
      return res.json({ gasUrl, configured: Boolean(gasUrl) })
    } catch {
      const gasUrl = process.env.GAS_URL || ''
      return res.json({ gasUrl, configured: Boolean(gasUrl) })
    }
  }

  // POST — simpan URL ke KV (butuh adminKey)
  if (req.method === 'POST') {
    const { gasUrl, adminKey } = req.body || {}

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Admin key tidak valid.' })
    }
    if (!gasUrl) return res.status(400).json({ error: 'URL tidak boleh kosong.' })

    try {
      await kv.set('gas_url', gasUrl)
      return res.json({ success: true })
    } catch {
      return res.status(500).json({ error: 'Vercel KV belum dikonfigurasi. Buka Vercel dashboard → Storage → Create KV → Connect to project.' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
