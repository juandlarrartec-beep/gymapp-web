import { MemberStatus, PaymentStatus, PaymentProvider, AccessMethod, RoutineDay } from "@prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { MemberProfileTabs } from "@/components/members/MemberProfileTabs"
import clsx from "clsx"

const STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  FROZEN: "Congelado",
  CANCELLED: "Cancelado",
}

const STATUS_CLASS: Record<MemberStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  FROZEN: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-slate-100 text-slate-500",
}

const RISK_CLASS: Record<string, string> = {
  HIGH: "text-red-600",
  MEDIUM: "text-amber-600",
  LOW: "text-green-600",
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

function ChurnBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={clsx(
          "h-full rounded-full transition-all",
          pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-amber-400" : "bg-green-500"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
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
        take: 20,
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
    <div className="p-4 md:p-8 max-w-5xl">
      <Link href="/dashboard/members" className="text-slate-400 hover:text-slate-600 text-sm mb-6 block">
        ← Socios
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Panel izquierdo */}
        <div className="space-y-4">
          {/* Tarjeta principal */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            {/* Avatar + nombre */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold mb-3">
                {getInitials(member.firstName, member.lastName)}
              </div>
              <h1 className="text-lg font-bold leading-tight">
                {member.firstName} {member.lastName}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">{member.email}</p>
              {member.phone && (
                <p className="text-sm text-slate-400">{member.phone}</p>
              )}
              <span
                className={clsx(
                  "mt-3 px-3 py-1 rounded-full text-xs font-medium",
                  STATUS_CLASS[member.status]
                )}
              >
                {STATUS_LABELS[member.status]}
              </span>
            </div>

            {/* Datos de membresía */}
            <div className="space-y-3 pt-4 border-t text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan</span>
                <span className="font-medium text-right">{member.membershipPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Miembro desde</span>
                <span className="font-medium">
                  {format(new Date(member.startDate), "dd MMM yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Próximo pago</span>
                <span className="font-medium">
                  {format(new Date(member.nextPaymentDate), "dd MMM yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Precio</span>
                <span className="font-medium">
                  {(member.membershipPlan.priceAmount / 100).toLocaleString("es-AR")}{" "}
                  {member.membershipPlan.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Score de churn */}
          {member.churnScore && (
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <p className="text-xs text-slate-500 font-medium mb-2">Score Churn IA</p>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={clsx(
                    "text-sm font-bold",
                    RISK_CLASS[member.churnScore.riskLevel] ?? "text-slate-600"
                  )}
                >
                  Riesgo {member.churnScore.riskLevel}
                </span>
                <span className="text-sm font-bold text-slate-600">
                  {member.churnScore.riskScore.toFixed(0)}/100
                </span>
              </div>
              <ChurnBar score={member.churnScore.riskScore} />
              {member.churnScore.suggestedAction && (
                <p className="text-xs text-slate-500 mt-2">
                  Acción: {member.churnScore.suggestedAction}
                </p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2">
            <Link
              href={`/dashboard/members/${member.id}/edit`}
              className="flex-1 text-center py-2 border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Editar
            </Link>
            <Link
              href={`/dashboard/members/${member.id}/status`}
              className="flex-1 text-center py-2 border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cambiar estado
            </Link>
          </div>
        </div>

        {/* Panel derecho — tabs */}
        <MemberProfileTabs
          payments={member.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            currency: p.currency,
            status: p.status as PaymentStatus,
            provider: p.provider as PaymentProvider,
            createdAt: p.createdAt,
          }))}
          accessLogs={member.accessLogs.map((log) => ({
            id: log.id,
            method: log.method as AccessMethod,
            success: log.success,
            failReason: log.failReason,
            timestamp: log.timestamp,
          }))}
          routineAssignments={member.routineAssignments.map((ra) => ({
            id: ra.id,
            routine: {
              name: ra.routine.name,
              day: (ra.routine.day ?? null) as RoutineDay | null,
            },
          }))}
        />
      </div>
    </div>
  )
}
