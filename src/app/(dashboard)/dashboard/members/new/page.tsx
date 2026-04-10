import Link from "next/link"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { MemberForm } from "@/components/members/MemberForm"

export default async function NewMemberPage() {
  const { gymId } = await requireGymScope()

  const plans = await db.membershipPlan.findMany({
    where: { gymId, isActive: true },
    orderBy: { priceAmount: "asc" },
  })

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/members" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Volver a socios
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Nuevo socio</h1>

      {plans.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Primero necesitás crear al menos un plan de membresía</p>
          <p className="text-amber-600 text-sm mt-1">
            Andá a Ajustes → Planes para crear un plan
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <MemberForm plans={plans} gymId={gymId} />
        </div>
      )}
    </div>
  )
}
