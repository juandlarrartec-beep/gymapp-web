"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createClassAction } from "@/app/(dashboard)/dashboard/classes/actions"
import type { CreateClassState } from "@/app/(dashboard)/dashboard/classes/actions"

interface Trainer {
  id: string
  firstName: string
  lastName: string
}

interface ClassFormProps {
  gymId: string
  trainers: Trainer[]
  onSuccess?: () => void
}

const initialState: CreateClassState = { success: false, error: null as string | null }

export function ClassForm({ trainers, onSuccess }: ClassFormProps) {
  const [state, formAction, pending] = useActionState(createClassAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success("Clase creada correctamente")
      formRef.current?.reset()
      onSuccess?.()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state, onSuccess])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la clase</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Ej: Spinning, Yoga, Funcional"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora</label>
        <input
          name="startTime"
          type="datetime-local"
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cupo máximo</label>
          <input
            name="maxCapacity"
            type="number"
            defaultValue={20}
            min={1}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duración (min)</label>
          <input
            name="durationMin"
            type="number"
            defaultValue={60}
            min={15}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Trainer</label>
        <select
          name="trainerId"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Sin trainer asignado</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName} {t.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
        <input
          name="location"
          type="text"
          placeholder="Ej: Sala A, Piscina"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Descripción de la clase..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creando...
          </>
        ) : (
          "Crear clase"
        )}
      </button>
    </form>
  )
}
