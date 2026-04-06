"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ApiResponse } from "@/lib/db"

interface Props {
  routineId: string
  action: (routineId: string) => Promise<ApiResponse<{ ok: boolean }>>
}

export function DeleteRoutineButton({ routineId, action }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm("¿Eliminar esta rutina? No se puede deshacer.")) return

    startTransition(async () => {
      const res = await action(routineId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Rutina eliminada")
        router.push("/dashboard/training")
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 hover:border-red-300 bg-white text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {pending ? "..." : "Eliminar"}
    </button>
  )
}
