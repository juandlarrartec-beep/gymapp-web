"use client"

import { useState } from "react"
import { MapPin, Plus, Pencil, Trash2, Wifi, CheckCircle2, Star } from "lucide-react"

interface GymSeat {
  id: string
  name: string
  address: string | null
  isMain: boolean
  nfcReaderId: string | null
  createdAt: Date
}

interface GymData {
  id: string
  plan: string
  gymSeats: GymSeat[]
}

interface Props {
  gym: GymData
}

interface SeatFormData {
  name: string
  address: string
  isMain: boolean
  nfcReaderId: string
}

const emptyForm: SeatFormData = { name: "", address: "", isMain: false, nfcReaderId: "" }

export default function SeatsClient({ gym }: Props) {
  const [seats, setSeats] = useState<GymSeat[]>(gym.gymSeats)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SeatFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  if (gym.plan !== "PRO") {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Multi-sede</h1>
        <p className="text-slate-500 mb-6">
          Gestioná múltiples sedes desde un solo panel.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h2 className="font-semibold text-indigo-900 mb-2">
            Función disponible en el plan Pro
          </h2>
          <p className="text-indigo-700 text-sm mb-4">
            Con el plan Pro podés gestionar varias sedes, filtrar reportes por sede
            y configurar un lector NFC independiente por sucursal.
          </p>
          <a
            href="/dashboard/billing"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Actualizar a Pro — $39/mes
          </a>
        </div>
      </div>
    )
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError("")
    setShowForm(true)
  }

  function openEdit(seat: GymSeat) {
    setEditingId(seat.id)
    setForm({
      name: seat.name,
      address: seat.address ?? "",
      isMain: seat.isMain,
      nfcReaderId: seat.nfcReaderId ?? "",
    })
    setError("")
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("El nombre de la sede es requerido")
      return
    }
    setSaving(true)
    setError("")

    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      isMain: form.isMain,
      nfcReaderId: form.nfcReaderId.trim() || null,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/gyms/${gym.id}/seats/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = (await res.json()) as { data: GymSeat | null; error: string | null }
        if (json.error || !json.data) { setError(json.error ?? "Error"); return }

        setSeats((prev) =>
          prev.map((s) => (s.id === editingId ? json.data! : s))
        )
      } else {
        const res = await fetch(`/api/gyms/${gym.id}/seats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = (await res.json()) as { data: GymSeat | null; error: string | null }
        if (json.error || !json.data) { setError(json.error ?? "Error"); return }

        setSeats((prev) => [...prev, json.data!])
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(seatId: string) {
    if (seats.length <= 1) return
    setDeletingId(seatId)
    try {
      const res = await fetch(`/api/gyms/${gym.id}/seats/${seatId}`, {
        method: "DELETE",
      })
      const json = (await res.json()) as { data: unknown; error: string | null }
      if (!json.error) {
        setSeats((prev) => prev.filter((s) => s.id !== seatId))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Sedes</h1>
          <p className="text-slate-500 text-sm">
            {seats.length} sede{seats.length !== 1 ? "s" : ""} configurada{seats.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva sede
        </button>
      </div>

      {/* Lista de sedes */}
      <div className="space-y-3">
        {seats.map((seat) => (
          <div
            key={seat.id}
            className="bg-white rounded-xl border p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{seat.name}</p>
                    {seat.isMain && (
                      <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" />
                        Principal
                      </span>
                    )}
                  </div>
                  {seat.address && (
                    <p className="text-sm text-slate-400 mt-0.5">{seat.address}</p>
                  )}
                  {seat.nfcReaderId && (
                    <div className="flex items-center gap-1 mt-1">
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-slate-500 font-mono">{seat.nfcReaderId}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(seat)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                </button>
                {seats.length > 1 && (
                  <button
                    onClick={() => handleDelete(seat.id)}
                    disabled={deletingId === seat.id}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de alta/edición */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              {editingId ? "Editar sede" : "Nueva sede"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Sede Norte, Local Centro"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Av. Corrientes 1234, CABA"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  ID del lector NFC
                </label>
                <input
                  type="text"
                  value={form.nfcReaderId}
                  onChange={(e) => setForm((f) => ({ ...f, nfcReaderId: e.target.value }))}
                  placeholder="Ej: VTAP100-A3F9B2"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isMain}
                  onChange={(e) => setForm((f) => ({ ...f, isMain: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm">Marcar como sede principal</span>
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear sede"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {seats.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Los reportes pueden filtrarse por sede desde el panel de Reportes.
        </div>
      )}
    </div>
  )
}
