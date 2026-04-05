import { MemberStatus, AccessMethod } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyQRToken } from "@/lib/qr"

interface ScanRequest {
  token: string
  gymId: string
  memberId: string
  deviceId?: string
  seatId?: string // ID de la sede desde donde se escanea (opcional)
}

interface ScanResponse {
  access: boolean
  memberName?: string
  reason?: string
}

// Esta ruta es llamada por el scanner (tablet/PC en la entrada)
// No requiere auth de Clerk — se autentica con deviceId del gym
export async function POST(req: NextRequest): Promise<NextResponse<ScanResponse>> {
  let body: ScanRequest
  try {
    body = (await req.json()) as ScanRequest
  } catch {
    return NextResponse.json({ access: false, reason: "INVALID_JSON" }, { status: 400 })
  }

  const { token, gymId, memberId, deviceId, seatId } = body

  if (!token || !gymId || !memberId) {
    return NextResponse.json({ access: false, reason: "MISSING_PARAMS" }, { status: 400 })
  }

  // Si se provee seatId, verificar que pertenece al gym y obtener su nfcReaderId
  let resolvedDeviceInfo: string | undefined = deviceId
  if (seatId) {
    const seat = await db.gymSeat.findFirst({
      where: { id: seatId, gymId },
      select: { nfcReaderId: true },
    })
    // Usar el nfcReaderId de la sede como deviceInfo si no se proveyó uno explícito
    if (seat?.nfcReaderId && !deviceId) {
      resolvedDeviceInfo = seat.nfcReaderId
    }
  }

  // Verificar que el gym existe y el deviceId es válido (si está configurado NFC)
  const gym = await db.gym.findUnique({
    where: { id: gymId },
    select: { id: true, nfcEnabled: true, nfcReaderId: true },
  })
  if (!gym) {
    return NextResponse.json({ access: false, reason: "GYM_NOT_FOUND" }, { status: 404 })
  }

  // Verificar token QR
  const verification = verifyQRToken(token, gymId, memberId)

  if (!verification.valid) {
    // Registrar intento fallido
    await db.accessLog.create({
      data: {
        gymId,
        memberId,
        method: AccessMethod.QR,
        success: false,
        failReason: verification.reason ?? "INVALID_TOKEN",
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
        deviceInfo: resolvedDeviceInfo,
      },
    })
    return NextResponse.json({ access: false, reason: verification.reason })
  }

  // Verificar membresía
  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      membershipPlan: {
        select: {
          accessDays: true,
          accessHourStart: true,
          accessHourEnd: true,
        },
      },
    },
  })

  if (!member) {
    await db.accessLog.create({
      data: {
        gymId,
        memberId,
        method: AccessMethod.QR,
        success: false,
        failReason: "MEMBER_NOT_FOUND",
        deviceInfo: resolvedDeviceInfo,
      },
    })
    return NextResponse.json({ access: false, reason: "MEMBER_NOT_FOUND" })
  }

  if (member.status === MemberStatus.SUSPENDED) {
    await db.accessLog.create({
      data: {
        gymId,
        memberId,
        method: AccessMethod.QR,
        success: false,
        failReason: "MEMBERSHIP_SUSPENDED",
        deviceInfo: resolvedDeviceInfo,
      },
    })
    return NextResponse.json({ access: false, reason: "MEMBERSHIP_SUSPENDED", memberName: `${member.firstName} ${member.lastName}` })
  }

  if (member.status === MemberStatus.CANCELLED) {
    await db.accessLog.create({
      data: {
        gymId,
        memberId,
        method: AccessMethod.QR,
        success: false,
        failReason: "MEMBERSHIP_CANCELLED",
        deviceInfo: resolvedDeviceInfo,
      },
    })
    return NextResponse.json({ access: false, reason: "MEMBERSHIP_CANCELLED", memberName: `${member.firstName} ${member.lastName}` })
  }

  // Verificar restricciones de horario y día del plan
  const now = new Date()
  const plan = member.membershipPlan

  if (plan.accessDays && plan.accessDays.length > 0) {
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
    const currentDay = dayNames[now.getDay()]
    if (!plan.accessDays.includes(currentDay ?? "")) {
      await db.accessLog.create({
        data: {
          gymId,
          memberId,
          method: AccessMethod.QR,
          success: false,
          failReason: "ACCESS_DAY_RESTRICTED",
          deviceInfo: resolvedDeviceInfo,
        },
      })
      return NextResponse.json({ access: false, reason: "ACCESS_DAY_RESTRICTED", memberName: `${member.firstName} ${member.lastName}` })
    }
  }

  if (plan.accessHourStart !== null && plan.accessHourEnd !== null) {
    const hour = now.getHours()
    const start = plan.accessHourStart ?? 0
    const end = plan.accessHourEnd ?? 23
    if (hour < start || hour > end) {
      await db.accessLog.create({
        data: {
          gymId,
          memberId,
          method: AccessMethod.QR,
          success: false,
          failReason: "ACCESS_HOUR_RESTRICTED",
          deviceInfo: resolvedDeviceInfo,
        },
      })
      return NextResponse.json({ access: false, reason: "ACCESS_HOUR_RESTRICTED", memberName: `${member.firstName} ${member.lastName}` })
    }
  }

  // Acceso permitido — registrar log
  await db.accessLog.create({
    data: {
      gymId,
      memberId,
      method: AccessMethod.QR,
      success: true,
      ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
      deviceInfo: deviceId ?? undefined,
    },
  })

  return NextResponse.json({
    access: true,
    memberName: `${member.firstName} ${member.lastName}`,
  })
}
