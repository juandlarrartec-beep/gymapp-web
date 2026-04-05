import { NextResponse } from "next/server"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

// Helper endpoint para que el client pueda obtener su gymId
export async function GET(): Promise<NextResponse<ApiResponse<{ gymId: string }>>> {
  try {
    const gymId = await getGymId()
    return NextResponse.json(ok({ gymId }))
  } catch {
    return NextResponse.json(err("No hay gym activo para esta sesión"), { status: 400 })
  }
}
