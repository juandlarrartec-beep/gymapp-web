import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import Link from "next/link"
import { Dumbbell, BookOpen, Users } from "lucide-react"
import { CreateRoutineModal } from "@/components/training/CreateRoutineModal"
import { CreateExerciseModal } from "@/components/training/CreateExerciseModal"

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
}

const MUSCLE_ABBREV: Record<string, string> = {
  CHEST: "PECHO",
  BACK: "ESPALDA",
  LEGS: "PIERNA",
  SHOULDERS: "HOMBROS",
  ARMS: "BRAZOS",
  CORE: "CORE",
  TRICEPS: "TRÍCEPS",
  BICEPS: "BÍCEPS",
  GLUTES: "GLÚTEOS",
  CALVES: "PANTORRILLAS",
}

export default async function TrainingPage() {
  const { gymId } = await requireGymScope()

  const [routines, exercises, trainers, membersWithoutRoutine] = await Promise.all([
    db.routine.findMany({
      where: { gymId },
      include: {
        trainer: { select: { firstName: true, lastName: true } },
        _count: {
          select: {
            exercises: true,
            assignments: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.exercise.findMany({
      where: { OR: [{ gymId }, { gymId: null, isPublic: true }] },
      orderBy: { name: "asc" },
    }),
    db.trainer.findMany({
      where: { gymId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    db.member.count({
      where: {
        gymId,
        status: "ACTIVE",
        routineAssignments: { none: { isActive: true } },
      },
    }),
  ])

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-6 h-6 text-indigo-500" />
            <h1 className="text-2xl font-bold">Rutinas y entrenamiento</h1>
          </div>
          {membersWithoutRoutine > 0 && (
            <p className="text-sm text-amber-600">
              {membersWithoutRoutine} socios activos sin rutina asignada
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Rutinas — 60% */}
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">
              Rutinas
              <span className="ml-2 text-slate-400 font-normal text-sm">({routines.length})</span>
            </h2>
            <CreateRoutineModal trainers={trainers} />
          </div>

          {routines.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
              <Dumbbell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Sin rutinas creadas aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{routine.name}</p>
                        {routine.isTemplate && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            Plantilla
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {routine.trainer.firstName} {routine.trainer.lastName}
                        {routine.day && <> · {DAY_LABELS[routine.day] ?? routine.day}</>}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {routine._count.exercises} ejercicios
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {routine._count.assignments} asignados
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/training/${routine.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/dashboard/training/${routine.id}?edit=1`}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Biblioteca — 40% */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">
              Biblioteca
              <span className="ml-2 text-slate-400 font-normal text-sm">({exercises.length})</span>
            </h2>
            <CreateExerciseModal />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {exercises.length === 0 ? (
                <div className="p-6 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Sin ejercicios</p>
                </div>
              ) : (
                exercises.map((exercise) => (
                  <div key={exercise.id} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm text-slate-700">{exercise.name}</span>
                    <div className="flex gap-1 flex-wrap justify-end max-w-[120px]">
                      {exercise.muscleGroups.slice(0, 2).map((mg) => (
                        <span
                          key={mg}
                          className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                        >
                          {MUSCLE_ABBREV[mg] ?? mg}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
