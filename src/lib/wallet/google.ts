// Genera JWT para Google Wallet — Generic Object API
// NUNCA llamar desde el cliente — solo desde rutas de API server-side

// Variables de entorno requeridas:
// GOOGLE_WALLET_ISSUER_ID           — Issuer ID obtenido en Google Pay & Wallet Console
// GOOGLE_WALLET_SERVICE_ACCOUNT_KEY — JSON stringificado del service account key

import { GoogleAuth } from "google-auth-library"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export type GoogleWalletPassResult = {
  saveUrl: string  // URL para que el socio guarda el pass
  objectId: string // ID del objeto en Google Wallet
}

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1"
const SAVE_URL_BASE = "https://pay.google.com/gp/v/save"

function getWalletAuth(): GoogleAuth {
  const keyJson = process.env["GOOGLE_WALLET_SERVICE_ACCOUNT_KEY"]
  if (!keyJson) throw new Error("GOOGLE_WALLET_SERVICE_ACCOUNT_KEY no configurada")

  return new GoogleAuth({
    credentials: JSON.parse(keyJson) as Record<string, string>,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  })
}

function getIssuerId(): string {
  const id = process.env["GOOGLE_WALLET_ISSUER_ID"]
  if (!id) throw new Error("GOOGLE_WALLET_ISSUER_ID no configurada")
  return id
}

export async function generateGooglePass(
  memberId: string,
  gymId: string
): Promise<GoogleWalletPassResult> {
  // 1. Obtener datos del socio y gym
  const [member, gym] = await Promise.all([
    db.member.findFirst({
      where: { id: memberId, gymId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nextPaymentDate: true,
        status: true,
        membershipPlan: { select: { name: true } },
      },
    }),
    db.gym.findUnique({
      where: { id: gymId },
      select: {
        id: true,
        name: true,
        appName: true,
        primaryColor: true,
        logoUrl: true,
        plan: true,
      },
    }),
  ])

  if (!member) throw new Error(`Socio no encontrado: ${memberId}`)
  if (!gym) throw new Error(`Gym no encontrado: ${gymId}`)
  if (gym.plan !== "PRO") throw new Error("NFC/Wallet requiere plan PRO")

  const issuerId = getIssuerId()
  const objectId = `${issuerId}.${gymId}-${memberId}`
  const gymDisplayName = gym.appName ?? gym.name
  const validUntil = format(member.nextPaymentDate, "dd/MM/yyyy", { locale: es })

  // 2. Crear Generic Class si no existe (idempotente)
  const classId = `${issuerId}.gymapp-${gymId}`
  await upsertGenericClass(classId, gym, gymDisplayName)

  // 3. Crear Generic Object con datos del socio
  const genericObject = {
    id: objectId,
    classId,
    state: member.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED",
    cardTitle: {
      defaultValue: { language: "es", value: gymDisplayName },
    },
    subheader: {
      defaultValue: { language: "es", value: "SOCIO" },
    },
    header: {
      defaultValue: {
        language: "es",
        value: `${member.firstName} ${member.lastName}`,
      },
    },
    textModulesData: [
      {
        id: "plan",
        header: "PLAN",
        body: member.membershipPlan.name,
      },
      {
        id: "valid_until",
        header: "VÁLIDO HASTA",
        body: validUntil,
      },
      {
        id: "status",
        header: "ESTADO",
        body: member.status === "ACTIVE" ? "ACTIVO" : "SUSPENDIDO",
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: `gymapp:${gymId}:${memberId}`,
      alternateText: `${member.firstName} ${member.lastName}`,
    },
    hexBackgroundColor: gym.primaryColor ?? "#6366f1",
    ...(gym.logoUrl && {
      logo: {
        sourceUri: { uri: gym.logoUrl },
        contentDescription: { defaultValue: { language: "es", value: gymDisplayName } },
      },
    }),
  }

  // Upsert del objeto (PUT crea o actualiza)
  const auth = getWalletAuth()
  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()
  const token = typeof accessToken === "string" ? accessToken : (accessToken as { token?: string }).token

  const putRes = await fetch(`${WALLET_API_BASE}/genericObject/${encodeURIComponent(objectId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(genericObject),
  })

  // Si no existe (404), crear con POST
  if (!putRes.ok && putRes.status === 404) {
    const postRes = await fetch(`${WALLET_API_BASE}/genericObject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(genericObject),
    })
    if (!postRes.ok) {
      const errText = await postRes.text()
      throw new Error(`Google Wallet API error: ${errText}`)
    }
  } else if (!putRes.ok) {
    const errText = await putRes.text()
    throw new Error(`Google Wallet API error: ${errText}`)
  }

  // 4. Generar JWT para el save link
  const serviceAccountKey = JSON.parse(process.env["GOOGLE_WALLET_SERVICE_ACCOUNT_KEY"] ?? "{}") as {
    client_email?: string
    private_key?: string
  }

  const claims = {
    iss: serviceAccountKey.client_email ?? "",
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      genericObjects: [{ id: objectId }],
    },
  }

  // Firmar JWT con la clave privada del service account
  const jwt = await signJwt(claims, serviceAccountKey.private_key ?? "")
  const saveUrl = `${SAVE_URL_BASE}/${jwt}`

  return { saveUrl, objectId }
}

