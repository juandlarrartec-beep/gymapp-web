import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { Brain } from "lucide-react"
import { ChurnList } from "@/components/churn/ChurnList"
import { recalculateChurnAction } from "./actions"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Botón de recalcular — necesita ser client porque dispara Server Action con feedback
import { RecalculateButton } from "@/components/churn/RecalculateButton"

export default async function ChurnPage() {
  const { gymId } = await requireGymScope()

  const scores = await db.churnScore.findMany({
    where: { gymId },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
    orderBy: { riskScore: "desc" },
  })

  const lastCalculated = scores[0]?.calculatedAt ?? null

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-6 h-6 text-indigo-500" />
            <h1 className="text-2xl font-bold">Riesgo de fuga — IA</h1>
          </div>
          <p className="text-sm text-slate-400">
            Socios con mayor probabilidad de abandonar el gimnasio
            {lastCalculated && (
              <> · Actualizado {format(new Date(lastCalculated), "dd MMM HH:mm", { locale: es })}</>
            )}
          </p>
        </div>

        <RecalculateButton action={recalculateChurnAction} />
      </div>

      {scores.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
          <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Sin datos de churn todavía</p>
          <p className="text-slate-400 text-sm mt-1">
            Presioná &quot;Recalcular IA&quot; para analizar todos los socios ahora.
          </p>
        </div>
      ) : (
        <ChurnList scores={scores} />
      )}
    </div>
  )
}
