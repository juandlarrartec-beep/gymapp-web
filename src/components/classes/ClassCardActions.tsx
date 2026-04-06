"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontal, Copy, XCircle } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cancelClassAction, duplicateClassAction } from "@/app/(dashboard)/dashboard/classes/actions"
import clsx from "clsx"

interface ClassCardActionsProps {
  classId: string
  gymId: string
}

export function ClassCardActions({ classId }: ClassCardActionsProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleCancel() {
    setOpen(false)
    startTransition(async () => {
      const result = await cancelClassAction(classId)
      if (result.error) toast.error(result.error)
      else toast.success("Clase cancelada")
    })
  }

  function handleDuplicate() {
    setOpen(false)
    startTransition(async () => {
      const result = await duplicateClassAction(classId)
      if (result.error) toast.error(result.error)
      else toast.success("Clase duplicada para la próxima semana")
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className={clsx(
          "p-1.5 rounded-lg border text-slate-500 hover:bg-slate-50 transition-colors",
          isPending && "opacity-50"
        )}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-20 bg-white border rounded-xl shadow-lg py-1 w-44">
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
          >
            <Copy className="w-4 h-4" />
            Duplicar (próx. sem.)
          </button>
          <button
            onClick={handleCancel}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600"
          >
            <XCircle className="w-4 h-4" />
            Cancelar clase
          </button>
        </div>
      )}
    </div>
  )
}
