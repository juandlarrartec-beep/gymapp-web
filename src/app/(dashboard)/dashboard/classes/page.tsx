import { requireGymScope } from "@/lib/db"
import { db } from "@/lib/db"
import { ClassCalendar } from "@/components/classes/ClassCalendar"
import { ClassForm } from "@/components/classes/ClassForm"
import { addDays, subDays } from "date-fns"

export default async function ClassesPage() {
  const { gymId } = await requireGymScope()

  const from = subDays(new Date(), 1)
  const to = addDays(new Date(), 30)

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

  // Stats del mes
  const upcomingCount = classes.filter((c) => c.status === "SCHEDULED").length
  const totalBookings = classes.reduce((acc, c) => acc + c.bookings.filter((b) => b.status === "CONFIRMED" || b.status === "ATTENDED").length, 0)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clases</h1>
          <p className="text-sm text-slate-400 mt-1">
            {upcomingCount} clases programadas · {totalBookings} reservas activas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendaio — ocupa 2/3 */}
        <div className="col-span-2 bg-white rounded-xl border shadow-sm p-5">
          <ClassCalendar classes={classes} />
        </div>

        {/* Formulario nueva clase — 1/3 */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold mb-4">Nueva clase</h2>
          <ClassForm gymId={gymId} trainers={trainers} />
        </div>
      </div>
    </div>
  )
}
