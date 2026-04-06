import { notFound } from "next/navigation"
import Link from "next/link"
import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { ArrowLeft, Dumbbell, Users, Edit } from "lucide-react"
import { RoutineEditor } from "@/components/training/RoutineEditor"
import { AssignRoutineModal } from "@/components/training/AssignRoutineModal"
import { deleteRoutineAction } from "../actions"
import { DeleteRoutineButton } from "@/components/training/DeleteRoutineButton"

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
}

interface PageProps {
  params: Promise<{ routineId: string }>
  searchParams: Promise<{ edit?: string }>
}

export default async function RoutineDetailPage({ params, searchParams }: PageProps) {
  const { gymId } = await requireGymScope()
  const { routineId } = await params
  const { edit } = await searchParams

  const [routine, members, exercises] = await Promise.all([
    db.routine.findFirst({
      where: { id: routineId, gymId },
      include: {
        trainer: { select: { firstName: true, lastName: true } },
        exercises: {
          include: {
            exercise: { select: { name: true, muscleGroups: true } },
          },
          orderBy: { order: "asc" },
        },
        assignments: {
          where: { isActive: true },
          include: {
            member: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
    }),
    db.member.findMany({
      where: { gymId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    db.exercise.findMany({
      where: { OR: [{ gymId }, { gymId: null, isPublic: true }] },
      select: { id: true, name: true, muscleGroups: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!routine) notFound()

  const isEditMode = edit === "1"

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/dashboard/training"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a rutinas
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{routine.name}</h1>
            {routine.isTemplate && (
              <span className="text-sm bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
                Plantilla
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {routine.trainer.firstName} {routine.trainer.lastName}
            {routine.day && <> · {DAY_LABELS[routine.day] ?? routine.day}</>}
            {routine.description && <> · {routine.description}</>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AssignRoutineModal routineId={routine.id} members={members} />
          <Link
            href={`/dashboard/training/${routine.id}${isEditMode ? "" : "?edit=1"}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors"
          >
            <Edit className="w-4 h-4" />
            {isEditMode ? "Ver" : "Editar"}
          </Link>
          <DeleteRoutineButton routineId={routine.id} action={deleteRoutineAction} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Ejercicios — 2/3 */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700">
              Ejercicios
              <span className="ml-1.5 text-slate-400 font-normal text-sm">
                ({routine.exercises.length})
              </span>
            </h2>
          </div>

          {isEditMode ? (
            <RoutineEditor
              routineId={routine.id}
              initialExercises={routine.exercises}
              availableExercises={exercises}
            />
          ) : (
            <div className="space-y-2">
              {routine.exercises.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-slate-400 text-sm">Sin ejercicios — activá edición para agregar</p>
                </div>
              ) : (
                routine.exercises.map((re, index) => (
                  <div
                    key={re.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{re.exercise.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {re.exercise.muscleGroups.map((mg) => (
                          <span key={mg} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {mg}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {re.sets} series
                        {re.reps ? ` × ${re.reps} reps` : ""}
                        {re.durationSec ? ` × ${re.durationSec}s` : ""}
                        {" · "}
                        Descanso: {re.restSec}s
                        {re.weightKg ? ` · ${re.weightKg}kg` : ""}
                      </p>
                      {re.notes && (
                        <p className="text-xs text-slate-400 italic mt-1">{re.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Socios asignados — 1/3 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700">
              Asignados
              <span className="ml-1.5 text-slate-400 font-normal text-sm">
                ({routine.assignments.length})
              </span>
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {routine.assignments.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-slate-400 text-sm">Sin socios asignados</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {routine.assignments.map((assignment) => (
                  <div key={assignment.id} className="px-4 py-3">
                    <Link
                      href={`/dashboard/members/${assignment.member.id}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      <p className="text-sm font-medium">
                        {assignment.member.firstName} {assignment.member.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{assignment.member.email}</p>
                    </Link>
                    {assignment.notes && (
                      <p className="text-xs text-slate-400 italic mt-1">{assignment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
