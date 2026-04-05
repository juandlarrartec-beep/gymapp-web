import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { db } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"

// Tipos de eventos Clerk que nos interesan
interface ClerkOrgCreatedEvent {
  type: "organization.created"
  data: {
    id: string
    name: string
    slug: string
    created_by: string
  }
}

interface ClerkOrgMembershipCreatedEvent {
  type: "organizationMembership.created"
  data: {
    id: string
    organization: { id: string; name: string }
    public_user_data: { user_id: string; identifier: string }
    role: string
    created_at: number
  }
}

type ClerkWebhookEvent = ClerkOrgCreatedEvent | ClerkOrgMembershipCreatedEvent

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ processed: boolean }>>> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ data: null, error: "Webhook secret no configurado" }, { status: 500 })
  }

  // Verificar firma svix
  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ data: null, error: "Headers svix faltantes" }, { status: 400 })
  }

  const body = await req.text()

  let event: ClerkWebhookEvent
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return NextResponse.json({ data: null, error: "Firma inválida" }, { status: 401 })
  }

  if (event.type === "organization.created") {
    const { id: clerkOrgId, name, slug } = event.data

    // Verificar que no exista ya
    const existing = await db.gym.findUnique({ where: { clerkOrgId } })
    if (!existing) {
      // Verificar slug único — si hay colisión, agregar sufijo
      const slugBase = slug ?? name.toLowerCase().replace(/[^a-z0-9]/g, "-")
      let finalSlug = slugBase
      let attempt = 0
      while (await db.gym.findUnique({ where: { slug: finalSlug } })) {
        attempt++
        finalSlug = `${slugBase}-${attempt}`
      }

      await db.gym.create({
        data: {
          clerkOrgId,
          name,
          slug: finalSlug,
        },
      })
    }
  }

  if (event.type === "organizationMembership.created") {
    // Aquí se podría sincronizar Trainer o Member si ya existe el registro
  }

  return NextResponse.json({ data: { processed: true }, error: null })
}
