import { ClassStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const createClassSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().optional().nullable(),
  trainerId: z.string().optional().nullable(),
  maxCapacity: z.number().int().positive().default(20),
  durationMin: z.number().int().positive().default(60),
  location: z.string().optional().nullable(),
  startTime: z.string(), // ISO datetime
})

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
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const trainerId = searchParams.get("trainerId")
  const status = searchParams.get("status") as ClassStatus | null

  const where = {
    gymId,
    ...(trainerId ? { trainerId } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          startTime: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  }

  const classes = await db.classSchedule.findMany({
    where,
    include: {
      trainer: { select: { firstName: true, lastName: true } },
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: { in: ["CONFIRMED", "ATTENDED"] } },
        select: { id: true, status: true },
      },
    },
    orderBy: { startTime: "asc" },
    take: 100,
  })

  return NextResponse.json(ok(classes))
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
  const parsed = createClassSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data = parsed.data

  if (data.trainerId) {
    const trainer = await db.trainer.findFirst({ where: { id: data.trainerId, gymId } })
    if (!trainer) return NextResponse.json(err("Trainer no encontrado"), { status: 400 })
  }

  const classSchedule = await db.classSchedule.create({
    data: {
      gymId,
      name: data.name,
      description: data.description ?? null,
      trainerId: data.trainerId ?? null,
      maxCapacity: data.maxCapacity,
      durationMin: data.durationMin,
      location: data.location ?? null,
      startTime: new Date(data.startTime),
    },
  })

  return NextResponse.json(ok(classSchedule), { status: 201 })
}
