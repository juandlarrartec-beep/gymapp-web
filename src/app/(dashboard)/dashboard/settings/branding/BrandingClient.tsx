"use client"

import { useState, useRef } from "react"
import { Upload, CheckCircle2, Dumbbell } from "lucide-react"

interface GymBranding {
  id: string
  plan: string
  name: string
  appName: string | null
  primaryColor: string | null
  logoUrl: string | null
}

interface Props {
  gym: GymBranding
}

const PRESET_COLORS = [
  "#6366f1", // indigo (default GymApp)
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#1e293b", // slate dark
]

export default function BrandingClient({ gym }: Props) {
  const [appName, setAppName] = useState(gym.appName ?? gym.name)
  const [primaryColor, setPrimaryColor] = useState(gym.primaryColor ?? "#6366f1")
  const [logoUrl, setLogoUrl] = useState(gym.logoUrl ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (gym.plan !== "PRO") {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Marca personalizada</h1>
        <p className="text-slate-500 mb-6">
          Personalizá el nombre, logo y colores de tu app.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h2 className="font-semibold text-indigo-900 mb-2">
            Función disponible en el plan Pro
          </h2>
          <p className="text-indigo-700 text-sm mb-4">
            Con el plan Pro podés poner tu logo, tu nombre y tus colores.
            Tus socios ven tu marca, no GymApp.
          </p>
          <a
            href="/dashboard/billing"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Actualizar a Pro — $39/mes
          </a>
        </div>
      </div>
    )
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError("")

    // Validar en cliente: tipo y tamaño
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      setUploadError("Solo se aceptan imágenes JPG, PNG o WebP")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("El archivo no puede superar 5MB")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/gyms/${gym.id}/upload`, {
        method: "POST",
        body: formData,
      })
      const json = (await res.json()) as { data: { url: string } | null; error: string | null }

      if (json.error || !json.data) {
        setUploadError(json.error ?? "Error subiendo el archivo")
      } else {
        setLogoUrl(json.data.url)
      }
    } catch {
      setUploadError("Error de conexión al subir el archivo")
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    // Validar hex
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    if (!hexRegex.test(primaryColor)) {
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/gyms/${gym.id}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: appName.trim() || gym.name,
          primaryColor,
          logoUrl: logoUrl || null,
        }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Marca personalizada</h1>
        <p className="text-slate-500 text-sm">
          Configurá la identidad visual que verán tus socios en la app y en el Wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="space-y-6">
          {/* Nombre de la app */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="font-semibold mb-3">Nombre de la app</h2>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder={gym.name}
              maxLength={50}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Este nombre aparece en el Wallet pass y en la app de tus socios.
            </p>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="font-semibold mb-3">Logo</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-400 transition-colors"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    {uploading ? "Subiendo..." : "Click para subir logo"}
                  </p>
                  <p className="text-xs text-slate-400">JPG, PNG o WebP — máx 5MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {uploadError && (
              <p className="text-xs text-red-500 mt-2">{uploadError}</p>
            )}
            {logoUrl && (
              <button
                onClick={() => setLogoUrl("")}
                className="mt-2 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Eliminar logo
              </button>
            )}
          </div>

          {/* Color primario */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="font-semibold mb-3">Color principal</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: primaryColor === color ? "#1e293b" : "transparent",
                    transform: primaryColor === color ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Preview en tiempo real */}
        <div className="space-y-4">
          <h2 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">
            Preview
          </h2>

          {/* Wallet pass preview */}
          <div
            className="rounded-2xl p-5 text-white shadow-xl"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-8 object-contain brightness-0 invert" />
              ) : (
                <Dumbbell className="w-6 h-6" />
              )}
              <span className="font-bold text-lg">{appName || gym.name}</span>
            </div>
            <div className="bg-white/20 rounded-xl p-4 space-y-2">
              <div>
                <p className="text-xs opacity-75">SOCIO</p>
                <p className="font-semibold">Juan García</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs opacity-75">PLAN</p>
                  <p className="text-sm font-medium">Mensual Premium</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">VÁLIDO HASTA</p>
                  <p className="text-sm font-medium">30/04/2026</p>
                </div>
              </div>
              <div>
                <p className="text-xs opacity-75">ESTADO</p>
                <p className="text-sm font-medium">ACTIVO</p>
              </div>
            </div>
          </div>

          {/* App bar preview */}
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div
              className="rounded-lg px-4 py-3 flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-6 object-contain brightness-0 invert" />
              ) : (
                <Dumbbell className="w-5 h-5 text-white" />
              )}
              <span className="text-white font-semibold text-sm">{appName || gym.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            Cambios guardados
          </span>
        )}
      </div>
    </div>
  )
}
