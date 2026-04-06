/**
 * GymApp — Seed de datos DEMO
 * Genera un gym de demostración completo para mostrar a clientes potenciales.
 * Gym: "CrossFit Impulso" — Buenos Aires, Argentina
 *
 * Uso: npx tsx prisma/seed-demo.ts
 */

import { PrismaClient, MemberStatus, PaymentStatus, PaymentProvider, AccessMethod, ChurnRisk } from "@prisma/client"

const db = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function monthsAgo(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

// ─── Datos ficticios ─────────────────────────────────────────────────────────

const firstNames = ["Martín", "Lucía", "Diego", "Valentina", "Nicolás", "Camila", "Gonzalo", "Sofía", "Matías", "Ana", "Franco", "Paula", "Sebastián", "María", "Ignacio", "Florencia", "Agustín", "Carolina", "Ezequiel", "Romina", "Leandro", "Natalia", "Tomás", "Julieta", "Rodrigo"]
const lastNames = ["García", "Martínez", "López", "González", "Rodríguez", "Pérez", "Fernández", "Gómez", "Sánchez", "Díaz", "Torres", "Álvarez", "Ruiz", "Morales", "Herrera", "Castro", "Jiménez", "Vargas", "Ramos", "Ortega"]

async function main() {
  console.log("🏋️  Iniciando seed de datos DEMO...")

  // ─── 1. Crear el Gym demo ────────────────────────────────────────────────
  const gym = await db.gym.upsert({
    where: { slug: "crossfit-impulso-demo" },
    update: {},
    create: {
      name: "CrossFit Impulso",
      slug: "crossfit-impulso-demo",
      country: "AR",
      currency: "ARS",
      timezone: "America/Argentina/Buenos_Aires",
      clerkOrgId: null, // demo — sin org de Clerk
      address: "Av. Corrientes 1234, CABA",
      phone: "+54 11 4567-8900",
      email: "hola@crossfitimpulso.com",
      paymentProvider: PaymentProvider.MERCADOPAGO,
      primaryColor: "#6366f1",
    },
  })
  console.log(`✅ Gym creado: ${gym.name} (ID: ${gym.id})`)

  // ─── 2. Crear planes de membresía ────────────────────────────────────────
  const planMensual = await db.membershipPlan.create({
    data: {
      gymId: gym.id,
      name: "Plan Mensual",
      priceAmount: 1800000, // $18.000 ARS en centavos
      currency: "ARS",
      durationDays: 30,
      isActive: true,
    },
  })

  const planTrimestral = await db.membershipPlan.create({
    data: {
      gymId: gym.id,
      name: "Plan Trimestral",
      priceAmount: 4800000, // $48.000 ARS
      currency: "ARS",
      durationDays: 90,
      isActive: true,
    },
  })

  const planAnual = await db.membershipPlan.create({
    data: {
      gymId: gym.id,
      name: "Plan Anual Premium",
      priceAmount: 17000000, // $170.000 ARS
      currency: "ARS",
      durationDays: 365,
      isActive: true,
    },
  })

  console.log("✅ Planes de membresía creados")

  // ─── 3. Crear trainer de demo ─────────────────────────────────────────────
  const trainer = await db.trainer.create({
    data: {
      gymId: gym.id,
      firstName: "Lucas",
      lastName: "Ramírez",
      email: "lucas.ramirez@crossfitimpulso.com",
      specialty: "CrossFit y Funcional",
      isActive: true,
    },
  })
  console.log("✅ Trainer creado")

  // ─── 4. Crear 150 socios con distribución realista ────────────────────────
  const plans = [planMensual, planMensual, planMensual, planTrimestral, planTrimestral, planAnual]
  const members = []

  for (let i = 0; i < 150; i++) {
    const firstName = randomItem(firstNames)
    const lastName = randomItem(lastNames)
    const plan = randomItem(plans)

    // Distribución de estados: 132 activos, 8 suspendidos, 5 cancelados, 5 congelados
    let status: MemberStatus
    if (i < 132) status = MemberStatus.ACTIVE
    else if (i < 140) status = MemberStatus.SUSPENDED
    else if (i < 145) status = MemberStatus.CANCELLED
    else status = MemberStatus.FROZEN

    // Fechas de alta distribuidas en los últimos 18 meses
    const joinedMonthsAgo = randomBetween(0, 18)
    const createdAt = monthsAgo(joinedMonthsAgo)

    // Fecha de próximo pago
    const nextPaymentDate = status === MemberStatus.SUSPENDED
      ? daysAgo(randomBetween(5, 30)) // vencidos
      : status === MemberStatus.ACTIVE
        ? daysFromNow(randomBetween(1, 30))
        : daysAgo(randomBetween(30, 90))

    const member = await db.member.create({
      data: {
        gymId: gym.id,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@demo.gym`,
        phone: `+54 11 ${randomBetween(4000, 6999)}-${randomBetween(1000, 9999)}`,
        status,
        membershipPlanId: plan.id,
        startDate: createdAt,
        nextPaymentDate,
        cancellationDate: status === MemberStatus.CANCELLED ? daysAgo(randomBetween(10, 60)) : null,
        createdAt,
      },
    })
    members.push(member)
  }
  console.log(`✅ ${members.length} socios creados`)

  // ─── 5. Crear historial de pagos (12 meses) ───────────────────────────────
  // MRR creciente: empieza en $1.2M ARS y llega a $3.4M ARS
  const mrrByMonth = [
    1200000, 1450000, 1680000, 1820000, 2100000, 2350000,
    2480000, 2650000, 2890000, 3100000, 3280000, 3400000,
  ]

  const activeMembers = members.filter(m => m.status === MemberStatus.ACTIVE || m.status === MemberStatus.SUSPENDED)

  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const monthStart = monthsAgo(monthOffset)
    const targetMrr = mrrByMonth[11 - monthOffset]!
    const paymentsToCreate = Math.floor(targetMrr / 180000) // ~$18k por pago promedio

    for (let p = 0; p < paymentsToCreate && p < activeMembers.length; p++) {
      const member = activeMembers[p % activeMembers.length]!
      const isThisMonth = monthOffset === 0
      const isFailed = isThisMonth && p >= paymentsToCreate - 8 // 8 pagos fallidos este mes

      await db.payment.create({
        data: {
          gymId: gym.id,
          memberId: member.id,
          amount: planMensual.priceAmount,
          currency: "ARS",
          status: isFailed ? PaymentStatus.FAILED : PaymentStatus.SUCCEEDED,
          provider: PaymentProvider.MERCADOPAGO,
          periodStart: monthStart,
          periodEnd: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0),
          createdAt: new Date(monthStart.getTime() + randomBetween(0, 20) * 86400000),
          attemptNumber: isFailed ? randomBetween(1, 3) : 1,
          failureReason: isFailed ? "Fondos insuficientes" : null,
        },
      })
    }
  }
  console.log("✅ Historial de pagos creado (12 meses)")

  // ─── 6. Crear accesos (200+ en los últimos 30 días) ───────────────────────
  const accessMethods = [AccessMethod.QR, AccessMethod.QR, AccessMethod.QR, AccessMethod.NFC]
  let accessCount = 0

  for (let day = 30; day >= 0; day--) {
    const dailyCount = randomBetween(8, 22)
    for (let a = 0; a < dailyCount; a++) {
      const member = randomItem(members.filter(m => m.status === MemberStatus.ACTIVE))
      const hour = randomBetween(7, 21)
      const accessDate = daysAgo(day)
      accessDate.setHours(hour, randomBetween(0, 59), 0, 0)

      await db.accessLog.create({
        data: {
          gymId: gym.id,
          memberId: member.id,
          method: randomItem(accessMethods),
          success: Math.random() > 0.05, // 95% exitosos
          timestamp: accessDate,
        },
      })
      accessCount++
    }
  }
  console.log(`✅ ${accessCount} registros de acceso creados`)

  // ─── 7. Crear clases con ocupación variada ────────────────────────────────
  const classData = [
    { name: "Spinning", capacity: 15, occupancyPct: 89 },
    { name: "Yoga Flow", capacity: 12, occupancyPct: 67 },
    { name: "Funcional", capacity: 20, occupancyPct: 45 },
    { name: "Pilates", capacity: 15, occupancyPct: 27 }, // alerta roja
    { name: "Boxeo", capacity: 18, occupancyPct: 72 },
  ]

  for (const cls of classData) {
    const classStart = daysFromNow(randomBetween(1, 7))
    classStart.setHours(randomBetween(9, 20), 0, 0, 0)

    const schedule = await db.classSchedule.create({
      data: {
        gymId: gym.id,
        trainerId: trainer.id,
        name: cls.name,
        maxCapacity: cls.capacity,
        durationMin: 60,
        startTime: classStart,
        status: "SCHEDULED",
      },
    })

    // Crear bookings según ocupación
    const bookedCount = Math.floor(cls.capacity * cls.occupancyPct / 100)
    const shuffledMembers = [...members].sort(() => Math.random() - 0.5).slice(0, bookedCount)

    for (const member of shuffledMembers) {
      await db.classBooking.create({
        data: {
          gymId: gym.id,
          classScheduleId: schedule.id,
          memberId: member.id,
          status: "CONFIRMED",
        },
      })
    }
  }
  console.log("✅ Clases con ocupación variada creadas")

  // ─── 8. Crear churn scores ────────────────────────────────────────────────
  // 15 socios con riesgo HIGH, 25 MEDIUM, resto LOW
  for (let i = 0; i < members.length; i++) {
    const member = members[i]!
    let riskLevel: ChurnRisk
    let riskScore: number

    if (i < 15) {
      riskLevel = ChurnRisk.HIGH
      riskScore = randomBetween(75, 95)
    } else if (i < 40) {
      riskLevel = ChurnRisk.MEDIUM
      riskScore = randomBetween(45, 74)
    } else {
      riskLevel = ChurnRisk.LOW
      riskScore = randomBetween(5, 44)
    }

    const highRiskActions = ["Enviar oferta de retención", "Llamar al socio", "Ofrecer freeze gratuito"]

    await db.churnScore.create({
      data: {
        gymId: gym.id,
        memberId: member.id,
        daysSinceLastVisit: riskLevel === ChurnRisk.HIGH ? randomBetween(15, 45) : randomBetween(0, 14),
        attendanceDropRate: riskLevel === ChurnRisk.HIGH ? randomBetween(40, 80) / 100 : randomBetween(0, 30) / 100,
        paymentFailCount: riskLevel === ChurnRisk.HIGH ? randomBetween(1, 3) : 0,
        classNoShowCount: riskLevel === ChurnRisk.HIGH ? randomBetween(2, 6) : randomBetween(0, 2),
        membershipAgeDays: randomBetween(30, 540),
        riskLevel,
        riskScore,
        suggestedAction: riskLevel === ChurnRisk.HIGH ? randomItem(highRiskActions) : null,
      },
    })
  }
  console.log("✅ Churn scores calculados (15 HIGH, 25 MEDIUM, resto LOW)")

  console.log("\n🎉 Seed DEMO completado!")
  console.log(`\n📊 Resumen:`)
  console.log(`  Gym: ${gym.name}`)
  console.log(`  Socios: 150 (132 activos, 8 suspendidos, 5 cancelados, 5 congelados)`)
  console.log(`  MRR estimado: ~$3.400.000 ARS`)
  console.log(`  Pagos vencidos: 8`)
  console.log(`  Socios en riesgo churn: 15`)
  console.log(`  Accesos últimos 30d: ${accessCount}`)
  console.log(`  Clases: 5 (1 con alerta de baja ocupación)`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
