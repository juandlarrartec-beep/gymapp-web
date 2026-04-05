import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

// Polling endpoint: devuelve 200 cuando el servidor puede ver el gym del usuario
// Devuelve 202 si el usuario está autenticado pero el JWT no tiene orgId aún
// Devuelve 401 si no está autenticado
export async function GET(): Promise<NextResponse> {
  const { userId, orgId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  if (!orgId) {
    // Usuario autenticado pero Clerk aún no propagó el orgId al JWT del servidor
    return NextResponse.json({ ready: false }, { status: 202 })
  }

  const gym = await db.gym.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true },
  })

  if (!gym) {
    return NextResponse.json({ ready: false }, { status: 202 })
  }

  return NextResponse.json({ ready: true, gymId: gym.id }, { status: 200 })
}
