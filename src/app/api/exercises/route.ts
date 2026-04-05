import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const q = searchParams.get("q") ?? ""
  const muscleGroup = searchParams.get("muscleGroup")
  const gymId = searchParams.get("gymId")

  // Retornar ejercicios globales (isPublic=true, gymId=null)
  // + ejercicios personalizados del gym si se pasa gymId
  const exercises = await db.exercise.findMany({
    where: {
      OR: [
        {
          gymId: null,
          isPublic: true,
          ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
          ...(muscleGroup ? { muscleGroups: { has: muscleGroup } } : {}),
        },
        ...(gymId
          ? [
              {
                gymId,
                ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
                ...(muscleGroup ? { muscleGroups: { has: muscleGroup } } : {}),
              },
            ]
          : []),
      ],
    },
    orderBy: { name: "asc" },
    take: 50,
  })

  return NextResponse.json(ok(exercises))
}
