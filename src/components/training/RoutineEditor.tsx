"use client"

import { useState, useTransition } from "react"
import { Search, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import clsx from "clsx"
import { updateRoutineExercise } from "@/lib/actions/routines"
import {
  addExerciseToRoutineAction,
  removeExerciseFromRoutineAction,
} from "@/app/(dashboard)/dashboard/training/actions"

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

interface ExerciseOption {
  id: string
  name: string
  muscleGroups: string[]
}

interface RoutineEditorProps {
  routineId: string
  initialExercises: ExerciseEntry[]
  availableExercises?: ExerciseOption[]
}

export function RoutineEditor({
  routineId,
  initialExercises,
  availableExercises = [],
}: RoutineEditorProps) {
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    [...initialExercises].sort((a, b) => a.order - b.order)
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [addPending, startAddTransition] = useTransition()

  // Ejercicios filtrados por búsqueda (excluir los ya en la rutina)
  const existingExerciseIds = new Set(exercises.map((e) => e.exercise.name))
  const filteredOptions = availableExercises.filter(
    (ex) =>
      !existingExerciseIds.has(ex.name) &&
      (search.length === 0 ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroups.some((mg) => mg.toLowerCase().includes(search.toLowerCase())))
  )

  function moveUp(index: number) {
    if (index === 0) return
    const newList = [...exercises]
    const tmp = newList[index]!
    newList[index] = newList[index - 1]!
    newList[index - 1] = tmp
    setExercises(newList.map((ex, i) => ({ ...ex, order: i + 1 })))
  }

  function moveDown(index: number) {
    if (index === exercises.length - 1) return
    const newList = [...exercises]
    const tmp = newList[index]!
    newList[index] = newList[index + 1]!
    newList[index + 1] = tmp
    setExercises(newList.map((ex, i) => ({ ...ex, order: i + 1 })))
  }

  async function saveField(exerciseId: string, field: string, value: number | string | null) {
    setSaving(exerciseId)
    const res = await updateRoutineExercise(exerciseId, { [field]: value })
    if (res.error) toast.error(res.error)
    setSaving(null)
  }

  function handleAddExercise(option: ExerciseOption) {
    startAddTransition(async () => {
      const nextOrder = exercises.length + 1
      const res = await addExerciseToRoutineAction({
        routineId,
        exerciseId: option.id,
        sets: 3,
        reps: 10,
        restSec: 60,
        order: nextOrder,
      })
      if (res.error || !res.data) {
        toast.error(res.error ?? "Error inesperado")
      } else {
        // Optimistic: agregar localmente con valores default
        setExercises((prev) => [
          ...prev,
          {
            id: res.data!.id,
            order: nextOrder,
            sets: 3,
            reps: 10,
            durationSec: null,
            restSec: 60,
            weightKg: null,
            notes: null,
            exercise: { name: option.name, muscleGroups: option.muscleGroups },
          },
        ])
        setSearch("")
        toast.success(`${option.name} agregado`)
      }
    })
  }

  function handleRemove(exerciseId: string, index: number) {
    startAddTransition(async () => {
      const res = await removeExerciseFromRoutineAction(exerciseId)
      if (res.error) {
        toast.error(res.error)
      } else {
        setExercises((prev) => {
          const filtered = prev.filter((_, i) => i !== index)
          return filtered.map((ex, i) => ({ ...ex, order: i + 1 }))
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Lista de ejercicios */}
      <div className="space-y-2">
        {exercises.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">
            Sin ejercicios — buscá abajo para agregar
          </div>
        )}

        {exercises.map((ex, index) => (
          <div
            key={ex.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-start gap-3"
          >
            {/* Controles de orden */}
            <div className="flex flex-col gap-0.5 mt-1 shrink-0">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 text-center font-mono">{ex.order}</span>
              <button
                onClick={() => moveDown(index)}
                disabled={index === exercises.length - 1}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{ex.exercise.name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {ex.exercise.muscleGroups.map((mg) => (
                      <span
                        key={mg}
                        className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs"
                      >
                        {mg}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {saving === ex.id && (
                    <span className="text-xs text-indigo-400 animate-pulse">Guardando...</span>
                  )}
                  <button
                    onClick={() => handleRemove(ex.id, index)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="Eliminar ejercicio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Series</label>
                  <input
                    type="number"
                    defaultValue={ex.sets}
                    min={1}
                    onBlur={(e) => void saveField(ex.id, "sets", parseInt(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Reps</label>
                  <input
                    type="number"
                    defaultValue={ex.reps ?? ""}
                    min={1}
                    placeholder="—"
                    onBlur={(e) =>
                      void saveField(ex.id, "reps", e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Descanso (s)</label>
                  <input
                    type="number"
                    defaultValue={ex.restSec}
                    min={0}
                    onBlur={(e) => void saveField(ex.id, "restSec", parseInt(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                    onBlur={(e) =>
                      void saveField(
                        ex.id,
                        "weightKg",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {ex.notes && (
                <p className="text-xs text-slate-400 italic">{ex.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Agregar ejercicio */}
      {availableExercises.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Agregar ejercicio</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o músculo..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {search.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-slate-400 text-center">
                  Sin resultados para &quot;{search}&quot;
                </div>
              ) : (
                filteredOptions.slice(0, 10).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleAddExercise(option)}
                    disabled={addPending}
                    className={clsx(
                      "w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors flex items-center justify-between",
                      "disabled:opacity-50"
                    )}
                  >
                    <span className="text-sm">{option.name}</span>
                    <div className="flex gap-1">
                      {option.muscleGroups.slice(0, 2).map((mg) => (
                        <span
                          key={mg}
                          className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                        >
                          {mg}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
