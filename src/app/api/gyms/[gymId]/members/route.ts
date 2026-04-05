import { MemberStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"
import { addDays } from "date-fns"

const createMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  membershipPlanId: z.string().cuid(),
  startDate: z.string().optional(),
})

type CreateMemberInput = z.infer<typeof createMemberSchema>

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
  const status = searchParams.get("status") as MemberStatus | null
  const planId = searchParams.get("planId")
  const search = searchParams.get("search") ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where = {
    gymId,
    ...(status ? { status } : {}),
    ...(planId ? { membershipPlanId: planId } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [members, total] = await Promise.all([
    db.member.findMany({
      where,
      include: { membershipPlan: { select: { name: true, priceAmount: true, currency: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.member.count({ where }),
  ])

  return NextResponse.json(
    ok({ members, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const body = await req.json()
  const parsed = createMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data: CreateMemberInput = parsed.data

  // Verificar que el plan pertenece al gym
  const plan = await db.membershipPlan.findFirst({
    where: { id: data.membershipPlanId, gymId, isActive: true },
  })
  if (!plan) return NextResponse.json(err("Plan no válido"), { status: 400 })

  // Verificar email único en el gym
  const emailExists = await db.member.findFirst({
    where: { gymId, email: data.email.toLowerCase() },
  })
  if (emailExists) return NextResponse.json(err("Ya existe un socio con ese email"), { status: 409 })

  const startDate = data.startDate ? new Date(data.startDate) : new Date()
  const nextPaymentDate = addDays(startDate, plan.durationDays)

  const member = await db.member.create({
    data: {
      gymId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone ?? null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      membershipPlanId: data.membershipPlanId,
      startDate,
      nextPaymentDate,
    },
    include: { membershipPlan: { select: { name: true } } },
  })

  return NextResponse.json(ok(member), { status: 201 })
}
