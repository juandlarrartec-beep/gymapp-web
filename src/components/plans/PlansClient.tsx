"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Plus, Users } from "lucide-react"
import clsx from "clsx"
import { PlanForm } from "@/components/plans/PlanForm"
import {
  togglePlanStatusAction,
  deletePlanAction,
} from "@/app/(dashboard)/dashboard/plans/actions"

interface Plan {
  id: string
  name: string
  description: string | null
  priceAmount: number
  currency: string
  durationDays: number
  isActive: boolean
  accessDays: string[]
  accessHourStart: number | null
  accessHourEnd: number | null
  _count: { members: number }
}

interface PlansClientProps {
  plans: Plan[]
}

export function PlansClient({ plans }: PlansClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingPlan(null)
    setShowForm(true)
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingPlan(null)
  }

  function handleSuccess() {
    closeForm()
    // revalidatePath ya fue llamado en la Server Action — la página se actualiza sola
  }

  function handleToggleStatus(plan: Plan) {
    startTransition(async () => {
      const result = await togglePlanStatusAction(plan.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(plan.isActive ? "Plan desactivado" : "Plan activado")
      }
    })
  }

  function handleDelete(plan: Plan) {
    if (plan._count.members > 0) {
      toast.error(`No se puede eliminar: ${plan._count.members} socio(s) activos en este plan`)
      return
    }
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return

    startTransition(async () => {
      const result = await deletePlanAction(plan.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Plan eliminado")
      }
    })
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planes de membresía</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo plan
        </button>
      </div>

      {/* Estado vacío */}
      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-indigo-500" />
          </div>
          <p className="text-lg font-medium text-slate-700">Sin planes configurados</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">
            Creá tu primer plan para empezar a registrar socios
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primer plan
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isPending={isPending}
              onEdit={() => openEdit(plan)}
              onToggle={() => handleToggleStatus(plan)}
              onDelete={() => handleDelete(plan)}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {showForm && (
        <PlanForm
          plan={editingPlan ?? undefined}
          onClose={closeForm}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

function PlanCard({
  plan,
  isPending,
  onEdit,
  onToggle,
  onDelete,
}: {
  plan: Plan
  isPending: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const priceFormatted = (plan.priceAmount / 100).toLocaleString("es-AR")

  function getDurationLabel(days: number): string {
    if (days === 30) return "30 días (mensual)"
    if (days === 60) return "60 días (bimestral)"
    if (days === 90) return "90 días (trimestral)"
    if (days === 180) return "180 días (semestral)"
    if (days === 365) return "365 días (anual)"
    return `${days} días`
  }

  return (
    <div
      className={clsx(
        "bg-white border rounded-xl p-5 shadow-sm flex flex-col gap-4 transition-opacity",
        !plan.isActive && "opacity-60"
      )}
    >
      {/* Top: nombre + badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 leading-tight">{plan.name}</h3>
        <span
          className={clsx(
            "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
            plan.isActive
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {plan.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Precio */}
      <div>
        <span className="text-2xl font-bold text-slate-900">
          ${priceFormatted}
        </span>
        <span className="text-slate-500 text-sm ml-1">{plan.currency}</span>
      </div>

      {/* Meta */}
      <div className="space-y-1 text-sm text-slate-500">
        <p>{getDurationLabel(plan.durationDays)}</p>
        {plan._count.members > 0 && (
          <p className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {plan._count.members} socio{plan._count.members !== 1 ? "s" : ""}
          </p>
        )}
        {plan.accessDays.length > 0 && (
          <p className="text-xs">
            Acceso:{" "}
            {plan.accessDays
              .map((d) => {
                const map: Record<string, string> = {
                  MONDAY: "Lun",
                  TUESDAY: "Mar",
                  WEDNESDAY: "Mié",
                  THURSDAY: "Jue",
                  FRIDAY: "Vie",
                  SATURDAY: "Sáb",
                  SUNDAY: "Dom",
                }
                return map[d] ?? d
              })
              .join(", ")}
          </p>
        )}
        {plan.accessHourStart != null && plan.accessHourEnd != null && (
          <p className="text-xs">
            Horario: {plan.accessHourStart}:00 — {plan.accessHourEnd}:00
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <button
          onClick={onEdit}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>

        <button
          onClick={onToggle}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-amber-600 transition-colors disabled:opacity-50 ml-auto"
        >
          {plan.isActive ? (
            <>
              <ToggleRight className="w-3.5 h-3.5" />
              Desactivar
            </>
          ) : (
            <>
              <ToggleLeft className="w-3.5 h-3.5" />
              Activar
            </>
          )}
        </button>

        <button
          onClick={onDelete}
          disabled={isPending || plan._count.members > 0}
          title={plan._count.members > 0 ? "Tiene socios activos" : "Eliminar plan"}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
