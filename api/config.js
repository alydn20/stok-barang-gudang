import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — ambil URL & settings dari KV, fallback ke env var
  if (req.method === 'GET') {
    try {
      const [gasUrl, expDays] = await Promise.all([
        kv.get('gas_url'),
        kv.get('exp_threshold_days'),
      ])
      return res.json({
        gasUrl:   gasUrl  || process.env.GAS_URL || '',
        expDays:  expDays != null ? Number(expDays) : 30,
        configured: Boolean(gasUrl || process.env.GAS_URL),
      })
    } catch {
      return res.json({
        gasUrl:     process.env.GAS_URL || '',
        expDays:    30,
        configured: Boolean(process.env.GAS_URL),
      })
    }
  }

  // POST — simpan settings ke KV
  if (req.method === 'POST') {
    const { gasUrl, adminKey, expDays } = req.body || {}

    // Simpan batas exp (tidak butuh adminKey)
    if (expDays !== undefined) {
      const n = Math.max(1, Math.min(365, Number(expDays)))
      try {
        await kv.set('exp_threshold_days', n)
        return res.json({ success: true })
      } catch {
        return res.status(500).json({ error: 'Vercel KV belum dikonfigurasi.' })
      }
    }

    // Simpan GAS URL (butuh adminKey)
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
