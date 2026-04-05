"use client"

import { useState } from "react"
import { CheckCircle2, Zap } from "lucide-react"

interface PlanInfo {
  price: string
  maxMembers: string
  features: string[]
}

interface GymBillingData {
  id: string
  plan: string
  stripeAccountId: string | null
}

interface Props {
  gym: GymBillingData
  planFeatures: Record<string, PlanInfo>
  planOrder: string[]
  nextPlan: string | null
}

export default function BillingClient({ gym, planFeatures, planOrder, nextPlan }: Props) {
  const [upgrading, setUpgrading] = useState(false)

  const currentPlanInfo = planFeatures[gym.plan]

  async function handleUpgrade(targetPlan: string) {
    setUpgrading(true)
    try {
      const res = await fetch(`/api/gyms/${gym.id}/billing/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan }),
      })
      const json = (await res.json()) as { data: { checkoutUrl: string } | null; error: string | null }

      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl
      }
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Facturación y plan</h1>
        <p className="text-slate-500 text-sm">
          Gestioná tu suscripción y accedé a las funciones de cada plan.
        </p>
      </div>

      {/* Plan actual */}
      <div className="bg-white rounded-xl border-2 border-indigo-500 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              Plan actual
            </span>
            <h2 className="text-2xl font-bold mt-2">{gym.plan}</h2>
            <p className="text-slate-500 mt-0.5">
              {currentPlanInfo?.price ?? "—"} · {currentPlanInfo?.maxMembers ?? "—"}
            </p>
          </div>
          {nextPlan && (
            <button
              onClick={() => handleUpgrade(nextPlan)}
              disabled={upgrading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              <Zap className="w-4 h-4" />
              {upgrading ? "Redirigiendo..." : `Actualizar a ${nextPlan}`}
            </button>
          )}
        </div>

        {currentPlanInfo && (
          <ul className="mt-4 space-y-1.5">
            {currentPlanInfo.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Planes superiores disponibles */}
      {nextPlan && (
        <div>
          <h2 className="font-semibold mb-4 text-sm text-slate-500 uppercase tracking-wide">
            Planes disponibles
          </h2>
          <div className="grid gap-4">
            {planOrder.slice(planOrder.indexOf(gym.plan) + 1).map((plan) => {
              const info = planFeatures[plan]
              if (!info) return null
              return (
                <div key={plan} className="bg-white rounded-xl border p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{plan}</h3>
                      <p className="text-slate-500 text-sm">
                        {info.price} · {info.maxMembers}
                      </p>
                      <ul className="mt-3 space-y-1">
                        {info.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgrade(plan)}
                      disabled={upgrading}
                      className="shrink-0 px-4 py-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Actualizar a {plan}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {gym.plan === "PRO" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Estás en el plan Pro</p>
            <p className="text-sm text-green-700">
              Tenés acceso a todas las funciones de GymApp.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
