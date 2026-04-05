import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const createTrainerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  specialty: z.string().optional().nullable(),
  clerkUserId: z.string().optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId } = await params
  const callerGymId = await getGymId().catch(() => null)
  if (callerGymId !== gymId) return NextResponse.json(err("Sin acceso"), { status: 403 })

  const trainers = await db.trainer.findMany({
    where: { gymId, isActive: true },
    include: {
      _count: {
        select: { routines: true, classSchedules: true },
      },
    },
    orderBy: { firstName: "asc" },
  })

  return NextResponse.json(ok(trainers))
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
  const parsed = createTrainerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data = parsed.data

  const emailExists = await db.trainer.findFirst({ where: { gymId, email: data.email.toLowerCase() } })
  if (emailExists) return NextResponse.json(err("Ya existe un trainer con ese email"), { status: 409 })

  const trainer = await db.trainer.create({
    data: {
      gymId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone ?? null,
      specialty: data.specialty ?? null,
      clerkUserId: data.clerkUserId ?? null,
    },
  })

  return NextResponse.json(ok(trainer), { status: 201 })
}
