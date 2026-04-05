import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import GymOnboardingForm from "./GymOnboardingForm"

export default async function GymOnboardingPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")

  if (orgId) {
    const gym = await db.gym.findUnique({ where: { clerkOrgId: orgId }, select: { id: true } })
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
