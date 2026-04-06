"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import clsx from "clsx"
import { createExerciseAction } from "@/app/(dashboard)/dashboard/training/actions"

const MUSCLE_OPTIONS = [
  { value: "CHEST", label: "Pecho" },
  { value: "BACK", label: "Espalda" },
  { value: "LEGS", label: "Piernas" },
  { value: "SHOULDERS", label: "Hombros" },
  { value: "TRICEPS", label: "Tríceps" },
  { value: "BICEPS", label: "Bíceps" },
  { value: "CORE", label: "Core" },
  { value: "GLUTES", label: "Glúteos" },
  { value: "CALVES", label: "Pantorrillas" },
  { value: "ARMS", label: "Brazos" },
]

export function CreateExerciseModal() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  function toggleGroup(value: string) {
    setSelectedGroups((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("muscleGroups", selectedGroups.join(","))

    startTransition(async () => {
      const res = await createExerciseAction(fd)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Ejercicio creado")
        formRef.current?.reset()
        setSelectedGroups([])
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors"
      >
        <Plus className="w-4 h-4" />
        Ejercicio
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Nuevo ejercicio</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej: Press de banca, Sentadilla..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Técnica, variantes..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Grupos musculares
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleGroup(opt.value)}
                      className={clsx(
                        "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors",
                        selectedGroups.includes(opt.value)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className={clsx(
                    "text-sm px-4 py-2 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {pending ? "Creando..." : "Crear ejercicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
