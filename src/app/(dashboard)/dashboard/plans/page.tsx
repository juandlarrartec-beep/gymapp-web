import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"

export default async function PlansPage() {
  const { gymId } = await requireGymScope()

  const plans = await db.membershipPlan.findMany({
    where: { gymId, isActive: true },
    orderBy: { priceAmount: "asc" },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planes de membresía</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500">
          + Nuevo plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No tenés planes configurados</p>
          <p className="text-sm mt-1">Creá tu primer plan para empezar a registrar socios</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              )}
              <div className="mt-4">
                <span className="text-2xl font-bold">
                  {(plan.priceAmount / 100).toLocaleString("es-AR")}
                </span>
                <span className="text-slate-500 text-sm ml-1">
                  {plan.currency} / {plan.durationDays}d
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
