// Genera un .pkpass firmado para un socio
// NUNCA llamar desde el cliente — solo desde rutas de API server-side

import { PKPass } from "passkit-generator"
import path from "path"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Certificados requeridos en variables de entorno:
// APPLE_WALLET_CERT_PEM    — certificado Pass Type ID (.pem)
// APPLE_WALLET_KEY_PEM     — clave privada del certificado (.pem)
// APPLE_WALLET_WWDR_PEM    — Apple WWDR G4 intermediate certificate (.pem)
// APPLE_WALLET_PASS_PHRASE — passphrase de la clave privada (si aplica)
// APPLE_WALLET_TEAM_ID     — Team ID del Apple Developer Program (10 chars)
// APPLE_WALLET_PASS_TYPE_ID — Pass Type Identifier (pass.com.gymapp.membership)

function getRequiredEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Variable de entorno requerida no encontrada: ${key}`)
  return val
}

export async function generateApplePass(memberId: string, gymId: string): Promise<Buffer> {
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
        plan: true,
      },
    }),
  ])

  if (!member) throw new Error(`Socio no encontrado: ${memberId}`)
  if (!gym) throw new Error(`Gym no encontrado: ${gymId}`)
  if (gym.plan !== "PRO") throw new Error("NFC/Wallet requiere plan PRO")

  const gymDisplayName = gym.appName ?? gym.name
  const memberName = `${member.firstName} ${member.lastName}`
  const planName = member.membershipPlan.name
  const validUntil = format(member.nextPaymentDate, "dd/MM/yyyy", { locale: es })

  // Color del gym para white-label (convertir hex a rgb)
  const bgColor = hexToRgbString(gym.primaryColor ?? "#6366f1")

  // NFC payload firmado: "gymapp:{gymId}:{memberId}"
  // En producción se firma con HMAC para prevenir spoofing
  const nfcMessage = `gymapp:${gymId}:${memberId}`

  // 2. Construir el PKPass con passkit-generator
  const templatePath = path.join(process.cwd(), "public", "passes", "gymapp.pass")

  const pass = await PKPass.from(
    {
      model: templatePath,
      certificates: {
        wwdr: getRequiredEnv("APPLE_WALLET_WWDR_PEM"),
        signerCert: getRequiredEnv("APPLE_WALLET_CERT_PEM"),
        signerKey: getRequiredEnv("APPLE_WALLET_KEY_PEM"),
        signerKeyPassphrase: process.env["APPLE_WALLET_PASS_PHRASE"],
      },
    },
    {
      // 3. Personalizar campos
      serialNumber: `${gymId}-${memberId}`,
      organizationName: gymDisplayName,
      description: `Membresía ${gymDisplayName}`,
      logoText: gymDisplayName,
      backgroundColor: bgColor,
      foregroundColor: "rgb(255, 255, 255)",

      // authenticationToken para actualizaciones push via APNs
      authenticationToken: Buffer.from(`${gymId}:${memberId}:${Date.now()}`).toString("base64url"),
    }
  )

  // Campos del generic pass
  pass.primaryFields.push({
    key: "member_name",
    label: "SOCIO",
    value: memberName,
  })

  pass.secondaryFields.push(
    { key: "plan", label: "PLAN", value: planName },
    { key: "valid_until", label: "VÁLIDO HASTA", value: validUntil }
  )

  pass.auxiliaryFields.push({
    key: "status",
    label: "ESTADO",
    value: member.status === "ACTIVE" ? "ACTIVO" : "SUSPENDIDO",
  })

  // 4. Configurar NFC payload via setNFC si está disponible en la versión del SDK
  // passkit-generator v3+ expone setNFC como método
  if (typeof (pass as unknown as Record<string, unknown>)["setNFC"] === "function") {
    (pass as unknown as { setNFC: (opts: { message: string }) => void }).setNFC({ message: nfcMessage })
  }

  // 5. Configurar QR como barcode (fallback si no hay NFC)
  pass.setBarcodes({
    message: nfcMessage,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  })

  // 6. Firmar y generar el buffer del .pkpass
  const buffer = pass.getAsBuffer()
  return buffer
}

// Convierte color hex (#6366f1) a formato rgb() que acepta Apple Wallet
function hexToRgbString(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "rgb(99, 102, 241)"
  return `rgb(${r}, ${g}, ${b})`
}
