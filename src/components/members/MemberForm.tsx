"use client"

import { useState, useTransition } from "react"
import { createMember } from "@/lib/actions/members"

interface Plan {
  id: string
  name: string
  priceAmount: number
  currency: string
  durationDays: number
}

interface MemberFormProps {
  plans: Plan[]
  gymId: string
}

export function MemberForm({ plans }: MemberFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      void (async () => {
        const result = await createMember(formData)
        if (result.error) setError(result.error)
        else setSuccess(true)
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
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          Socio creado exitosamente
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
          <input
            name="firstName"
            type="text"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
          <input
            name="lastName"
            type="text"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input name="email" type="email" required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
        <input name="phone" type="tel"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
        <input name="birthDate" type="date"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Plan de membresía</label>
        <select name="membershipPlanId" required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Seleccioná un plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — {(plan.priceAmount / 100).toLocaleString("es-AR")} {plan.currency} / {plan.durationDays}d
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio</label>
        <input name="startDate" type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button type="submit" disabled={isPending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-colors"
      >
        {isPending ? "Guardando..." : "Crear socio"}
      </button>
    </form>
  )
}
