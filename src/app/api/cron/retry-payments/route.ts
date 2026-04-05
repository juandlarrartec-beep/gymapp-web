import { NextRequest, NextResponse } from "next/server"
import { runSmartRetry } from "@/lib/payments/retry"
import type { ApiResponse } from "@/lib/db"

// Protegido con CRON_SECRET — llamado por Vercel Cron o cron externo
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 })
  }

  try {
    const result = await runSmartRetry()
    console.log("[Cron] Smart retry completado:", result)
    return NextResponse.json({ data: result, error: null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    console.error("[Cron] Error en smart retry:", msg)
    return NextResponse.json({ data: null, error: msg }, { status: 500 })
  }
}
