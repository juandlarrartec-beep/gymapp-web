import { MemberStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { MembersTable } from "@/components/members/MembersTable"

export default async function DemoMembersPage() {
  const gymId = process.env.DEMO_GYM_ID!

  const members = await db.member.findMany({
    where: { gymId },
    include: {
      membershipPlan: { select: { name: true, priceAmount: true, currency: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const counts = {
    total: members.length,
    active: members.filter((m) => m.status === MemberStatus.ACTIVE).length,
    suspended: members.filter((m) => m.status === MemberStatus.SUSPENDED).length,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Socios</h1>
          <p className="text-sm text-slate-400 mt-1">
            {counts.active} activos · {counts.suspended} suspendidos · {counts.total} total
          </p>
        </div>
        {/* Sin botón "Nuevo socio" — modo demo read-only */}
      </div>

      <MembersTable members={members} gymId={gymId} />
    </div>
  )
}
