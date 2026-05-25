import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

export function useScanner(onDetected) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const videoRef = useRef(null)
  const readerRef = useRef(null)

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader()
    readerRef.current.listVideoInputDevices().then((devices) => {
      setCameras(devices)
      // Default ke kamera belakang jika ada
      const back = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('belakang') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'))
      setSelectedCamera(back?.deviceId || devices[0]?.deviceId || null)
    }).catch(() => setError('Tidak bisa mengakses kamera'))

    return () => {
      readerRef.current?.reset()
    }
  }, [])

  const startScan = async () => {
    if (!videoRef.current || !selectedCamera) return
    setError(null)
    setScanning(true)
    try {
      await readerRef.current.decodeFromVideoDevice(selectedCamera, videoRef.current, (result, err) => {
        if (result) {
          onDetected(result.getText())
          stopScan()
        }
      })
    } catch (e) {
      setError('Gagal memulai scanner: ' + e.message)
      setScanning(false)
    }
  }

  const stopScan = () => {
    readerRef.current?.reset()
    setScanning(false)
  }

  return { videoRef, scanning, error, cameras, selectedCamera, setSelectedCamera, startScan, stopScan }
}
