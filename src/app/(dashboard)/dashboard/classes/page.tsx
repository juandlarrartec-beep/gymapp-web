import { requireGymScope, db } from "@/lib/db"
import { addDays, subDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { ClassCalendar } from "@/components/classes/ClassCalendar"
import { ClassForm } from "@/components/classes/ClassForm"
import { ClassCardActions } from "@/components/classes/ClassCardActions"
import { Users, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"

export default async function ClassesPage() {
  const { gymId } = await requireGymScope()

  const now = new Date()
  const from = subDays(now, 1)
  const to = addDays(now, 30)

  const [classes, trainers] = await Promise.all([
    db.classSchedule.findMany({
      where: { gymId, startTime: { gte: from, lte: to } },
      include: {
        trainer: { select: { firstName: true, lastName: true } },
        bookings: { select: { id: true, status: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    db.trainer.findMany({
      where: { gymId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  const upcomingScheduled = classes.filter(
    (c) => c.status === "SCHEDULED" && new Date(c.startTime) >= now
  )
  const totalBookings = classes.reduce(
    (acc, c) =>
      acc + c.bookings.filter((b) => b.status === "CONFIRMED" || b.status === "ATTENDED").length,
    0
  )

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clases</h1>
          <p className="text-sm text-slate-400 mt-1">
            {upcomingScheduled.length} clases programadas · {totalBookings} reservas activas
          </p>
        </div>
      </div>

      {/* Próximas clases — cards */}
      {upcomingScheduled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Próximas clases
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {upcomingScheduled.slice(0, 8).map((cls) => {
              const confirmed = cls.bookings.filter(
                (b) => b.status === "CONFIRMED" || b.status === "ATTENDED"
              ).length
              const pct = Math.round((confirmed / cls.maxCapacity) * 100)
              const isFull = confirmed >= cls.maxCapacity

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-tight">{cls.name}</p>
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                        isFull
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-700"
                      )}
                    >
                      {isFull ? "Lleno" : "Disponible"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(cls.startTime), "EEE d MMM · HH:mm", { locale: es })}
                  </p>

                  {cls.trainer && (
                    <p className="text-xs text-slate-500">
                      {cls.trainer.firstName} {cls.trainer.lastName}
                    </p>
                  )}

                  {cls.location && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cls.location}
                    </p>
                  )}

                  {/* Barra de ocupación */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {confirmed}/{cls.maxCapacity}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all",
                          pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-400" : "bg-indigo-500"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <Link
                      href={`/dashboard/classes/${cls.id}`}
                      className="flex-1 text-center py-1.5 text-xs border rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Ver
                    </Link>
                    <ClassCardActions classId={cls.id} gymId={gymId} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Layout: calendario + formulario */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border shadow-sm p-5">
          <ClassCalendar classes={classes} />
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold mb-4">Nueva clase</h2>
          <ClassForm gymId={gymId} trainers={trainers} />
        </div>
      </div>
    </div>
  )
}