export async function updateGooglePassStatus(
  objectId: string,
  status: "ACTIVE" | "SUSPENDED"
): Promise<void> {
  const auth = getWalletAuth()
  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()
  const token = typeof accessToken === "string" ? accessToken : (accessToken as { token?: string }).token

  const patch = {
    state: status,
    textModulesData: [
      {
        id: "status",
        header: "ESTADO",
        body: status === "ACTIVE" ? "ACTIVO" : "SUSPENDIDO",
      },
    ],
    hexBackgroundColor: status === "ACTIVE" ? undefined : "#64748b",
  }

  const res = await fetch(
    `${WALLET_API_BASE}/genericObject/${encodeURIComponent(objectId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Error actualizando Google Wallet pass: ${errText}`)
  }
}

// Crea o actualiza la Generic Class del gym (base compartida por todos los socios)
async function upsertGenericClass(
  classId: string,
  gym: { name: string; appName: string | null; primaryColor: string | null; logoUrl: string | null },
  gymDisplayName: string
): Promise<void> {
  const auth = getWalletAuth()
  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()
  const token = typeof accessToken === "string" ? accessToken : (accessToken as { token?: string }).token

  const genericClass = {
    id: classId,
    issuerName: gymDisplayName,
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: gym.primaryColor ?? "#6366f1",
    ...(gym.logoUrl && {
      logo: {
        sourceUri: { uri: gym.logoUrl },
        contentDescription: { defaultValue: { language: "es", value: gymDisplayName } },
      },
    }),
  }

  // Intentar GET — si no existe, crear con POST
  const getRes = await fetch(`${WALLET_API_BASE}/genericClass/${encodeURIComponent(classId)}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  })

  if (getRes.status === 404) {
    await fetch(`${WALLET_API_BASE}/genericClass`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(genericClass),
    })
  }
  // Si existe, no actualizamos la clase para no interferir con aprobaciones de Google
}

// Firma un JWT con RS256 usando la clave privada del service account
async function signJwt(payload: Record<string, unknown>, privateKeyPem: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" }

  const encodeBase64Url = (obj: unknown): string =>
    Buffer.from(JSON.stringify(obj)).toString("base64url")

  const headerB64 = encodeBase64Url(header)
  const payloadB64 = encodeBase64Url(payload)
  const signingInput = `${headerB64}.${payloadB64}`

  // Importar clave privada para WebCrypto
  const keyBuffer = pemToBuffer(privateKeyPem)
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    Buffer.from(signingInput)
  )

  const sigB64 = Buffer.from(signature).toString("base64url")
  return `${signingInput}.${sigB64}`
}

// Convierte PEM a ArrayBuffer para WebCrypto
function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "")
  const buf = Buffer.from(b64, "base64")
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}
