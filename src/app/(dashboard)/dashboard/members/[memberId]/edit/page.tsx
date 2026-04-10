import Link from "next/link"
import { notFound } from "next/navigation"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { MemberForm } from "@/components/members/MemberForm"

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { gymId } = await requireGymScope()
  const { memberId } = await params

  const [member, plans] = await Promise.all([
    db.member.findFirst({
      where: { id: memberId, gymId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        membershipPlanId: true,
        startDate: true,
      },
    }),
    db.membershipPlan.findMany({
      where: { gymId, isActive: true },
      orderBy: { priceAmount: "asc" },
    }),
  ])

  if (!member) notFound()

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/members/${memberId}`}
          className="text-slate-400 hover:text-slate-600 text-sm"
        >
          ← Volver al perfil
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        Editar socio — {member.firstName} {member.lastName}
      </h1>

      {plans.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">No hay planes activos disponibles</p>
          <p className="text-amber-600 text-sm mt-1">
            Andá a Ajustes → Planes para activar un plan
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <MemberForm plans={plans} gymId={gymId} member={member} />
        </div>
      )}
    </div>
  )
}
