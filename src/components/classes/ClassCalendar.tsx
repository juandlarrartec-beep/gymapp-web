"use client"

import { useState } from "react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface ClassEvent {
  id: string
  name: string
  startTime: Date | string
  durationMin: number
  location: string | null
  status: string
  maxCapacity: number
  bookings: Array<{ id: string; status: string }>
  trainer: { firstName: string; lastName: string } | null
}

interface ClassCalendarProps {
  classes: ClassEvent[]
  onClassClick?: (classId: string) => void
}

export function ClassCalendar({ classes, onClassClick }: ClassCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function classesForDay(day: Date) {
    return classes.filter((c) => isSameDay(new Date(c.startTime), day))
  }

  const statusClass: Record<string, string> = {
    SCHEDULED: "bg-indigo-100 border-indigo-300 text-indigo-800",
    COMPLETED: "bg-slate-100 border-slate-200 text-slate-500",
    CANCELLED: "bg-red-50 border-red-200 text-red-400 line-through",
  }

  return (
    <div className="space-y-4">
      {/* Controles de semana */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50"
        >
          ← Semana anterior
        </button>
        <p className="font-medium text-sm">
          {format(weekStart, "d MMM", { locale: es })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
        </p>
        <button
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50"
        >
          Semana siguiente →
        </button>
      </div>

      {/* Grid semanal */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayClasses = classesForDay(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div key={day.toISOString()} className="min-h-36">
              <div
                className={`text-center py-2 text-sm font-medium mb-2 rounded-lg ${
                  isToday ? "bg-indigo-600 text-white" : "text-slate-600"
                }`}
              >
                <div className="text-xs uppercase">{format(day, "EEE", { locale: es })}</div>
                <div>{format(day, "d")}</div>
              </div>

              <div className="space-y-1">
                {dayClasses.map((cls) => {
                  const confirmedCount = cls.bookings.filter(
                    (b) => b.status === "CONFIRMED" || b.status === "ATTENDED"
                  ).length
                  const isFull = confirmedCount >= cls.maxCapacity

                  return (
                    <Link
                      key={cls.id}
                      href={`/dashboard/classes/${cls.id}`}
                      onClick={() => onClassClick?.(cls.id)}
                      className={`block border rounded-lg px-2 py-1.5 text-xs cursor-pointer hover:shadow-sm transition-shadow ${statusClass[cls.status] ?? statusClass.SCHEDULED}`}
                    >
                      <p className="font-medium truncate">{cls.name}</p>
                      <p className="opacity-70">{format(new Date(cls.startTime), "HH:mm")}</p>
                      <p className={`opacity-70 ${isFull ? "text-red-500 font-medium" : ""}`}>
                        {confirmedCount}/{cls.maxCapacity}
                        {isFull ? " LLENO" : ""}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
