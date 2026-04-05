"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface ScanResult {
  access: boolean
  memberName?: string
  reason?: string
}

interface QRScannerProps {
  gymId: string
  deviceId: string
}

// Parsear el token QR que viene embebido en el código
// Formato esperado del QR: JSON {"gymId":"...","memberId":"...","token":"..."}
function parseQRData(raw: string): { gymId: string; memberId: string; token: string } | null {
  try {
    const parsed = JSON.parse(raw) as { gymId?: string; memberId?: string; token?: string }
    if (parsed.gymId && parsed.memberId && parsed.token) {
      return { gymId: parsed.gymId, memberId: parsed.memberId, token: parsed.token }
    }
  } catch {
    // No es JSON — ignorar
  }
  return null
}

export function QRScanner({ gymId, deviceId }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastScanTime = useRef<number>(0)
  const readerRef = useRef<{ decodeFromVideoDevice: (...args: unknown[]) => Promise<unknown>; reset: () => void } | null>(null)

  const processResult = useCallback(
    async (text: string) => {
      // Debounce: no escanear el mismo QR dos veces en 3 segundos
      const now = Date.now()
      if (now - lastScanTime.current < 3000) return
      lastScanTime.current = now

      const qrData = parseQRData(text)
      if (!qrData) {
        setLastResult({ access: false, reason: "QR inválido — formato incorrecto" })
        return
      }

      // Validar que el QR corresponde a este gym
      if (qrData.gymId !== gymId) {
        setLastResult({ access: false, reason: "QR de otro gimnasio" })
        return
      }

      try {
        const res = await fetch("/api/access/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: qrData.token,
            gymId: qrData.gymId,
            memberId: qrData.memberId,
            deviceId,
          }),
        })
        const data = (await res.json()) as ScanResult
        setLastResult(data)
      } catch {
        setLastResult({ access: false, reason: "Error de conexión" })
      }
    },
    [gymId, deviceId]
  )

  useEffect(() => {
    let stopped = false

    async function startScanner() {
      try {
        // Importar @zxing/library dinámicamente para evitar SSR issues
        const { BrowserMultiFormatReader } = await import("@zxing/library")
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader as unknown as typeof readerRef.current
        setScanning(true)

        await reader.decodeFromVideoDevice(null, videoRef.current!, (result) => {
          if (result && !stopped) {
            void processResult(result.getText())
          }
        })
      } catch (e) {
        if (!stopped) {
          setError(e instanceof Error ? e.message : "No se pudo acceder a la cámara")
        }
      }
    }

    void startScanner()

    return () => {
      stopped = true
      if (readerRef.current) {
        readerRef.current.reset()
      }
    }
  }, [processResult])

  const resultColor = lastResult
    ? lastResult.access
      ? "bg-green-500"
      : "bg-red-500"
    : "bg-slate-800"

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {error ? (
        <div className="bg-red-100 border border-red-300 rounded-xl p-6 text-center max-w-sm">
          <p className="text-red-700 font-medium">Error al iniciar la cámara</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <p className="text-slate-400 text-xs mt-3">
            Asegurate de dar permisos de cámara al navegador
          </p>
        </div>
      ) : (
        <>
          <div className="relative w-80 h-80 rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" />
            {/* Marco de escaneo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/70 rounded-xl" />
            </div>
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-sm">Iniciando cámara...</p>
              </div>
            )}
          </div>

          {/* Resultado del último escaneo */}
          {lastResult && (
            <div
              className={`w-80 rounded-xl p-5 text-white text-center transition-colors ${resultColor}`}
            >
              <p className="text-4xl mb-2">{lastResult.access ? "✓" : "✗"}</p>
              <p className="font-bold text-lg">
                {lastResult.access ? "Acceso permitido" : "Acceso denegado"}
              </p>
              {lastResult.memberName && (
                <p className="text-sm opacity-90 mt-1">{lastResult.memberName}</p>
              )}
              {!lastResult.access && lastResult.reason && (
                <p className="text-xs opacity-75 mt-1">{lastResult.reason}</p>
              )}
            </div>
          )}

          {scanning && !lastResult && (
            <p className="text-slate-400 text-sm animate-pulse">Esperando QR...</p>
          )}
        </>
      )}
    </div>
  )
}
