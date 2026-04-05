// Actualiza el estado del wallet pass cuando cambia Member.status
// Llamar desde: smart retry (bloqueo/reactivación) y Server Actions del dueño

import { db } from "@/lib/db"
import { updateGooglePassStatus } from "./google"

// APNs: notifica a Apple para que el dispositivo del socio recargue el pass
// Requiere: APPLE_WALLET_APN_KEY_PEM, APPLE_WALLET_APN_KEY_ID, APPLE_WALLET_TEAM_ID
async function notifyAppleWalletUpdate(
  pushToken: string,
  passTypeIdentifier: string
): Promise<void> {
  const keyPem = process.env["APPLE_WALLET_APN_KEY_PEM"]
  const keyId = process.env["APPLE_WALLET_APN_KEY_ID"]
  const teamId = process.env["APPLE_WALLET_TEAM_ID"]

  if (!keyPem || !keyId || !teamId) {
    // En dev, loguear que falta config APNs pero no bloquear
    console.warn("[wallet/update] APNs no configurado — skipping push notification")
    return
  }

  // APNs HTTP/2 push para Wallet (sin payload — Apple descarga el pass actualizado)
  const host = "api.push.apple.com"
  const path = `/3/device/${pushToken}`

  // Generar JWT para APNs (firmado con ES256)
  const jwtToken = await generateApnsJwt(keyPem, keyId, teamId)

  await fetch(`https://${host}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      "apns-push-type": "background",
      "apns-topic": `${passTypeIdentifier}.voip`,
      "apns-priority": "5",
    },
    body: JSON.stringify({}),
  })
}

// Genera JWT ES256 para APNs
async function generateApnsJwt(
  keyPem: string,
  keyId: string,
  teamId: string
): Promise<string> {
  const header = { alg: "ES256", kid: keyId }
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) }

  const encodeB64 = (obj: unknown): string =>
    Buffer.from(JSON.stringify(obj)).toString("base64url")

  const headerB64 = encodeB64(header)
  const payloadB64 = encodeB64(payload)
  const signingInput = `${headerB64}.${payloadB64}`

  // Importar clave EC privada
  const b64 = keyPem
    .replace(/-----BEGIN EC PRIVATE KEY-----/, "")
    .replace(/-----END EC PRIVATE KEY-----/, "")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "")
  const keyBuffer = Buffer.from(b64, "base64")

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    Buffer.from(signingInput)
  )

  return `${signingInput}.${Buffer.from(signature).toString("base64url")}`
}

export async function updateWalletPassStatus(
  memberId: string,
  newStatus: "ACTIVE" | "SUSPENDED"
): Promise<void> {
  const member = await db.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      walletPassId: true,
      gymId: true,
    },
  })

  if (!member?.walletPassId) return // sin pass generado, nada que actualizar

  const errors: string[] = []

  // Apple Wallet: notificar via APNs para que el dispositivo recargue el pass
  // El walletPassId para Apple es el pushToken del dispositivo
  try {
    const passTypeId =
      process.env["APPLE_WALLET_PASS_TYPE_ID"] ?? "pass.com.gymapp.membership"
    await notifyAppleWalletUpdate(member.walletPassId, passTypeId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    errors.push(`Apple Wallet APNs: ${msg}`)
    console.error("[wallet/update] Apple APNs error:", msg)
  }

  // Google Wallet: actualizar estado del objeto via API REST
  // El walletPassId para Google tiene formato "issuerId.gymId-memberId"
  try {
    const issuerId = process.env["GOOGLE_WALLET_ISSUER_ID"]
    if (issuerId) {
      const googleObjectId = `${issuerId}.${member.gymId}-${memberId}`
      await updateGooglePassStatus(googleObjectId, newStatus)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    errors.push(`Google Wallet: ${msg}`)
    console.error("[wallet/update] Google Wallet error:", msg)
  }

  if (errors.length > 0) {
    // Loguear pero no lanzar — el update del pass no debe bloquear el flujo principal
    console.warn("[wallet/update] Errores no críticos:", errors)
  }
}
