import { MemberStatus } from "@prisma/client"
import Link from "next/link"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { MembersTable } from "@/components/members/MembersTable"

export default async function MembersPage() {
  const { gymId } = await requireGymScope()

  const [members, plans] = await Promise.all([
    db.member.findMany({
      where: { gymId },
      include: {
        membershipPlan: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.membershipPlan.findMany({
      where: { gymId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const totalActive = members.filter((m) => m.status === MemberStatus.ACTIVE).length

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Socios</h1>
          <p className="text-sm text-slate-400 mt-1">
            {members.length} total · {totalActive} activos
          </p>
        </div>
        <Link
          href="/dashboard/members/new"
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors min-h-[44px] flex items-center"
        >
          + Nuevo socio
        </Link>
      </div>

      <MembersTable members={members} gymId={gymId} plans={plans} />
    </div>
  )
}
