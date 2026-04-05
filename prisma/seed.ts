import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const exercises = [
  // PECHO (CHEST)
  { name: "Press de banca plano", muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"], description: "Ejercicio compuesto para pecho con barra o mancuernas en banco plano." },
  { name: "Press de banca inclinado", muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"], description: "Variante inclinada que enfatiza la parte superior del pecho." },
  { name: "Press de banca declinado", muscleGroups: ["CHEST", "TRICEPS"], description: "Variante declinada que enfatiza la parte inferior del pecho." },
  { name: "Aperturas con mancuernas", muscleGroups: ["CHEST"], description: "Ejercicio de aislamiento para el pecho con mancuernas en banco plano." },
  { name: "Fondos en paralelas", muscleGroups: ["CHEST", "TRICEPS", "SHOULDERS"], description: "Ejercicio compuesto con el peso corporal, enfatiza pecho inferior." },
  { name: "Pullover con mancuerna", muscleGroups: ["CHEST", "BACK"], description: "Estiramiento y contracción del pecho y serrato." },

  // ESPALDA (BACK)
  { name: "Dominadas", muscleGroups: ["BACK", "BICEPS"], description: "Ejercicio compuesto con peso corporal para espalda ancha." },
  { name: "Remo con barra", muscleGroups: ["BACK", "BICEPS", "CORE"], description: "Ejercicio compuesto para espalda media e inferior." },
  { name: "Remo con mancuerna", muscleGroups: ["BACK", "BICEPS"], description: "Remo unilateral para corrección de asimetrías." },
  { name: "Jalón al pecho en polea", muscleGroups: ["BACK", "BICEPS"], description: "Alternativa a dominadas en máquina de polea." },
  { name: "Remo en polea baja", muscleGroups: ["BACK", "BICEPS"], description: "Remo horizontal en polea para espalda media." },
  { name: "Peso muerto", muscleGroups: ["BACK", "GLUTES", "HAMSTRINGS", "CORE"], description: "El ejercicio compuesto más completo del tren posterior." },
  { name: "Hiperextensiones", muscleGroups: ["BACK", "GLUTES"], description: "Extensiones de espalda baja para lumbar y glúteos." },

  // HOMBROS (SHOULDERS)
  { name: "Press militar con barra", muscleGroups: ["SHOULDERS", "TRICEPS"], description: "Press vertical compuesto para hombros con barra." },
  { name: "Press Arnold", muscleGroups: ["SHOULDERS", "TRICEPS"], description: "Variante de press con rotación que trabaja todos los deltoides." },
  { name: "Elevaciones laterales", muscleGroups: ["SHOULDERS"], description: "Aislamiento para el deltoides lateral." },
  { name: "Elevaciones frontales", muscleGroups: ["SHOULDERS"], description: "Aislamiento para el deltoides anterior." },
  { name: "Pájaros o elevaciones posteriores", muscleGroups: ["SHOULDERS", "BACK"], description: "Aislamiento para el deltoides posterior y romboides." },
  { name: "Encogimientos (Shrugs)", muscleGroups: ["SHOULDERS", "TRAPS"], description: "Ejercicio para el trapecio superior." },

  // BRAZOS — BÍCEPS (BICEPS)
  { name: "Curl de bíceps con barra", muscleGroups: ["BICEPS"], description: "Ejercicio básico de aislamiento para bíceps." },
  { name: "Curl de bíceps con mancuernas", muscleGroups: ["BICEPS"], description: "Variante unilateral del curl de bíceps." },
  { name: "Curl martillo", muscleGroups: ["BICEPS", "FOREARMS"], description: "Curl con agarre neutro que trabaja braquial y antebrazo." },
  { name: "Curl predicador (Scott)", muscleGroups: ["BICEPS"], description: "Curl en banco predicador para mayor rango de movimiento." },
  { name: "Curl en polea baja", muscleGroups: ["BICEPS"], description: "Curl de bíceps en polea con tensión constante." },

  // BRAZOS — TRÍCEPS (TRICEPS)
  { name: "Press francés (Skullcrusher)", muscleGroups: ["TRICEPS"], description: "Extensión de codo tumbado para tríceps con barra EZ." },
  { name: "Extensión en polea alta", muscleGroups: ["TRICEPS"], description: "Extensión de codo en polea para aislamiento de tríceps." },
  { name: "Patada de tríceps", muscleGroups: ["TRICEPS"], description: "Extensión de codo en posición inclinada con mancuerna." },
  { name: "Fondos en banco", muscleGroups: ["TRICEPS", "SHOULDERS"], description: "Fondos con apoyo en banco para tríceps." },

  // PIERNAS — CUÁDRICEPS (QUADS)
  { name: "Sentadilla con barra", muscleGroups: ["QUADS", "GLUTES", "HAMSTRINGS", "CORE"], description: "El rey de los ejercicios de piernas. Sentadilla trasera con barra." },
  { name: "Sentadilla frontal", muscleGroups: ["QUADS", "CORE"], description: "Variante frontal que enfatiza los cuádriceps." },
  { name: "Prensa de piernas", muscleGroups: ["QUADS", "GLUTES", "HAMSTRINGS"], description: "Ejercicio en máquina para cuádriceps y glúteos." },
  { name: "Extensión de cuádriceps en máquina", muscleGroups: ["QUADS"], description: "Aislamiento de cuádriceps en máquina." },
  { name: "Zancadas (Lunges)", muscleGroups: ["QUADS", "GLUTES", "HAMSTRINGS"], description: "Ejercicio unilateral para piernas y glúteos." },
  { name: "Step-up con mancuernas", muscleGroups: ["QUADS", "GLUTES"], description: "Subida al cajón con mancuernas para piernas." },

  // PIERNAS — POSTERIOR (HAMSTRINGS/GLUTES)
  { name: "Curl de isquiotibiales tumbado", muscleGroups: ["HAMSTRINGS"], description: "Flexión de rodilla en máquina para isquiotibiales." },
  { name: "Curl de isquiotibiales de pie", muscleGroups: ["HAMSTRINGS"], description: "Variante de pie unilateral para isquiotibiales." },
  { name: "Peso muerto rumano", muscleGroups: ["HAMSTRINGS", "GLUTES", "BACK"], description: "Variante del peso muerto para enfatizar isquiotibiales." },
  { name: "Hip thrust", muscleGroups: ["GLUTES", "HAMSTRINGS"], description: "Empuje de cadera con barra para máxima activación de glúteos." },
  { name: "Sentadilla búlgara", muscleGroups: ["GLUTES", "QUADS", "HAMSTRINGS"], description: "Sentadilla unilateral con pie elevado. Muy efectiva para glúteos." },
  { name: "Good morning", muscleGroups: ["HAMSTRINGS", "BACK"], description: "Inclinación de tronco con barra para isquiotibiales y lumbar." },

  // PANTORRILLAS (CALVES)
  { name: "Elevación de talones de pie", muscleGroups: ["CALVES"], description: "Extensión de tobillo en máquina o libre para gemelos." },
  { name: "Elevación de talones sentado", muscleGroups: ["CALVES"], description: "Variante sentada para el sóleo." },

  // CORE / ABDOMINALES
  { name: "Crunch abdominal", muscleGroups: ["CORE", "ABS"], description: "Flexión de tronco básica para abdominales superiores." },
  { name: "Plancha (Plank)", muscleGroups: ["CORE", "SHOULDERS"], description: "Estabilización isométrica para core y estabilizadores." },
  { name: "Plancha lateral", muscleGroups: ["CORE", "OBLIQUES"], description: "Variante lateral para oblicuos y cuadrado lumbar." },
  { name: "Elevación de piernas tumbado", muscleGroups: ["CORE", "ABS"], description: "Flexión de cadera para abdominales inferiores." },
  { name: "Russian twist", muscleGroups: ["CORE", "OBLIQUES"], description: "Rotación de tronco para oblicuos." },
  { name: "Rueda abdominal (Ab Wheel)", muscleGroups: ["CORE", "BACK", "SHOULDERS"], description: "Extensión abdominal con rueda. Ejercicio avanzado." },
  { name: "Vacuum abdominal", muscleGroups: ["CORE", "ABS"], description: "Contracción isométrica del transverso. Ideal para adelgazar la cintura." },

  // CARDIO
  { name: "Cinta de correr (trotando)", muscleGroups: ["CARDIO", "LEGS"], description: "Trote a ritmo moderado en cinta. Duración variable." },
  { name: "Cinta de correr (intervalos)", muscleGroups: ["CARDIO", "LEGS"], description: "HIIT en cinta alternando sprint y caminata." },
  { name: "Bicicleta estática", muscleGroups: ["CARDIO", "QUADS", "CALVES"], description: "Cardio de bajo impacto en bicicleta estática." },
  { name: "Elíptica", muscleGroups: ["CARDIO", "LEGS", "ARMS"], description: "Cardio de bajo impacto en máquina elíptica." },
  { name: "Remo (máquina)", muscleGroups: ["CARDIO", "BACK", "LEGS", "CORE"], description: "Cardio + fuerza en máquina de remo. Ejercicio total body." },
  { name: "Jumping jacks", muscleGroups: ["CARDIO", "LEGS", "SHOULDERS"], description: "Ejercicio de cardio sin equipamiento." },
  { name: "Burpees", muscleGroups: ["CARDIO", "FULL_BODY"], description: "Ejercicio de alta intensidad para todo el cuerpo." },
  { name: "Cuerda para saltar", muscleGroups: ["CARDIO", "CALVES", "SHOULDERS"], description: "Cardio con cuerda de saltar. Alta intensidad." },
  { name: "Battle ropes", muscleGroups: ["CARDIO", "SHOULDERS", "CORE"], description: "Ondulación de cuerdas para cardio y fuerza de tren superior." },
  { name: "Escalador (Mountain Climbers)", muscleGroups: ["CARDIO", "CORE", "SHOULDERS"], description: "Cardio desde posición de plancha." },
]

async function main() {
  console.log("Seeding exercises...")

  for (const ex of exercises) {
    await db.exercise.upsert({
      where: {
        // Usar name como criterio único para los ejercicios globales (gymId = null)
        // Workaround: buscar por nombre y gymId null
        id: (await db.exercise.findFirst({ where: { name: ex.name, gymId: null } }))?.id ?? "nonexistent",
      },
      create: {
        name: ex.name,
        description: ex.description,
        muscleGroups: ex.muscleGroups,
        isPublic: true,
        gymId: null,
      },
      update: {
        description: ex.description,
        muscleGroups: ex.muscleGroups,
        isPublic: true,
      },
    })
  }

  console.log(`✓ ${exercises.length} ejercicios sembrados`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
