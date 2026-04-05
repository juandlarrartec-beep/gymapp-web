import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import GymOnboardingForm from "./GymOnboardingForm"

export default async function GymOnboardingPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")

  // Obtener el orgId — puede estar en el JWT o hay que consultarlo a Clerk
  let clerkOrgId = orgId
  if (!clerkOrgId) {
    const clerk = await clerkClient()
    const memberships = await clerk.users.getOrganizationMembershipList({ userId })
    if (memberships.data.length > 0 && memberships.data[0]) {
      clerkOrgId = memberships.data[0].organization.id
    }
  }

  // Si ya tiene org Y gym en DB → ir al dashboard
  if (clerkOrgId) {
    const gym = await db.gym.findUnique({ where: { clerkOrgId }, select: { id: true } })
    if (gym) redirect("/dashboard")
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-lg w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Registrá tu gimnasio</h1>
          <p className="text-slate-500 mt-2">Configurá los datos básicos para comenzar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <GymOnboardingForm />
        </div>
      </div>
    </main>
  )
}
