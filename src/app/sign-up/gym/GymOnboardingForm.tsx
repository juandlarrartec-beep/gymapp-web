"use client"

import { useEffect, useRef, useState } from "react"
import { useOrganizationList, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { saveGymToDb } from "./actions"

// Espera a que Clerk confirme el nuevo orgId en el JWT antes de navegar
function OrgReadyRedirect() {
  const { orgId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (orgId) {
      router.replace("/dashboard")
    }
  }, [orgId, router])

  return (
    <div className="text-center space-y-6 py-4">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-bold text-slate-900">¡Gimnasio creado!</h2>
      <p className="text-slate-500 text-sm">
        <span className="inline-block animate-spin mr-2">⏳</span>
        Preparando tu dashboard...
      </p>
      <p className="text-xs text-slate-400">
        Si esto tarda más de 10 segundos,{" "}
        <button
          onClick={() => router.replace("/dashboard")}
          className="underline text-indigo-500"
        >
          hacé click acá
        </button>
      </p>
    </div>
  )
}

type FormStatus = "idle" | "creating" | "success"

export default function GymOnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<FormStatus>("idle")
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
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) { setError("Slug inválido"); return }

    if (!createOrganization || !setActive) {
      setError("Error de inicialización. Recargá la página.")
      return
    }

    // Capturar FormData ANTES de deshabilitar inputs
    const formData = new FormData(form)
    setError(null)
    setStatus("creating")

    try {
      const org = await createOrganization({ name })

      const result = await saveGymToDb(formData, org.id)
      if (result?.error) {
        setError(result.error)
        setStatus("idle")
        return
      }

      // Activar org — Clerk actualiza el JWT en background
      await setActive({ organization: org.id })

      // OrgReadyRedirect observa useAuth() y navega cuando el JWT esté listo
      setStatus("success")

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || "Error al crear el gimnasio")
      setStatus("idle")
    }
  }

  // Cuando el JWT de Clerk esté listo, OrgReadyRedirect redirige automáticamente
  if (status === "success") {
    return <OrgReadyRedirect />
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
          ref={nameRef}
          name="name"
          type="text"
          required
          onChange={handleNameChange}
          placeholder="Ej: Fitness Center Norte"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={status === "creating"}
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
            disabled={status === "creating"}
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
          disabled={status === "creating"}
        >
          <option value="AR">Argentina (ARS)</option>
          <option value="CO">Colombia (COP)</option>
          <option value="MX">México (MXN)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={status === "creating"}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-colors"
      >
        {status === "creating" ? "Creando gimnasio..." : "Crear gimnasio →"}
      </button>
    </form>
  )
}
