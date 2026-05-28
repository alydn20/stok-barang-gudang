const WELCOME =
  '<b>Stok Gudang — Sistem Notifikasi</b>\n\n' +
  'Selamat datang! Anda akan menerima laporan harian otomatis.\n\n' +
  'Laporan dikirim setiap hari pukul 07.00 WIB dan mencakup:\n' +
  '  - Ringkasan total stok\n' +
  '  - Pergerakan barang hari ini\n' +
  '  - Daftar item dengan stok sedikit\n' +
  '  - Daftar item yang mendekati kadaluarsa\n\n' +
  '<i>Stok Gudang  |  by Aliyudin</i>'

export default async function handler(req, res) {
  // Telegram membutuhkan 200 OK, selalu balas dulu
  res.status(200).json({ ok: true })

  if (req.method !== 'POST') return

  const token  = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  const update = req.body
  const text   = update?.message?.text || ''
  if (!text.startsWith('/start')) return

  const chatId = update.message.chat.id
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text: WELCOME, parse_mode: 'HTML' }),
  }).catch(() => {})
}
