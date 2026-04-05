"use client"

import { useState } from "react"
import { updateRoutineExercise } from "@/lib/actions/routines"

interface ExerciseEntry {
  id: string
  order: number
  sets: number
  reps: number | null
  durationSec: number | null
  restSec: number
  weightKg: number | null
  notes: string | null
  exercise: {
    name: string
    muscleGroups: string[]
  }
}

interface RoutineEditorProps {
  routineId: string
  initialExercises: ExerciseEntry[]
}

export function RoutineEditor({ routineId, initialExercises }: RoutineEditorProps) {
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    [...initialExercises].sort((a, b) => a.order - b.order)
  )
  const [saving, setSaving] = useState<string | null>(null)

  // Mover ejercicio hacia arriba
  function moveUp(index: number) {
    if (index === 0) return
    const newList = [...exercises]
    const tmp = newList[index]!
    newList[index] = newList[index - 1]!
    newList[index - 1] = tmp
    // Actualizar órdenes
    const reordered = newList.map((ex, i) => ({ ...ex, order: i + 1 }))
    setExercises(reordered)
  }

  // Mover ejercicio hacia abajo
  function moveDown(index: number) {
    if (index === exercises.length - 1) return
    const newList = [...exercises]
    const tmp = newList[index]!
    newList[index] = newList[index + 1]!
    newList[index + 1] = tmp
    const reordered = newList.map((ex, i) => ({ ...ex, order: i + 1 }))
    setExercises(reordered)
  }

  async function saveField(exerciseId: string, field: string, value: number | string | null) {
    setSaving(exerciseId)
    await updateRoutineExercise(exerciseId, { [field]: value })
    setSaving(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Rutina: {routineId.slice(0, 8)}... · {exercises.length} ejercicios
      </p>

      {exercises.map((ex, index) => (
        <div
          key={ex.id}
          className="bg-white border rounded-xl p-4 shadow-sm flex items-start gap-4"
        >
          {/* Controles de orden */}
          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs"
            >
              ▲
            </button>
            <span className="text-xs text-slate-400 text-center">{ex.order}</span>
            <button
              onClick={() => moveDown(index)}
              disabled={index === exercises.length - 1}
              className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs"
            >
              ▼
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{ex.exercise.name}</p>
              {saving === ex.id && (
                <span className="text-xs text-indigo-400 animate-pulse">Guardando...</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mb-1">
              {ex.exercise.muscleGroups.map((mg) => (
                <span key={mg} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                  {mg}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-slate-400">Series</label>
                <input
                  type="number"
                  defaultValue={ex.sets}
                  min={1}
                  onBlur={(e) => void saveField(ex.id, "sets", parseInt(e.target.value))}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Reps</label>
                <input
                  type="number"
                  defaultValue={ex.reps ?? ""}
                  min={1}
                  placeholder="—"
                  onBlur={(e) => void saveField(ex.id, "reps", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Descanso (s)</label>
                <input
                  type="number"
                  defaultValue={ex.restSec}
                  min={0}
                  onBlur={(e) => void saveField(ex.id, "restSec", parseInt(e.target.value))}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Peso (kg)</label>
                <input
                  type="number"
                  defaultValue={ex.weightKg ?? ""}
                  min={0}
                  step={0.5}
                  placeholder="—"
                  onBlur={(e) => void saveField(ex.id, "weightKg", e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            {ex.notes && (
              <p className="text-xs text-slate-400 italic">{ex.notes}</p>
            )}
          </div>
        </div>
      ))}

      {exercises.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">
          Esta rutina no tiene ejercicios aún
        </div>
      )}
    </div>
  )
}
