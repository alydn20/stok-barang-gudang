import { useState, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

export function useScanner(onDetected) {
  const [scanning, setScanning] = useState(false)
  const [error,    setError]    = useState(null)
  const videoRef  = useRef(null)
  const readerRef = useRef(null)

  const startScan = async () => {
    if (!videoRef.current) return
    setError(null)
    setScanning(true)

    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader()
    }

    try {
      // Gunakan facingMode environment (kamera belakang) langsung
      // Tidak perlu list devices dulu — lebih reliable di mobile
      await readerRef.current.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current,
        (result, err) => {
          if (result) {
            onDetected(result.getText())
            stopScan()
          }
        }
      )
    } catch (e) {
      let msg = 'Gagal mengakses kamera.'
      if (e.name === 'NotAllowedError')  msg = 'Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser.'
      if (e.name === 'NotFoundError')    msg = 'Kamera tidak ditemukan pada perangkat ini.'
      if (e.name === 'NotReadableError') msg = 'Kamera sedang digunakan aplikasi lain.'
      setError(msg)
      setScanning(false)
    }
  }

  const stopScan = () => {
    readerRef.current?.reset()
    setScanning(false)
  }

  return { videoRef, scanning, error, startScan, stopScan }
}
