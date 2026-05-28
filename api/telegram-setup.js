export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN belum diset di Vercel env.' })

  const webhookUrl = `https://${req.headers.host}/api/telegram`
  const resp   = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ url: webhookUrl }),
  })
  const result = await resp.json()
  return res.json({ webhookUrl, result })
}
