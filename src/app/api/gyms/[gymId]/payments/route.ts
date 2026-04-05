import { PaymentStatus } from "@prisma/client"
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
  const status = searchParams.get("status") as PaymentStatus | null
  const memberId = searchParams.get("memberId")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const pageSize = 20

  const where = {
    gymId,
    ...(status ? { status } : {}),
    ...(memberId ? { memberId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  }

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        member: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.payment.count({ where }),
  ])

  // Calcular deudores (socios con pagos fallidos recientes)
  const debtors = await db.member.findMany({
    where: {
      gymId,
      payments: {
        some: { status: PaymentStatus.FAILED },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      payments: {
        where: { status: PaymentStatus.FAILED },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { amount: true, currency: true, attemptNumber: true, nextRetryAt: true },
      },
    },
  })

  return NextResponse.json(
    ok({
      payments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      debtors,
    })
  )
}
