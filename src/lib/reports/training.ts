import { db } from "@/lib/db"

export interface TrainingReport {
  totalRoutines: number
  totalAssignments: number
  adherenceRate: number
  topExercises: Array<{ exerciseName: string; usageCount: number; muscleGroups: string[] }>
  byTrainer: Array<{ trainerName: string; routinesCount: number; assignmentsCount: number }>
  membersWithRoutine: number
  membersWithoutRoutine: number
}

// seatId opcional — las rutinas son del gym, no filtran por sede
export async function getTrainingReport(
  gymId: string,
  from: Date,
  to: Date,
  seatId?: string
): Promise<TrainingReport> {
  void seatId // el parámetro está disponible para consistencia de interfaz
  const [routines, assignments, activeMembers] = await Promise.all([
    db.routine.count({ where: { gymId } }),
    db.routineAssignment.count({
      where: { gymId, assignedAt: { gte: from, lte: to } },
    }),
    db.member.count({ where: { gymId, status: "ACTIVE" } }),
  ])

  const membersWithRoutine = await db.member.count({
    where: {
      gymId,
      status: "ACTIVE",
      routineAssignments: { some: { isActive: true } },
    },
  })

  const adherenceRate = activeMembers > 0 ? (membersWithRoutine / activeMembers) * 100 : 0

  // Top ejercicios más usados
  const routineExercises = await db.routineExercise.findMany({
    where: { routine: { gymId } },
    include: { exercise: { select: { name: true, muscleGroups: true } } },
  })

  const exerciseCounts = routineExercises.reduce<Record<string, { name: string; muscleGroups: string[]; count: number }>>((acc, re) => {
    const key = re.exerciseId
    if (!acc[key]) {
      acc[key] = { name: re.exercise.name, muscleGroups: re.exercise.muscleGroups, count: 0 }
    }
    acc[key]!.count += 1
    return acc
  }, {})

  const topExercises = Object.values(exerciseCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((e) => ({ exerciseName: e.name, usageCount: e.count, muscleGroups: e.muscleGroups }))

  // Por trainer
  const trainers = await db.trainer.findMany({
    where: { gymId, isActive: true },
    include: {
      _count: {
        select: {
          routines: true,
        },
      },
    },
  })

  const byTrainer = await Promise.all(
    trainers.map(async (trainer) => {
      const assignmentCount = await db.routineAssignment.count({
        where: { gymId, routine: { trainerId: trainer.id } },
      })
      return {
        trainerName: `${trainer.firstName} ${trainer.lastName}`,
        routinesCount: trainer._count.routines,
        assignmentsCount: assignmentCount,
      }
    })
  )

  return {
    totalRoutines: routines,
    totalAssignments: assignments,
    adherenceRate,
    topExercises,
    byTrainer,
    membersWithRoutine,
    membersWithoutRoutine: activeMembers - membersWithRoutine,
  }
}
