import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const createExerciseSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().optional().nullable(),
  muscleGroups: z.array(z.string()).min(1),
  videoUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
})

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
  const parsed = createExerciseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const data = parsed.data
  const exercise = await db.exercise.create({
    data: {
      gymId,
      name: data.name,
      description: data.description ?? null,
      muscleGroups: data.muscleGroups,
      videoUrl: data.videoUrl ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      isPublic: data.isPublic,
    },
  })

  return NextResponse.json(ok(exercise), { status: 201 })
}
