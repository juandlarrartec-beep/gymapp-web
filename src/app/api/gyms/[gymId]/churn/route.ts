import { ChurnRisk } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const riskFilter = req.nextUrl.searchParams.get("risk") as ChurnRisk | null

  const scores = await db.churnScore.findMany({
    where: {
      gymId,
      ...(riskFilter ? { riskLevel: riskFilter } : {}),
    },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          membershipPlan: { select: { name: true } },
        },
      },
    },
    orderBy: { riskScore: "desc" },
  })

  return NextResponse.json(ok(scores))
}
