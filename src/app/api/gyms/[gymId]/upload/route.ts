// POST /api/gyms/[gymId]/upload
// Recibe imagen, la sube a Cloudflare R2, devuelve URL pública
// Requiere env vars:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ gymId: string }>
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { gymId } = await params

  const gym = await db.gym.findFirst({
    where: { id: gymId, clerkOrgId: orgId },
    select: { id: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym no encontrado" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Archivo no encontrado en el form" }, { status: 400 })
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Solo se aceptan imágenes JPG, PNG o WebP" },
      { status: 400 }
    )
  }

  // Validar tamaño
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "El archivo no puede superar 5MB" },
      { status: 400 }
    )
  }

  // Validar variables de entorno R2
  const accountId = process.env["R2_ACCOUNT_ID"]
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"]
  const secretKey = process.env["R2_SECRET_ACCESS_KEY"]
  const bucketName = process.env["R2_BUCKET_NAME"]
  const publicUrl = process.env["R2_PUBLIC_URL"]

  if (!accountId || !accessKeyId || !secretKey || !bucketName || !publicUrl) {
    console.error("[upload] Faltan variables de entorno de Cloudflare R2")
    return NextResponse.json(
      { error: "Almacenamiento no configurado en el servidor" },
      { status: 500 }
    )
  }

  // Generar nombre único del archivo
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp"
  const filename = `gyms/${gymId}/${Date.now()}-logo.${ext}`

  // Subir a Cloudflare R2 via S3-compatible API
  const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`
  const uploadUrl = `${r2Endpoint}/${bucketName}/${filename}`

  const arrayBuffer = await file.arrayBuffer()

  // Generar firma AWS Signature v4 para R2
  const headers = await buildR2Headers({
    method: "PUT",
    url: uploadUrl,
    contentType: file.type,
    contentLength: file.size,
    accessKeyId,
    secretKey,
    region: "auto",
    service: "s3",
    bucketName,
    filename,
  })

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: arrayBuffer,
  })

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    console.error("[upload] R2 error:", errText)
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 })
  }

  const fileUrl = `${publicUrl}/${filename}`
  return NextResponse.json({ data: { url: fileUrl }, error: null })
}

// Genera los headers requeridos por la API S3-compatible de Cloudflare R2
// Implementación AWS Signature v4
async function buildR2Headers(opts: {
  method: string
  url: string
  contentType: string
  contentLength: number
  accessKeyId: string
  secretKey: string
  region: string
  service: string
  bucketName: string
  filename: string
}): Promise<Record<string, string>> {
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"
  const dateStamp = amzDate.slice(0, 8)

  const host = new URL(opts.url).host

  const canonicalHeaders = [
    `content-type:${opts.contentType}`,
    `host:${host}`,
    `x-amz-date:${amzDate}`,
  ].join("\n") + "\n"

  const signedHeaders = "content-type;host;x-amz-date"
  const hashedPayload = "UNSIGNED-PAYLOAD"

  const canonicalUri = `/${opts.bucketName}/${opts.filename}`
  const canonicalRequest = [
    opts.method,
    canonicalUri,
    "", // query string vacío
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n")

  const credentialScope = `${dateStamp}/${opts.region}/${opts.service}/aws4_request`
  const canonicalRequestHash = await sha256Hex(canonicalRequest)

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n")

  // Derivar signing key
  const signingKey = await deriveSigningKey(opts.secretKey, dateStamp, opts.region, opts.service)
  const signature = await hmacHex(signingKey, stringToSign)

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ")

  return {
    "Content-Type": opts.contentType,
    "x-amz-date": amzDate,
    Authorization: authorization,
    "x-amz-content-sha256": hashedPayload,
  }
}

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded)
  return Buffer.from(hashBuffer).toString("hex")
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data))
  return Buffer.from(sig).toString("hex")
}

async function hmacRaw(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const keyBuffer = typeof key === "string" ? new TextEncoder().encode(key) : key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data))
}

async function deriveSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacRaw(`AWS4${secretKey}`, dateStamp)
  const kRegion = await hmacRaw(kDate, region)
  const kService = await hmacRaw(kRegion, service)
  return hmacRaw(kService, "aws4_request")
}
