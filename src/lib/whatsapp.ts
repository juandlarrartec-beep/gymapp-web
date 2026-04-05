import twilio from "twilio"

// Templates de WhatsApp Business aprobados en Twilio
// En producción deben estar aprobados en WhatsApp Business Manager
export const WA_TEMPLATES = {
  PAYMENT_FAILED: "gymapp_payment_failed",       // params: [nombre, monto, link]
  PAYMENT_SUCCESS: "gymapp_payment_success",      // params: [nombre, monto, fecha]
  BOOKING_CONFIRMED: "gymapp_booking_confirmed",  // params: [nombre, clase, fecha, hora, lugar]
  CLASS_REMINDER: "gymapp_class_reminder",        // params: [nombre, clase, hora]
  CHURN_WIN_BACK: "gymapp_win_back",             // params: [nombre, oferta]
} as const

export type WATemplate = typeof WA_TEMPLATES[keyof typeof WA_TEMPLATES]

function getTwilioClient(): twilio.Twilio {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no configurados")
  }
  return twilio(accountSid, authToken)
}

function getTwilioWhatsAppFrom(): string {
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!from) throw new Error("TWILIO_WHATSAPP_FROM no configurado")
  return `whatsapp:${from}`
}

/**
 * Envía un mensaje de WhatsApp usando un template aprobado.
 *
 * @param to - Número en formato E.164: "+5491155443322"
 * @param templateName - Nombre del template de Twilio Content API
 * @param params - Array de strings para rellenar el template en orden
 */
export async function sendWhatsApp(
  to: string,
  templateName: string,
  params: string[]
): Promise<{ messageId: string | null; error: string | null }> {
  // Validar número de teléfono básico
  const cleaned = to.replace(/\s/g, "")
  if (!cleaned.startsWith("+")) {
    return { messageId: null, error: "El número debe estar en formato E.164 (+5491155443322)" }
  }

  try {
    const client = getTwilioClient()
    const from = getTwilioWhatsAppFrom()

    // Construir el cuerpo con los params interpolados en el template
    // Formato de Twilio Content API: {{1}}, {{2}}, etc.
    const bodyTemplate = getTemplateBody(templateName)
    const body = params.reduce(
      (text, param, i) => text.replace(`{{${i + 1}}}`, param),
      bodyTemplate
    )

    const message = await client.messages.create({
      from,
      to: `whatsapp:${cleaned}`,
      body,
    })

    return { messageId: message.sid, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al enviar WhatsApp"
    return { messageId: null, error: msg }
  }
}

// Templates locales de fallback (en producción usar Content API de Twilio)
function getTemplateBody(templateName: string): string {
  const templates: Record<string, string> = {
    [WA_TEMPLATES.PAYMENT_FAILED]:
      "Hola {{1}}, tu pago de ${{2}} no pudo procesarse. Actualizá tu método de pago aquí: {{3}}",
    [WA_TEMPLATES.PAYMENT_SUCCESS]:
      "Hola {{1}}, tu pago de ${{2}} fue acreditado el {{3}}. Gracias por renovar tu membresía.",
    [WA_TEMPLATES.BOOKING_CONFIRMED]:
      "Hola {{1}}, tu reserva para *{{2}}* el {{3}} a las {{4}} en {{5}} está confirmada.",
    [WA_TEMPLATES.CLASS_REMINDER]:
      "Hola {{1}}, recordatorio: tenés *{{2}}* en 1 hora ({{3}}). ¡Te esperamos!",
    [WA_TEMPLATES.CHURN_WIN_BACK]:
      "Hola {{1}}, te extrañamos. Tenemos una oferta especial para vos: {{2}}. Escribinos para más info.",
  }
  return templates[templateName] ?? "Mensaje de GymApp: {{1}}"
}
