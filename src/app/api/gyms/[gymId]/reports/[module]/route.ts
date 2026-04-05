import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { getFinancialReport } from "@/lib/reports/financial"
import { getMembersReport } from "@/lib/reports/members"
import { getAttendanceReport } from "@/lib/reports/attendance"
import { getTrainingReport } from "@/lib/reports/training"
import { getAccessReport } from "@/lib/reports/access"
import { subDays } from "date-fns"

const VALID_MODULES = ["financial", "members", "attendance", "training", "access"] as const
type ReportModule = typeof VALID_MODULES[number]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; module: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, module } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  if (!VALID_MODULES.includes(module as ReportModule)) {
    return NextResponse.json(err(`Módulo inválido. Opciones: ${VALID_MODULES.join(", ")}`), { status: 400 })
  }

  const searchParams = req.nextUrl.searchParams
  const now = new Date()
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : subDays(now, 30)
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now

  let data: unknown

  switch (module as ReportModule) {
    case "financial":
      data = await getFinancialReport(gymId, from, to)
      break
    case "members":
      data = await getMembersReport(gymId, from, to)
      break
    case "attendance":
      data = await getAttendanceReport(gymId, from, to)
      break
    case "training":
      data = await getTrainingReport(gymId, from, to)
      break
    case "access":
      data = await getAccessReport(gymId, from, to)
      break
  }

  return NextResponse.json(ok(data))
}
