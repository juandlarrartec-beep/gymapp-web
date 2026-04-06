"use client"

import { useState, useTransition, useRef } from "react"
import { Users, X } from "lucide-react"
import { toast } from "sonner"
import clsx from "clsx"
import { assignRoutineToMemberAction } from "@/app/(dashboard)/dashboard/training/actions"

interface Member {
  id: string
  firstName: string
  lastName: string
}

interface Props {
  routineId: string
  members: Member[]
}

export function AssignRoutineModal({ routineId, members }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const memberId = fd.get("memberId") as string
    const validUntil = (fd.get("validUntil") as string) || null
    const notes = (fd.get("notes") as string) || null

    if (!memberId) {
      toast.error("Seleccioná un socio")
      return
    }

    startTransition(async () => {
      const res = await assignRoutineToMemberAction({ routineId, memberId, validUntil, notes })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Rutina asignada")
        formRef.current?.reset()
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
      >
        <Users className="w-4 h-4" />
        Asignar a socio
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Asignar rutina</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {/* Socio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Socio <span className="text-red-500">*</span>
                </label>
                <select
                  name="memberId"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar socio...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vencimiento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Válida hasta (opcional)
                </label>
                <input
                  type="date"
                  name="validUntil"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ej: comenzar con peso bajo, lesión en hombro..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
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
                  {pending ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
