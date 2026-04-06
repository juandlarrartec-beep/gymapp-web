"use client"

import { useRef, useTransition } from "react"
import { toast } from "sonner"
import { X, Loader2 } from "lucide-react"
import clsx from "clsx"
import { createPlanAction, updatePlanAction } from "@/app/(dashboard)/dashboard/plans/actions"

const WEEK_DAYS = [
  { value: "MONDAY", label: "Lun" },
  { value: "TUESDAY", label: "Mar" },
  { value: "WEDNESDAY", label: "Mié" },
  { value: "THURSDAY", label: "Jue" },
  { value: "FRIDAY", label: "Vie" },
  { value: "SATURDAY", label: "Sáb" },
  { value: "SUNDAY", label: "Dom" },
]

const CURRENCIES = ["ARS", "COP", "MXN"]

interface PlanFormProps {
  plan?: {
    id: string
    name: string
    description: string | null
    priceAmount: number
    currency: string
    durationDays: number
    accessDays: string[]
    accessHourStart: number | null
    accessHourEnd: number | null
  }
  onClose: () => void
  onSuccess: () => void
}

export function PlanForm({ plan, onClose, onSuccess }: PlanFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const isEditing = !!plan

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEditing
        ? await updatePlanAction(plan.id, formData)
        : await createPlanAction(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? "Plan actualizado" : "Plan creado")
        onSuccess()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Editar plan" : "Nuevo plan"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del plan <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              defaultValue={plan?.name ?? ""}
              placeholder="Ej: Mensual Básico"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <input
              name="description"
              type="text"
              defaultValue={plan?.description ?? ""}
              placeholder="Opcional"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Precio + Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Precio <span className="text-red-500">*</span>
              </label>
              <input
                name="priceAmount"
                type="number"
                min="1"
                step="0.01"
                defaultValue={plan ? plan.priceAmount / 100 : ""}
                placeholder="18000"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Moneda
              </label>
              <select
                name="currency"
                defaultValue={plan?.currency ?? "ARS"}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duración (días) <span className="text-red-500">*</span>
            </label>
            <input
              name="durationDays"
              type="number"
              min="1"
              step="1"
              defaultValue={plan?.durationDays ?? 30}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Días de acceso */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Días de acceso{" "}
              <span className="text-xs text-slate-400 font-normal">(vacío = todos los días)</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.map((day) => (
                <label key={day.value} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="accessDays"
                    value={day.value}
                    defaultChecked={plan?.accessDays.includes(day.value)}
                    className="sr-only peer"
                  />
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition-colors select-none">
                    {day.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Horario de acceso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hora inicio{" "}
                <span className="text-xs text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                name="accessHourStart"
                type="number"
                min="0"
                max="23"
                step="1"
                defaultValue={plan?.accessHourStart ?? ""}
                placeholder="6"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hora fin{" "}
                <span className="text-xs text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                name="accessHourEnd"
                type="number"
                min="0"
                max="23"
                step="1"
                defaultValue={plan?.accessHourEnd ?? ""}
                placeholder="22"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors",
                isPending ? "opacity-70 cursor-not-allowed" : "hover:bg-indigo-500"
              )}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
