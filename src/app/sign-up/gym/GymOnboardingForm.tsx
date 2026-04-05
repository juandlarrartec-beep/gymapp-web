"use client"

import { useRef, useState, useTransition } from "react"
import { useOrganizationList } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { saveGymToDb } from "./actions"

export default function GymOnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const slugRef = useRef<HTMLInputElement>(null)
  const { createOrganization, setActive } = useOrganizationList()
  const router = useRouter()

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slug = e.target.value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
    if (slugRef.current) slugRef.current.value = slug
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem("name") as HTMLInputElement).value
    const slug = (form.elements.namedItem("slug") as HTMLInputElement).value

    if (!name || name.trim().length < 2) { setError("El nombre debe tener al menos 2 caracteres"); return }
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) { setError("Slug inválido — solo letras minúsculas, números y guiones"); return }

    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    startTransition(() => {
      void (async () => {
      try {
        if (!createOrganization || !setActive) {
          setError("Error de inicialización. Recargá la página.")
          return
        }

        // 1. Crear la org en Clerk desde el cliente
        const org = await createOrganization({ name })

        // 2. Guardar en nuestra DB
        const formData = new FormData(form)
        const result = await saveGymToDb(formData, org.id)
        if (result?.error) {
          setError(result.error)
          return
        }

        // 3. Activar la org en la sesión de Clerk
        await setActive({ organization: org.id })

        // 4. Hard redirect para que el middleware vea la sesión actualizada
        window.location.href = "/dashboard"

      } catch (err) {
        console.error("[GymOnboardingForm]", err)
        setError(err instanceof Error ? err.message : "Error al crear el gimnasio")
      }
      })()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre del gimnasio
        </label>
        <input
          name="name"
          type="text"
          required
          onChange={handleNameChange}
          placeholder="Ej: Fitness Center Norte"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Slug (URL única)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm whitespace-nowrap">gymapp.com/</span>
          <input
            ref={slugRef}
            name="slug"
            type="text"
            required
            pattern="^[a-z0-9-]+$"
            placeholder="fitness-center-norte"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Solo letras minúsculas, números y guiones</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
        <select
          name="country"
          required
          defaultValue="AR"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="AR">Argentina (ARS)</option>
          <option value="CO">Colombia (COP)</option>
          <option value="MX">México (MXN)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-colors"
      >
        {isPending ? "Creando gimnasio..." : "Crear gimnasio →"}
      </button>
    </form>
  )
}
