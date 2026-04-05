import crypto from "crypto"

function getQRSecret(): string {
  const secret = process.env.QR_HMAC_SECRET
  if (!secret) throw new Error("QR_HMAC_SECRET no configurado")
  return secret
}

/**
 * Genera un token QR dinámico para un socio.
 * El token es un HMAC-SHA256 de `gymId:memberId:minuteWindow`.
 * minuteWindow = Math.floor(Date.now() / 60000) → cambia cada 60 segundos.
 *
 * IMPORTANTE: Este token NUNCA se persiste en la base de datos.
 * Se genera fresh en cada request y se valida comparando HMAC.
 */
export function generateQRToken(gymId: string, memberId: string): string {
  const minuteWindow = Math.floor(Date.now() / 60000)
  const payload = `${gymId}:${memberId}:${minuteWindow}`
  const hmac = crypto.createHmac("sha256", getQRSecret())
  hmac.update(payload)
  const signature = hmac.digest("hex")
  // Token = base64(payload):signature
  const encoded = Buffer.from(payload).toString("base64url")
  return `${encoded}.${signature}`
}

/**
 * Verifica un token QR.
 * Acepta una ventana de ±60 segundos (1 minuto anterior y 1 posterior)
 * para compensar desfases de reloj.
 */
export function verifyQRToken(
  token: string,
  gymId: string,
  memberId: string
): { valid: boolean; reason?: string } {
  if (!token || !token.includes(".")) {
    return { valid: false, reason: "INVALID_TOKEN_FORMAT" }
  }

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    return { valid: false, reason: "INVALID_TOKEN_FORMAT" }
  }

  let decodedPayload: string
  try {
    decodedPayload = Buffer.from(encodedPayload, "base64url").toString("utf8")
  } catch {
    return { valid: false, reason: "INVALID_TOKEN_ENCODING" }
  }

  const parts = decodedPayload.split(":")
  if (parts.length !== 3) {
    return { valid: false, reason: "INVALID_TOKEN_STRUCTURE" }
  }

  const [tokenGymId, tokenMemberId, tokenMinuteStr] = parts
  const tokenMinute = parseInt(tokenMinuteStr ?? "", 10)

  if (isNaN(tokenMinute)) {
    return { valid: false, reason: "INVALID_TOKEN_TIMESTAMP" }
  }

  // Verificar que gymId y memberId coincidan
  if (tokenGymId !== gymId || tokenMemberId !== memberId) {
    return { valid: false, reason: "TOKEN_MISMATCH" }
  }

  // Verificar ventana de tiempo: ±1 minuto
  const currentMinute = Math.floor(Date.now() / 60000)
  if (Math.abs(currentMinute - tokenMinute) > 1) {
    return { valid: false, reason: "TOKEN_EXPIRED" }
  }

  // Verificar firma HMAC
  const secret = getQRSecret()
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(decodedPayload)
  const expectedSig = hmac.digest("hex")

  const sigBuffer = Buffer.from(signature, "hex")
  const expectedBuffer = Buffer.from(expectedSig, "hex")

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "INVALID_SIGNATURE" }
  }

  const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  if (!isValid) {
    return { valid: false, reason: "INVALID_SIGNATURE" }
  }

  return { valid: true }
}
