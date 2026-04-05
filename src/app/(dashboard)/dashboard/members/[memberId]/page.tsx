import { MemberStatus, PaymentStatus } from "@prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const statusLabel: Record<MemberStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  FROZEN: "Congelado",
  CANCELLED: "Cancelado",
}

const statusClass: Record<MemberStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  FROZEN: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-slate-100 text-slate-500",
}

const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  SUCCEEDED: "Exitoso",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { gymId } = await requireGymScope()
  const { memberId } = await params

  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    include: {
      membershipPlan: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      accessLogs: {
        orderBy: { timestamp: "desc" },
        take: 10,
      },
      churnScore: true,
      routineAssignments: {
        where: { isActive: true },
        include: { routine: { select: { name: true, day: true } } },
      },
    },
  })

  if (!member) notFound()

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/members" className="text-slate-400 hover:text-slate-600 text-sm mb-6 block">
        ← Volver a socios
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {member.firstName} {member.lastName}
            </h1>
            <p className="text-slate-400 mt-1">{member.email}</p>
            {member.phone && <p className="text-slate-400 text-sm">{member.phone}</p>}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass[member.status]}`}>
            {statusLabel[member.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-xs text-slate-400">Plan</p>
            <p className="font-medium">{member.membershipPlan.name}</p>
            <p className="text-sm text-slate-500">
              {(member.membershipPlan.priceAmount / 100).toLocaleString("es-AR")} {member.membershipPlan.currency}/mes
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Próximo pago</p>
            <p className="font-medium">
              {format(new Date(member.nextPaymentDate), "dd MMM yyyy", { locale: es })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Miembro desde</p>
            <p className="font-medium">
              {format(new Date(member.startDate), "dd MMM yyyy", { locale: es })}
            </p>
          </div>
        </div>

        {/* Churn risk */}
        {member.churnScore && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Riesgo de fuga:</span>
              <span
                className={`text-xs font-bold ${
                  member.churnScore.riskLevel === "HIGH"
                    ? "text-red-600"
                    : member.churnScore.riskLevel === "MEDIUM"
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              >
                {member.churnScore.riskLevel} ({member.churnScore.riskScore.toFixed(0)}/100)
              </span>
              {member.churnScore.suggestedAction && (
                <span className="text-xs text-slate-500">· {member.churnScore.suggestedAction}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pagos recientes */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Últimos pagos</h2>
          </div>
          <div className="divide-y">
            {member.payments.length === 0 ? (
              <p className="text-center py-6 text-sm text-slate-400">Sin pagos registrados</p>
            ) : (
              member.payments.map((p) => (
                <div key={p.id} className="px-4 py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{(p.amount / 100).toLocaleString("es-AR")} {p.currency}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(p.createdAt), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      p.status === "SUCCEEDED"
                        ? "text-green-600"
                        : p.status === "FAILED"
                        ? "text-red-500"
                        : "text-slate-500"
                    }`}
                  >
                    {paymentStatusLabel[p.status]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Accesos recientes */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Últimos accesos</h2>
          </div>
          <div className="divide-y">
            {member.accessLogs.length === 0 ? (
              <p className="text-center py-6 text-sm text-slate-400">Sin accesos registrados</p>
            ) : (
              member.accessLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{log.method}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(log.timestamp), "dd MMM yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${log.success ? "text-green-600" : "text-red-500"}`}>
                    {log.success ? "OK" : log.failReason ?? "Denegado"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
