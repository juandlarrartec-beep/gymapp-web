"use client"

import { useState } from "react"

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

export function ClassForm({ gymId, trainers, onSuccess }: ClassFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const body = {
      name: formData.get("name") as string,
      description: formData.get("description") as string | null,
      trainerId: formData.get("trainerId") as string || null,
      maxCapacity: parseInt(formData.get("maxCapacity") as string),
      durationMin: parseInt(formData.get("durationMin") as string),
      location: formData.get("location") as string | null,
      startTime: formData.get("startTime") as string,
    }

    try {
      const res = await fetch(`/api/gyms/${gymId}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { error: string | null }
      if (!res.ok || json.error) {
        setError(json.error ?? "Error al crear la clase")
      } else {
        onSuccess?.()
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

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

      <div className="grid grid-cols-2 gap-4">
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-colors"
      >
        {submitting ? "Creando..." : "Crear clase"}
      </button>
    </form>
  )
}
