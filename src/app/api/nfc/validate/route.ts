import { MemberStatus, AccessMethod } from "@prisma/client"
// POST /api/nfc/validate — RUTA PÚBLICA (sin auth de Clerk)
// Llamado por lectores NFC VTAP/ELATEC cuando un socio toca el celular
// CRÍTICO: debe responder en < 500ms (timeout del lector)
// Auth propia: verifica que el readerId está registrado para el gymId

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

interface NfcValidateRequest {
  passId: string    // "gymapp:{gymId}:{memberId}"
  readerId: string  // ID del lector NFC registrado
  gymId: string
}

interface NfcValidateResponse {
  access: boolean
  memberName?: string
  reason?: string
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<NfcValidateResponse>> {
  let body: NfcValidateRequest
  try {
    body = (await req.json()) as NfcValidateRequest
  } catch {
    return NextResponse.json({ access: false, reason: "INVALID_JSON" }, { status: 400 })
  }

  const { passId, readerId, gymId } = body

  if (!passId || !readerId || !gymId) {
    return NextResponse.json({ access: false, reason: "MISSING_PARAMS" }, { status: 400 })
  }

  // 1. Verificar que el readerId está autorizado para ese gymId
  // El lector puede estar registrado a nivel gym (nfcReaderId) o en una GymSeat
  const [gym, seat] = await Promise.all([
    db.gym.findFirst({
      where: { id: gymId, nfcEnabled: true },
      select: { id: true, nfcReaderId: true, plan: true },
    }),
    db.gymSeat.findFirst({
      where: { gymId, nfcReaderId: readerId },
      select: { id: true },
    }),
  ])

  if (!gym) {
    return NextResponse.json({ access: false, reason: "GYM_NOT_FOUND_OR_NFC_DISABLED" }, { status: 404 })
  }

  if (gym.plan !== "PRO") {
    return NextResponse.json({ access: false, reason: "NFC_REQUIRES_PRO_PLAN" }, { status: 403 })
  }

  const readerAuthorized = gym.nfcReaderId === readerId || seat !== null
  if (!readerAuthorized) {
    return NextResponse.json({ access: false, reason: "READER_NOT_AUTHORIZED" }, { status: 403 })
  }

  // 2. Parsear passId: "gymapp:{gymId}:{memberId}"
  const parts = passId.split(":")
  if (parts.length !== 3 || parts[0] !== "gymapp") {
    return NextResponse.json({ access: false, reason: "INVALID_PASS_ID_FORMAT" }, { status: 400 })
  }

  const passGymId = parts[1]
  const memberId = parts[2]

  if (!passGymId || !memberId) {
    return NextResponse.json({ access: false, reason: "INVALID_PASS_ID_FORMAT" }, { status: 400 })
  }

  // 3. Verificar que el passGymId coincide con el gymId del request
  if (passGymId !== gymId) {
    await db.accessLog.create({
      data: {
        gymId,
        memberId: memberId,
        method: AccessMethod.NFC,
        success: false,
        failReason: "CROSS_GYM_ACCESS_ATTEMPT",
        deviceInfo: readerId,
      },
    })
    return NextResponse.json({ access: false, reason: "CROSS_GYM_ACCESS_ATTEMPT" })
  }

  // 4. Verificar que el memberId pertenece al gymId
  const member = await db.member.findFirst({
    where: { id: memberId, gymId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  })

  if (!member) {
    return NextResponse.json({ access: false, reason: "MEMBER_NOT_FOUND" })
  }

  // 5. Verificar Member.status === 'ACTIVE'
  if (member.status !== MemberStatus.ACTIVE) {
    // Razón específica por status
    const failReason =
      member.status === MemberStatus.SUSPENDED
        ? "MEMBERSHIP_SUSPENDED"
        : member.status === MemberStatus.CANCELLED
        ? "MEMBERSHIP_CANCELLED"
        : "MEMBERSHIP_FROZEN"

    // 5a. INSERT en AccessLog — solo INSERT, nunca UPDATE/DELETE
    await db.accessLog.create({
      data: {
        gymId,
        memberId: member.id,
        method: AccessMethod.NFC,
        success: false,
        failReason,
        deviceInfo: readerId,
        ...(seat ? {} : {}), // seatId se podría agregar cuando el schema lo soporte en AccessLog
      },
    })

    return NextResponse.json({
      access: false,
      reason: failReason,
      memberName: `${member.firstName} ${member.lastName}`,
    })
  }

  // 6. Acceso concedido — INSERT en AccessLog
  await db.accessLog.create({
    data: {
      gymId,
      memberId: member.id,
      method: AccessMethod.NFC,
      success: true,
      deviceInfo: readerId,
    },
  })

  // 7. Responder con acceso concedido
  return NextResponse.json({
    access: true,
    memberName: `${member.firstName} ${member.lastName}`,
  })
}
