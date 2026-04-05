import { MemberStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const updateMemberSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  membershipPlanId: z.string().cuid().optional(),
  status: z.nativeEnum(MemberStatus).optional(),
  frozenUntil: z.string().optional().nullable(),
  instagramHandle: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
})

async function verifyAccess(gymId: string): Promise<boolean> {
  const callerGymId = await getGymId().catch(() => null)
  return callerGymId === gymId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    include: {
      membershipPlan: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      accessLogs: {
        orderBy: { timestamp: "desc" },
        take: 20,
      },
      churnScore: true,
      routineAssignments: {
        where: { isActive: true },
        include: { routine: { include: { exercises: { include: { exercise: true } } } } },
      },
    },
  })

  if (!member) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  return NextResponse.json(ok(member))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const existing = await db.member.findFirst({ where: { id: memberId, gymId } })
  if (!existing) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  const body = await req.json()
  const parsed = updateMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const updateData = {
    ...parsed.data,
    ...(parsed.data.birthDate !== undefined
      ? { birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null }
      : {}),
    ...(parsed.data.frozenUntil !== undefined
      ? { frozenUntil: parsed.data.frozenUntil ? new Date(parsed.data.frozenUntil) : null }
      : {}),
    ...(parsed.data.status === MemberStatus.CANCELLED ? { cancellationDate: new Date() } : {}),
  }

  const updated = await db.member.update({
    where: { id: memberId },
    data: updateData,
    include: { membershipPlan: { select: { name: true } } },
  })

  return NextResponse.json(ok(updated))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; memberId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, memberId } = await params
  if (!(await verifyAccess(gymId))) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const existing = await db.member.findFirst({ where: { id: memberId, gymId } })
  if (!existing) return NextResponse.json(err("Socio no encontrado"), { status: 404 })

  // Soft delete — cancelar membresía
  const updated = await db.member.update({
    where: { id: memberId },
    data: {
      status: MemberStatus.CANCELLED,
      cancellationDate: new Date(),
    },
  })

  return NextResponse.json(ok(updated))
}
