import { ChurnRisk } from "@prisma/client"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const riskConfig: Record<ChurnRisk, { label: string; className: string; bgClass: string }> = {
  HIGH: { label: "Alto", className: "text-red-600 font-bold", bgClass: "bg-red-50 border-red-200" },
  MEDIUM: { label: "Medio", className: "text-amber-600 font-semibold", bgClass: "bg-amber-50 border-amber-200" },
  LOW: { label: "Bajo", className: "text-green-600", bgClass: "bg-green-50 border-green-200" },
}

export default async function ChurnPage() {
  const { gymId } = await requireGymScope()

  const scores = await db.churnScore.findMany({
    where: { gymId },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          membershipPlan: { select: { name: true } },
        },
      },
    },
    orderBy: { riskScore: "desc" },
  })

  const highCount = scores.filter((s) => s.riskLevel === ChurnRisk.HIGH).length
  const mediumCount = scores.filter((s) => s.riskLevel === ChurnRisk.MEDIUM).length
  const lowCount = scores.filter((s) => s.riskLevel === ChurnRisk.LOW).length

  // Solo mostrar MEDIUM y HIGH por defecto
  const atRisk = scores.filter((s) => s.riskLevel !== ChurnRisk.LOW)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Riesgo de fuga (Churn)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Socios con mayor probabilidad de abandonar el gimnasio
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-red-600 font-bold">{highCount} alto riesgo</p>
          <p className="text-amber-600">{mediumCount} riesgo medio</p>
          <p className="text-slate-400">{lowCount} bajo riesgo</p>
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-600 font-medium">Sin datos de churn todavía</p>
          <p className="text-slate-400 text-sm mt-1">
            Los scores se calculan automáticamente cada día a las 6am.
          </p>
        </div>
      ) : atRisk.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-medium">Todos los socios están en riesgo bajo</p>
          <p className="text-green-600 text-sm mt-1">
            {lowCount} socios — excelente retención
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {atRisk.map((score) => {
            const cfg = riskConfig[score.riskLevel]
            return (
              <div
                key={score.id}
                className={`border rounded-xl p-5 ${cfg.bgClass}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">
                        {score.member.firstName} {score.member.lastName}
                      </p>
                      <span className={`text-sm ${cfg.className}`}>
                        Riesgo {cfg.label} — {score.riskScore.toFixed(0)}/100
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {score.member.email} · {score.member.membershipPlan.name}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Calculado {format(new Date(score.calculatedAt), "dd MMM HH:mm", { locale: es })}
                  </p>
                </div>

                {/* Factores */}
                <div className="flex gap-4 mt-3 flex-wrap">
                  {score.daysSinceLastVisit > 7 && (
                    <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border">
                      Sin visita hace {score.daysSinceLastVisit}d
                    </span>
                  )}
                  {score.paymentFailCount > 0 && (
                    <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border text-red-600">
                      {score.paymentFailCount} pago(s) fallido(s)
                    </span>
                  )}
                  {score.attendanceDropRate > 20 && (
                    <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border">
                      Asistencia bajó {score.attendanceDropRate.toFixed(0)}%
                    </span>
                  )}
                  {score.classNoShowCount > 0 && (
                    <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border">
                      {score.classNoShowCount} no-shows en clases
                    </span>
                  )}
                </div>

                {/* Acción sugerida */}
                {score.suggestedAction && (
                  <div className="mt-3 text-sm font-medium text-slate-700 bg-white/60 rounded-lg px-3 py-2 border">
                    Acción: {score.suggestedAction}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
