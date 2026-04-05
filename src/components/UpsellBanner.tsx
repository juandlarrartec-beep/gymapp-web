import Link from "next/link"
import { Sparkles } from "lucide-react"

interface UpsellBannerProps {
  feature: string
  targetPlan?: "STARTER" | "GROWTH" | "PRO"
  price?: string
  description?: string
}

const PLAN_PRICES: Record<string, string> = {
  STARTER: "$9/mes",
  GROWTH: "$19/mes",
  PRO: "$39/mes",
}

export function UpsellBanner({
  feature,
  targetPlan = "PRO",
  price,
  description,
}: UpsellBannerProps) {
  const displayPrice = price ?? PLAN_PRICES[targetPlan] ?? "$39/mes"

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 flex items-start gap-4">
      <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
        <Sparkles className="w-5 h-5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-indigo-900 text-sm">
          {feature} está disponible en el plan {targetPlan}
        </p>
        {description && (
          <p className="text-indigo-700 text-sm mt-0.5">{description}</p>
        )}
        <p className="text-indigo-600 text-sm mt-0.5">
          Actualizá por {displayPrice}
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
      >
        Actualizar
      </Link>
    </div>
  )
}
