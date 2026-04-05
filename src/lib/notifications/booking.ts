import { sendWhatsApp, WA_TEMPLATES } from "@/lib/whatsapp"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MemberBasic {
  firstName: string
  phone: string | null
}

interface ClassScheduleBasic {
  name: string
  startTime: Date
  location: string | null
}

/**
 * Notificar al socio que su reserva fue confirmada.
 * Se integra en el endpoint de booking (POST /classes/[classId]/book)
 */
export async function notifyBookingConfirmed(
  member: MemberBasic,
  classSchedule: ClassScheduleBasic
): Promise<void> {
  if (!member.phone) return

  const fecha = format(classSchedule.startTime, "EEEE d 'de' MMMM", { locale: es })
  const hora = format(classSchedule.startTime, "HH:mm")
  const lugar = classSchedule.location ?? "el gym"

  const result = await sendWhatsApp(member.phone, WA_TEMPLATES.BOOKING_CONFIRMED, [
    member.firstName,
    classSchedule.name,
    fecha,
    hora,
    lugar,
  ])

  if (result.error) {
    console.error(`[WhatsApp] Error al notificar booking a ${member.firstName}:`, result.error)
  }
}

/**
 * Notificar al socio el recordatorio de clase 1 hora antes.
 * Se integra en el cron class-reminders (Fase 6)
 */
export async function notifyClassReminder(
  member: MemberBasic,
  classSchedule: ClassScheduleBasic
): Promise<void> {
  if (!member.phone) return

  const hora = format(classSchedule.startTime, "HH:mm")

  const result = await sendWhatsApp(member.phone, WA_TEMPLATES.CLASS_REMINDER, [
    member.firstName,
    classSchedule.name,
    hora,
  ])

  if (result.error) {
    console.error(`[WhatsApp] Error al enviar reminder de clase a ${member.firstName}:`, result.error)
  }
}
