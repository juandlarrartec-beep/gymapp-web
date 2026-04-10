"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createMemberAction, updateMemberAction } from "@/lib/actions/members"

interface Plan {
  id: string
  name: string
  priceAmount: number
  currency: string
  durationDays: number
}

interface MemberData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  birthDate: Date | string | null
  membershipPlanId: string
  startDate: Date | string
}

interface MemberFormProps {
  plans: Plan[]
  gymId: string
  member?: MemberData
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().split("T")[0] ?? ""
}

export function MemberForm({ plans, member }: MemberFormProps) {
  const isEditing = Boolean(member)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(() => {
      void (async () => {
        if (isEditing && member) {
          const result = await updateMemberAction(member.id, formData)
          if (result.error) {
            setError(result.error)
          } else {
            toast.success("Socio actualizado correctamente")
            router.push(`/dashboard/members/${member.id}`)
          }
        } else {
          // createMemberAction hace redirect internamente si todo OK
          const result = await createMemberAction(formData)
          if (result?.error) {
            setError(result.error)
          }
          // Si no hay error, el redirect ya fue disparado
        }
      })()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            name="firstName"
            type="text"
            required
            defaultValue={member?.firstName ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Apellido <span className="text-red-500">*</span>
          </label>
          <input
            name="lastName"
            type="text"
            required
            defaultValue={member?.lastName ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          required
          defaultValue={member?.email ?? ""}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
        <input
          name="phone"
          type="tel"
          defaultValue={member?.phone ?? ""}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
        <input
          name="birthDate"
          type="date"
          defaultValue={toDateInputValue(member?.birthDate)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Plan de membresía <span className="text-red-500">*</span>
        </label>
        <select
          name="membershipPlanId"
          required
          defaultValue={member?.membershipPlanId ?? ""}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Seleccioná un plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — {(plan.priceAmount / 100).toLocaleString("es-AR")} {plan.currency} /{" "}
              {plan.durationDays}d
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio</label>
        <input
          name="startDate"
          type="date"
          defaultValue={toDateInputValue(member?.startDate) || new Date().toISOString().split("T")[0]}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-colors"
        >
          {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear socio"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
