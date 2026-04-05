import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { z } from "zod"

const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional().nullable(),
  priceAmount: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  durationDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  accessDays: z.array(z.string()).optional(),
  accessHourStart: z.number().int().min(0).max(23).optional().nullable(),
  accessHourEnd: z.number().int().min(0).max(23).optional().nullable(),
})

async function verifyAccess(gymId: string): Promise<boolean> {
  const callerGymId = await getGymId().catch(() => null)
  return callerGymId === gymId
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string; planId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, planId } = await params

  if (!(await verifyAccess(gymId))) {
    return NextResponse.json(err("Sin acceso a este gym"), { status: 403 })
  }

  const plan = await db.membershipPlan.findFirst({ where: { id: planId, gymId } })
  if (!plan) return NextResponse.json(err("Plan no encontrado"), { status: 404 })

  const body = await req.json()
  const parsed = updatePlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const updated = await db.membershipPlan.update({
    where: { id: planId },
    data: parsed.data,
  })

  return NextResponse.json(ok(updated))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ gymId: string; planId: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json(err("No autenticado"), { status: 401 })

  const { gymId, planId } = await params

  if (!(await verifyAccess(gymId))) {
    return NextResponse.json(err("Sin acceso a este gym"), { status: 403 })
  }

  const plan = await db.membershipPlan.findFirst({ where: { id: planId, gymId } })
  if (!plan) return NextResponse.json(err("Plan no encontrado"), { status: 404 })

  // Soft delete — desactivar en vez de eliminar para no romper historial
  const updated = await db.membershipPlan.update({
    where: { id: planId },
    data: { isActive: false },
  })

  return NextResponse.json(ok(updated))
}
