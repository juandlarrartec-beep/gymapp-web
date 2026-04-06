import { requireGymScope, db } from "@/lib/db"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"
import { AttendanceToggle } from "@/components/classes/AttendanceToggle"

interface Props {
  params: Promise<{ classId: string }>
}

export default async function ClassDetailPage({ params }: Props) {
  const { gymId } = await requireGymScope()
  const { classId } = await params

  const cls = await db.classSchedule.findFirst({
    where: { id: classId, gymId },
    include: {
      trainer: { select: { firstName: true, lastName: true } },
      bookings: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { bookedAt: "asc" },
      },
    },
  })

  if (!cls) notFound()

  const confirmed = cls.bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "ATTENDED"
  ).length
  const attended = cls.bookings.filter((b) => b.status === "ATTENDED").length
  const pct = cls.maxCapacity > 0 ? Math.round((confirmed / cls.maxCapacity) * 100) : 0
  const isScheduled = cls.status === "SCHEDULED"

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/dashboard/classes"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a clases
      </Link>

      {/* Cabecera */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{cls.name}</h1>
              <span
                className={clsx(
                  "text-xs px-2.5 py-1 rounded-full font-medium",
                  cls.status === "SCHEDULED" && "bg-indigo-100 text-indigo-700",
                  cls.status === "CANCELLED" && "bg-red-100 text-red-600",
                  cls.status === "COMPLETED" && "bg-slate-100 text-slate-500"
                )}
              >
                {cls.status === "SCHEDULED" && "Programada"}
                {cls.status === "CANCELLED" && "Cancelada"}
                {cls.status === "COMPLETED" && "Completada"}
              </span>
            </div>
            {cls.description && (
              <p className="text-slate-500 text-sm mt-1">{cls.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>{format(cls.startTime, "EEEE d MMM yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>
              {format(cls.startTime, "HH:mm")} · {cls.durationMin} min
            </span>
          </div>
          {cls.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span>{cls.location}</span>
            </div>
          )}
          {cls.trainer && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>
                {cls.trainer.firstName} {cls.trainer.lastName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPIs de ocupación */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{confirmed}</p>
          <p className="text-xs text-slate-400 mt-1">Confirmados</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{attended}</p>
          <p className="text-xs text-slate-400 mt-1">Asistieron</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold">{pct}%</p>
          <p className="text-xs text-slate-400 mt-1">Ocupación</p>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">
            Socios reservados{" "}
            <span className="text-slate-400 font-normal text-sm">
              ({confirmed}/{cls.maxCapacity})
            </span>
          </h2>
          {isScheduled && (
            <p className="text-xs text-slate-400">Marcá asistencia para cada socio</p>
          )}
        </div>

        {cls.bookings.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Sin reservas aún
          </div>
        ) : (
          <div className="divide-y">
            {cls.bookings.map((booking) => {
              const isAttended = booking.status === "ATTENDED"
              const isCancelled = booking.status === "CANCELLED"

              return (
                <div
                  key={booking.id}
                  className={clsx(
                    "px-6 py-4 flex items-center justify-between gap-4",
                    isCancelled && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        isAttended
                          ? "bg-green-100 text-green-700"
                          : isCancelled
                          ? "bg-slate-100 text-slate-400"
                          : "bg-indigo-100 text-indigo-700"
                      )}
                    >
                      {booking.member.firstName[0]}
                      {booking.member.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {booking.member.firstName} {booking.member.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{booking.member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        isAttended && "bg-green-100 text-green-700",
                        booking.status === "CONFIRMED" && "bg-indigo-100 text-indigo-700",
                        isCancelled && "bg-slate-100 text-slate-500",
                        booking.status === "NO_SHOW" && "bg-red-100 text-red-600"
                      )}
                    >
                      {isAttended && "Asistió"}
                      {booking.status === "CONFIRMED" && "Confirmado"}
                      {isCancelled && "Canceló"}
                      {booking.status === "NO_SHOW" && "No asistió"}
                    </span>

                    {isScheduled && !isCancelled && (
                      <AttendanceToggle
                        bookingId={booking.id}
                        attended={isAttended}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
