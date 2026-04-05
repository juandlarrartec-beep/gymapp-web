import { MemberStatus, PaymentStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { ApiResponse } from "@/lib/db"
import crypto from "crypto"

function verifyMercadoPagoSignature(
  body: string,
  xRequestId: string,
  xTimestamp: string,
  xSignature: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return false
  const manifest = `id:${xRequestId};ts:${xTimestamp};`
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(manifest)
  const expected = hmac.digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(xSignature.split(",").find(s => s.startsWith("v1="))?.slice(3) ?? "", "hex"))
}

interface MPWebhookBody {
  action: string
  type: string
  data: { id: string }
  date_created?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ processed: boolean }>>> {
  const body = await req.text()

  // Verificar firma si está configurada
  const xRequestId = req.headers.get("x-request-id") ?? ""
  const xTimestamp = req.headers.get("x-timestamp") ?? ""
  const xSignature = req.headers.get("x-signature") ?? ""

  if (process.env.MERCADOPAGO_WEBHOOK_SECRET && xSignature) {
    const valid = verifyMercadoPagoSignature(body, xRequestId, xTimestamp, xSignature)
    if (!valid) {
      return NextResponse.json({ data: null, error: "Firma inválida" }, { status: 401 })
    }
  }

  let payload: MPWebhookBody
  try {
    payload = JSON.parse(body) as MPWebhookBody
  } catch {
    return NextResponse.json({ data: null, error: "JSON inválido" }, { status: 400 })
  }

  if (payload.type === "payment") {
    const mpPaymentId = payload.data.id

    // Consultar el pago en MP (necesitaríamos hacer una llamada a la API)
    // Por ahora, buscamos el pago por providerPaymentId
    const payment = await db.payment.findFirst({
      where: { providerPaymentId: mpPaymentId },
      include: { member: { select: { id: true, gymId: true } } },
    })

    if (payment) {
      if (payload.action === "payment.updated" || payload.action === "payment.created") {
        // El status real viene en la payload — aquí asumimos approved
        // En producción se debería consultar la API de MP para obtener el status real
        await db.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCEEDED, nextRetryAt: null },
        })
        await db.member.update({
          where: { id: payment.memberId },
          data: { status: MemberStatus.ACTIVE },
        })
      }
    }
  }

  if (payload.type === "subscription_preapproval") {
    // Manejar pre-aprobaciones (método de pago registrado)
    const { data: { id: preapprovalId } } = payload
    const member = await db.member.findFirst({
      where: { mercadopagoCustomerId: preapprovalId },
    })
    if (member) {
      await db.member.update({
        where: { id: member.id },
        data: { paymentMethodId: preapprovalId },
      })
    }
  }

  return NextResponse.json({ data: { processed: true }, error: null })
}
