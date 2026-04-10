import { db } from "@/lib/db"
import { CalendarDays, Users, Clock, MapPin } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function DemoClassesPage() {
  const gymId = process.env.DEMO_GYM_ID!

  const classes = await db.classSchedule.findMany({
    where: { gymId },
    include: {
      trainer: { select: { firstName: true, lastName: true } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { startTime: "asc" },
    take: 20,
  })

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clases</h1>
          <p className="text-sm text-slate-500 mt-1">Próximas clases programadas</p>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-full">
          Modo Demo — solo lectura
        </span>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay clases programadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const occupancyPct = Math.round((cls._count.bookings / cls.maxCapacity) * 100)
            const occupancyColor =
              occupancyPct >= 70 ? "bg-emerald-500" : occupancyPct >= 40 ? "bg-amber-500" : "bg-rose-500"

            return (
              <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${occupancyColor}`}
                  >
                    {occupancyPct}%
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    <span>{format(cls.startTime, "EEEE d MMM · HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{cls.durationMin} min</span>
                  </div>
                  {cls.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{cls.location}</span>
                    </div>
                  )}
                  {cls.trainer && (
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span>{cls.trainer.firstName} {cls.trainer.lastName}</span>
                    </div>
                  )}
                </div>

                {/* Barra de ocupación */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{cls._count.bookings} reservados</span>
                    <span>capacidad {cls.maxCapacity}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${occupancyColor}`}
                      style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
