import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import AccessLogRealtime from "./AccessLogRealtime"

export default async function AccessPage() {
  const { gymId } = await requireGymScope()

  // Accesos del día actual
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todayLogs = await db.accessLog.findMany({
    where: { gymId, timestamp: { gte: startOfDay } },
    include: {
      member: { select: { firstName: true, lastName: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  })

  const stats = {
    total: todayLogs.length,
    successful: todayLogs.filter((l: { success: boolean }) => l.success).length,
    failed: todayLogs.filter((l: { success: boolean }) => !l.success).length,
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Control de acceso</h1>
          <p className="text-sm text-slate-400 mt-1">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
            <p className="text-xs text-slate-400">Ingresos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
            <p className="text-xs text-slate-400">Denegados</p>
          </div>
        </div>
      </div>

      {/* Tabla con polling en tiempo real */}
      <AccessLogRealtime gymId={gymId} initialLogs={todayLogs} />
    </div>
  )
}
