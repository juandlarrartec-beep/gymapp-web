"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import clsx from "clsx"
import { ChurnRisk } from "@prisma/client"
import { MessageCircle, User, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { dismissChurnAlert } from "@/app/(dashboard)/dashboard/churn/actions"

interface ChurnMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: string
}

interface ChurnScoreItem {
  id: string
  memberId: string
  riskLevel: ChurnRisk
  riskScore: number
  daysSinceLastVisit: number
  paymentFailCount: number
  classNoShowCount: number
  attendanceDropRate: number
  suggestedAction: string | null
  member: ChurnMember
}

interface Props {
  scores: ChurnScoreItem[]
}

type FilterLevel = ChurnRisk | "ALL"

const FILTER_LABELS: Record<FilterLevel, string> = {
  HIGH: "Alto",
  MEDIUM: "Medio",
  LOW: "Bajo",
  ALL: "Todos",
}

const RISK_BAR_COLOR: Record<ChurnRisk, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-green-500",
}

const RISK_TEXT: Record<ChurnRisk, string> = {
  HIGH: "text-red-600",
  MEDIUM: "text-amber-600",
  LOW: "text-green-600",
}

const RISK_BG: Record<ChurnRisk, string> = {
  HIGH: "bg-red-50 border-red-200",
  MEDIUM: "bg-amber-50 border-amber-200",
  LOW: "bg-green-50 border-green-200",
}

function ScoreBar({ score, level }: { score: number; level: ChurnRisk }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all", RISK_BAR_COLOR[level])}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={clsx("text-sm font-semibold tabular-nums", RISK_TEXT[level])}>
        {Math.round(score)}/100
      </span>
    </div>
  )
}

function ChurnCard({ item }: { item: ChurnScoreItem }) {
  const [dismissed, setDismissed] = useState(false)
  const [pending, startTransition] = useTransition()

  const initials = `${item.member.firstName[0] ?? ""}${item.member.lastName[0] ?? ""}`.toUpperCase()
  const whatsappUrl = item.member.phone
    ? `https://wa.me/${item.member.phone.replace(/\D/g, "")}`
    : null

  function handleDismiss() {
    startTransition(async () => {
      const res = await dismissChurnAlert(item.memberId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Alerta descartada")
        setDismissed(true)
      }
    })
  }

  if (dismissed) return null

  return (
    <div className={clsx("border rounded-xl p-5 transition-all", RISK_BG[item.riskLevel])}>
      <div className="flex items-start justify-between gap-4">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">
              {item.member.firstName} {item.member.lastName}
            </p>
            <p className="text-xs text-slate-500">{item.member.email}</p>
          </div>
        </div>

        {/* Score */}
        <ScoreBar score={item.riskScore} level={item.riskLevel} />
      </div>

      {/* Factores */}
      <div className="flex flex-wrap gap-2 mt-3">
        {item.daysSinceLastVisit > 7 && (
          <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border border-white/80">
            Sin acceso: {item.daysSinceLastVisit}d
          </span>
        )}
        {item.paymentFailCount > 0 && (
          <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border border-white/80 text-red-600 font-medium">
            Pagos fallidos: {item.paymentFailCount}
          </span>
        )}
        {item.classNoShowCount > 0 && (
          <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border border-white/80">
            No-shows: {item.classNoShowCount}
          </span>
        )}
        {item.attendanceDropRate > 20 && (
          <span className="text-xs px-2 py-1 bg-white/70 rounded-lg border border-white/80">
            Asistencia -{Math.round(item.attendanceDropRate)}%
          </span>
        )}
      </div>

      {/* Acción sugerida */}
      {item.suggestedAction && (
        <div className="mt-3 text-sm text-slate-700 bg-white/60 rounded-lg px-3 py-2 border border-white/80">
          <span className="font-medium">Acción: </span>
          {item.suggestedAction}
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center gap-2 mt-4">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        )}
        <Link
          href={`/dashboard/members/${item.memberId}`}
          className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium border transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          Ver perfil
        </Link>
        <button
          onClick={handleDismiss}
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {pending ? "..." : "Marcar resuelto"}
        </button>
      </div>
    </div>
  )
}

export function ChurnList({ scores }: Props) {
  const [filter, setFilter] = useState<FilterLevel>("ALL")

  const filtered =
    filter === "ALL" ? scores : scores.filter((s) => s.riskLevel === filter)

  const highCount = scores.filter((s) => s.riskLevel === "HIGH").length
  const mediumCount = scores.filter((s) => s.riskLevel === "MEDIUM").length
  const lowCount = scores.filter((s) => s.riskLevel === "LOW").length

  return (
    <div className="space-y-4">
      {/* Contadores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{highCount}</p>
          <p className="text-xs text-red-500 mt-0.5">Riesgo ALTO</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{mediumCount}</p>
          <p className="text-xs text-amber-500 mt-0.5">Riesgo MEDIO</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{lowCount}</p>
          <p className="text-xs text-green-500 mt-0.5">Riesgo BAJO</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["HIGH", "MEDIUM", "LOW", "ALL"] as FilterLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={clsx(
              "text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
              filter === level
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            {FILTER_LABELS[level]}
            {level !== "ALL" && (
              <span className="ml-1 opacity-60">
                ({level === "HIGH" ? highCount : level === "MEDIUM" ? mediumCount : lowCount})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500 font-medium">Sin socios en este nivel de riesgo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((score) => (
            <ChurnCard key={score.id} item={score} />
          ))}
        </div>
      )}
    </div>
  )
}
