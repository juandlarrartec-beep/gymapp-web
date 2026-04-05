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

  const searchParams = req.nextUrl.searchParams
  const memberId = searchParams.get("memberId")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const pageSize = 50

  const where = {
    gymId,
    ...(memberId ? { memberId } : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    db.accessLog.findMany({
      where,
      include: {
        member: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.accessLog.count({ where }),
  ])

  return NextResponse.json(ok({ logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }))
}
