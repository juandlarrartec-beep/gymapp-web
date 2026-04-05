import { sendWhatsApp, WA_TEMPLATES } from "@/lib/whatsapp"

interface MemberBasic {
  firstName: string
  phone: string | null
}

/**
 * Notificar pago fallido con link de pago.
 * Se llama en el smart retry de Fase 3 cuando se llega al intento 3.
 */
export async function notifyPaymentFailed(
  member: MemberBasic,
  paymentLink: string,
  amount: number,
  currency: string
): Promise<void> {
  if (!member.phone) return

  const formatted = `${(amount / 100).toLocaleString("es-AR")} ${currency}`

  const result = await sendWhatsApp(member.phone, WA_TEMPLATES.PAYMENT_FAILED, [
    member.firstName,
    formatted,
    paymentLink,
  ])

  if (result.error) {
    console.error(`[WhatsApp] Error al notificar pago fallido a ${member.firstName}:`, result.error)
  }
}

/**
 * Notificar pago exitoso al socio.
 */
export async function notifyPaymentSuccess(
  member: MemberBasic,
  amount: number,
  currency: string
): Promise<void> {
  if (!member.phone) return

  const formatted = `${(amount / 100).toLocaleString("es-AR")} ${currency}`
  const date = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

  const result = await sendWhatsApp(member.phone, WA_TEMPLATES.PAYMENT_SUCCESS, [
    member.firstName,
    formatted,
    date,
  ])

  if (result.error) {
    console.error(`[WhatsApp] Error al notificar pago exitoso a ${member.firstName}:`, result.error)
  }
}
