import { ChurnRisk } from "@prisma/client"

export interface ChurnFactors {
  daysSinceLastVisit: number
  paymentFailCount: number
  attendanceDropRate: number  // 0-100, porcentaje de caída vs mes anterior
  appInactiveDays: number
  classNoShowCount: number
  membershipAgeDays: number
}

export interface ChurnScoreResult {
  riskScore: number          // 0-100
  riskLevel: ChurnRisk
  suggestedAction: string
  factors: ChurnFactors
}

/**
 * Calcula el score de churn según los factores de comportamiento.
 *
 * Scoring rules:
 *   daysSinceLastVisit > 30  → +40
 *   daysSinceLastVisit > 14  → +20
 *   paymentFailCount >= 2    → +30
 *   attendanceDropRate > 50% → +20
 *   appInactiveDays > 14     → +10
 *
 * Risk levels:
 *   score >= 60 → HIGH
 *   score >= 30 → MEDIUM
 *   else        → LOW
 */
export function calculateChurnScore(factors: ChurnFactors): ChurnScoreResult {
  let score = 0

  // Factor: días sin visitar
  if (factors.daysSinceLastVisit > 30) {
    score += 40
  } else if (factors.daysSinceLastVisit > 14) {
    score += 20
  }

  // Factor: pagos fallidos recientes
  if (factors.paymentFailCount >= 2) {
    score += 30
  } else if (factors.paymentFailCount === 1) {
    score += 10
  }

  // Factor: caída en asistencia vs mes anterior
  if (factors.attendanceDropRate > 50) {
    score += 20
  } else if (factors.attendanceDropRate > 25) {
    score += 10
  }

  // Factor: inactividad en app
  if (factors.appInactiveDays > 14) {
    score += 10
  }

  // Factor: no-shows en clases (bonus menor)
  if (factors.classNoShowCount >= 3) {
    score += 5
  }

  // Cap a 100
  score = Math.min(100, score)

  // Determinar nivel de riesgo
  let riskLevel: ChurnRisk
  let suggestedAction: string

  if (score >= 60) {
    riskLevel = "HIGH"
    if (factors.paymentFailCount >= 2) {
      suggestedAction = "Contactar urgente — cobro pendiente. Ofrecer facilidad de pago."
    } else if (factors.daysSinceLastVisit > 30) {
      suggestedAction = "Llamar al socio — lleva más de 30 días sin visitar. Ofrecer clase gratis."
    } else {
      suggestedAction = "Enviar oferta de retención personalizada."
    }
  } else if (score >= 30) {
    riskLevel = "MEDIUM"
    if (factors.attendanceDropRate > 50) {
      suggestedAction = "Enviar mensaje motivacional. Asignar rutina nueva."
    } else {
      suggestedAction = "Enviar WhatsApp recordando beneficios. Monitorear próximos 7 días."
    }
  } else {
    riskLevel = "LOW"
    suggestedAction = "Sin acción requerida — socio activo."
  }

  return {
    riskScore: score,
    riskLevel,
    suggestedAction,
    factors,
  }
}
