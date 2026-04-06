"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"
import { markAttendanceAction } from "@/app/(dashboard)/dashboard/classes/actions"
import clsx from "clsx"

interface AttendanceToggleProps {
  bookingId: string
  attended: boolean
}

export function AttendanceToggle({ bookingId, attended }: AttendanceToggleProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const result = await markAttendanceAction(bookingId, !attended)
      if (result.error) toast.error(result.error)
      else toast.success(attended ? "Asistencia removida" : "Asistencia registrada")
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
        attended
          ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
        isPending && "opacity-60"
      )}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Check className="w-3 h-3" />
      )}
      {attended ? "Asistió" : "Marcar"}
    </button>
  )
}
