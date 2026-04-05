import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"

export default async function TrainingPage() {
  const { gymId } = await requireGymScope()

  const [trainers, routines] = await Promise.all([
    db.trainer.findMany({
      where: { gymId, isActive: true },
      include: {
        _count: { select: { routines: true } },
      },
      orderBy: { firstName: "asc" },
    }),
    db.routine.findMany({
      where: { gymId },
      include: {
        trainer: { select: { firstName: true, lastName: true } },
        exercises: { select: { id: true } },
        assignments: { where: { isActive: true }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  // Socios sin rutina activa
  const membersWithoutRoutine = await db.member.count({
    where: {
      gymId,
      status: "ACTIVE",
      routineAssignments: {
        none: { isActive: true },
      },
    },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rutinas y entrenamiento</h1>
        <div className="text-right text-sm text-slate-400">
          <p>{membersWithoutRoutine} socios sin rutina asignada</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Trainers */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">Trainers</h2>
            <span className="text-xs text-slate-400">{trainers.length}</span>
          </div>
          <div className="divide-y">
            {trainers.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                Sin trainers registrados
              </div>
            ) : (
              trainers.map((trainer) => (
                <div key={trainer.id} className="px-4 py-3">
                  <p className="font-medium text-sm">
                    {trainer.firstName} {trainer.lastName}
                  </p>
                  {trainer.specialty && (
                    <p className="text-xs text-slate-400">{trainer.specialty}</p>
                  )}
                  <p className="text-xs text-indigo-500 mt-1">
                    {trainer._count.routines} rutinas
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rutinas */}
        <div className="col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Rutinas ({routines.length})</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {routines.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Sin rutinas creadas aún
              </div>
            ) : (
              routines.map((routine) => (
                <div key={routine.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{routine.name}</p>
                    <p className="text-xs text-slate-400">
                      {routine.trainer.firstName} {routine.trainer.lastName} ·{" "}
                      {routine.exercises.length} ejercicios ·{" "}
                      {routine.assignments.length} asignaciones activas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {routine.isTemplate && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                        Plantilla
                      </span>
                    )}
                    {routine.day && (
                      <span className="text-xs text-slate-400">{routine.day}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
