import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { PlansClient } from "@/components/plans/PlansClient"

export default async function PlansPage() {
  const { gymId } = await requireGymScope()

  const plans = await db.membershipPlan.findMany({
    where: { gymId },
    include: { _count: { select: { members: true } } },
    orderBy: { priceAmount: "asc" },
  })

  return (
    <div className="p-8">
      <PlansClient plans={plans} />
    </div>
  )
}
