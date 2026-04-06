"use client"

import { useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import clsx from "clsx"
import type { ApiResponse } from "@/lib/db"

interface Props {
  action: () => Promise<ApiResponse<{ updated: number }>>
}

export function RecalculateButton({ action }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const res = await action()
      if (res.error || !res.data) {
        toast.error(res.error ?? "Error inesperado")
      } else {
        toast.success(`Scores actualizados — ${res.data.updated} socios analizados`)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={clsx(
        "inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors",
        "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      )}
    >
      <RefreshCw className={clsx("w-4 h-4", pending && "animate-spin")} />
      {pending ? "Calculando..." : "Recalcular IA"}
    </button>
  )
}
