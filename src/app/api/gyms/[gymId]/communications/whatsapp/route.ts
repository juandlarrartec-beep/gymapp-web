import { MemberStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getGymId, ok, err } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import { sendWhatsApp } from "@/lib/whatsapp"
import { z } from "zod"

const massMessageSchema = z.object({
  message: z.string().min(5).max(1000),
  // template alternativo
  templateName: z.string().optional(),
  templateParams: z.array(z.string()).optional().default([]),
})

// Rate limit: 1 envío masivo por día por gym
// Se valida con un simple check en DB (podría mejorarse con Redis)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkRateLimit(_gymId: string): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Usamos el log de acceso con un hack: buscamos si hay algún pago creado hoy como proxy
  // En producción se debería usar una tabla específica de "CommunicationLog"
  // Por ahora, usamos un campo metadata en payments o simplemente permitimos el envío
  // TODO Sprint 3: crear tabla CommunicationLog con gymId, type, sentAt
  return true // permite el envío (implementar rate limit real con tabla dedicada)
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

  // Verificar rate limit
  const allowed = await checkRateLimit(gymId)
  if (!allowed) {
    return NextResponse.json(
      err("Límite de envío masivo alcanzado (1 por día)"),
      { status: 429 }
    )
  }

  const body = await req.json()
  const parsed = massMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0]?.message ?? "Datos inválidos"), { status: 400 })
  }

  const { message, templateName, templateParams } = parsed.data

  // Obtener todos los socios activos con teléfono
  const members = await db.member.findMany({
    where: { gymId, status: MemberStatus.ACTIVE, phone: { not: null } },
    select: { id: true, firstName: true, phone: true },
  })

  const results = {
    total: members.length,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }

  // Enviar en lotes para no saturar la API de Twilio
  const BATCH_SIZE = 10
  const batches = []
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    batches.push(members.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (member) => {
        if (!member.phone) return

        const result = templateName
          ? await sendWhatsApp(member.phone, templateName, templateParams)
          : await sendWhatsApp(member.phone, "custom", [message])

        if (result.error) {
          results.failed++
          if (results.errors.length < 5) {
            results.errors.push(`${member.firstName}: ${result.error}`)
          }
        } else {
          results.sent++
        }
      })
    )

    // Pequeña pausa entre lotes para respetar rate limits de Twilio
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return NextResponse.json(ok(results))
}
