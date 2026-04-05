"use client"

import { useRef, useState } from "react"
import { useOrganizationList } from "@clerk/nextjs"
import { saveGymToDb } from "./actions"

export default function GymOnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "creating" | "redirecting">("idle")
  const slugRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const { createOrganization, setActive } = useOrganizationList()

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = nameRef.current?.value ?? ""
    const slug = slugRef.current?.value ?? ""

    if (!name || name.trim().length < 2) { setError("El nombre debe tener al menos 2 caracteres"); return }
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) { setError("Slug inválido — solo letras minúsculas, números y guiones"); return }

    if (!createOrganization || !setActive) {
      setError("Error de inicialización. Recargá la página.")
      return
    }

    setError(null)

    // Capturar FormData ANTES de deshabilitar los inputs
    const formData = new FormData(form)
    setStatus("creating")

    try {
      // 1. Crear la org en Clerk desde el cliente
      const org = await createOrganization({ name })
      const result = await saveGymToDb(formData, org.id)
      if (result?.error) {
        setError(result.error)
        setStatus("idle")
        return
      }

      // 3. Activar la org en la sesión de Clerk
      await setActive({ organization: org.id })

      // 4. Esperar a que Clerk propague la sesión al cookie
      setStatus("redirecting")
      await new Promise(r => setTimeout(r, 1500))

      // 5. Hard redirect
      window.location.href = "/dashboard"

    } catch (err) {
      console.error("[GymOnboardingForm]", err)
      setError(err instanceof Error ? err.message : "Error al crear el gimnasio")
      setStatus("idle")
    }
  }

  const buttonLabel = status === "creating"
    ? "Creando gimnasio..."
    : status === "redirecting"
      ? "Redirigiendo al dashboard..."
      : "Crear gimnasio →"

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
          ref={nameRef}
          name="name"
          type="text"
          required
          onChange={handleNameChange}
          placeholder="Ej: Fitness Center Norte"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={status !== "idle"}
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
            disabled={status !== "idle"}
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
          disabled={status !== "idle"}
        >
          <option value="AR">Argentina (ARS)</option>
          <option value="CO">Colombia (COP)</option>
          <option value="MX">México (MXN)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={status !== "idle"}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-colors"
      >
        {buttonLabel}
      </button>
    </form>
  )
}
