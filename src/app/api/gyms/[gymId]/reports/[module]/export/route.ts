import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getGymId, err } from "@/lib/db"
import { getFinancialReport } from "@/lib/reports/financial"
import { getMembersReport } from "@/lib/reports/members"
import { getAttendanceReport } from "@/lib/reports/attendance"
import { getTrainingReport } from "@/lib/reports/training"
import { getAccessReport } from "@/lib/reports/access"
import { exportToExcel } from "@/lib/reports/export"
import { subDays } from "date-fns"

type ReportModule = "financial" | "members" | "attendance" | "training" | "access"

function flattenForExcel(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : { value: item }
    )
  }
  if (typeof data === "object" && data !== null) {
    return [data as Record<string, unknown>]
  }
  return [{ value: String(data) }]
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; module: string }> }
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(err("No autenticado"), { status: 401 })
  }

  const { gymId, module } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) {
    return NextResponse.json(err("Sin acceso"), { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const now = new Date()
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : subDays(now, 30)
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now

  let reportData: unknown

  switch (module as ReportModule) {
    case "financial":
      reportData = await getFinancialReport(gymId, from, to)
      break
    case "members":
      reportData = await getMembersReport(gymId, from, to)
      break
    case "attendance":
      reportData = await getAttendanceReport(gymId, from, to)
      break
    case "training":
      reportData = await getTrainingReport(gymId, from, to)
      break
    case "access":
      reportData = await getAccessReport(gymId, from, to)
      break
    default:
      return NextResponse.json(err("Módulo inválido"), { status: 400 })
  }

  // Para reportes con sub-arrays (byMonth, byPlan, etc.), exportar el array más relevante
  const dataForExcel = (typeof reportData === "object" && reportData !== null)
    ? (() => {
        const obj = reportData as Record<string, unknown>
        // Buscar el primer array en el objeto
        const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]))
        if (arrayKey) return flattenForExcel(obj[arrayKey])
        return flattenForExcel(reportData)
      })()
    : flattenForExcel(reportData)

  const { buffer, filename } = exportToExcel(dataForExcel, `reporte-${module}`)

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
