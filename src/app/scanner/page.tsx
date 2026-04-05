import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { QRScanner } from "@/components/scanner/QRScanner"

// Página pública del scanner — protegida por query param ?deviceId=xxx
// Se monta en tablets/PCs en la entrada del gym
export default async function ScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ deviceId?: string; gymId?: string }>
}) {
  const { deviceId, gymId } = await searchParams

  if (!deviceId || !gymId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8">
        <div className="text-center">
          <p className="text-xl font-bold">Scanner no configurado</p>
          <p className="text-slate-400 mt-2 text-sm">
            Accedé con la URL correcta: /scanner?gymId=xxx&amp;deviceId=yyy
          </p>
        </div>
      </main>
    )
  }

  // Verificar que el gym existe
  const gym = await db.gym.findUnique({
    where: { id: gymId },
    select: { id: true, name: true },
  })

  if (!gym) notFound()

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <p className="font-bold">{gym.name}</p>
          <p className="text-xs text-slate-400">Control de acceso QR</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Dispositivo</p>
          <p className="text-xs font-mono text-slate-400">{deviceId}</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <QRScanner gymId={gymId} deviceId={deviceId} />
      </div>
    </main>
  )
}
