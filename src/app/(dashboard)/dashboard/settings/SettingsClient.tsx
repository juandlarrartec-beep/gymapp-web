"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Settings,
  CreditCard,
  Instagram,
  Bell,
  Wifi,
  Palette,
  MapPin,
  DollarSign,
  CheckCircle2,
} from "lucide-react"

const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Montevideo",
]

const COUNTRIES = [
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
  { code: "PE", name: "Perú" },
  { code: "CL", name: "Chile" },
  { code: "UY", name: "Uruguay" },
]

type SettingsTab =
  | "general"
  | "plans"
  | "payments"
  | "instagram"
  | "notifications"
  | "nfc"
  | "branding"
  | "seats"

interface GymSettings {
  id: string
  plan: string
  name: string
  country: string
  timezone: string
  email: string | null
  phone: string | null
  address: string | null
  currency: string
  paymentProvider: string
  stripeAccountId: string | null
  mercadopagoAccountId: string | null
  instagramProgramEnabled: boolean
  instagramDiscount1: number
  instagramDiscount3: number
  instagramDiscount5: number
  nfcEnabled: boolean
  nfcReaderId: string | null
  slug: string
  appName: string | null
  logoUrl: string | null
  primaryColor: string | null
}

interface Props {
  gym: GymSettings
}

const TABS: { id: SettingsTab; label: string; icon: React.ElementType; proOnly?: boolean }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "plans", label: "Planes", icon: CreditCard },
  { id: "payments", label: "Pagos", icon: DollarSign },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "nfc", label: "NFC", icon: Wifi, proOnly: true },
  { id: "branding", label: "Marca", icon: Palette, proOnly: true },
  { id: "seats", label: "Sedes", icon: MapPin, proOnly: true },
]

export default function SettingsClient({ gym }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Estado para settings generales
  const [generalForm, setGeneralForm] = useState({
    name: gym.name,
    country: gym.country,
    timezone: gym.timezone,
    email: gym.email ?? "",
    phone: gym.phone ?? "",
    address: gym.address ?? "",
  })

  // Estado para Instagram
  const [instagramForm, setInstagramForm] = useState({
    enabled: gym.instagramProgramEnabled,
    discount1: gym.instagramDiscount1,
    discount3: gym.instagramDiscount3,
    discount5: gym.instagramDiscount5,
  })

  async function saveGeneral() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/gyms/${gym.id}/settings/general`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generalForm),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function saveInstagram() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/gyms/${gym.id}/settings/instagram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instagramForm),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const isProPlan = gym.plan === "PRO"

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      <div className="flex gap-6">
        {/* Sidebar de tabs */}
        <nav className="w-52 shrink-0">
          <ul className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const locked = tab.proOnly && !isProPlan
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : locked
                        ? "text-slate-300 cursor-default"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {tab.label}
                    {tab.proOnly && !isProPlan && (
                      <span className="ml-auto text-xs text-slate-300">Pro</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && (
            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5 max-w-xl">
              <h2 className="font-semibold">Información general</h2>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre del gym</label>
                <input
                  value={generalForm.name}
                  onChange={(e) => setGeneralForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">País</label>
                  <select
                    value={generalForm.country}
                    onChange={(e) => setGeneralForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zona horaria</label>
                  <select
                    value={generalForm.timezone}
                    onChange={(e) => setGeneralForm((f) => ({ ...f, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email de contacto</label>
                <input
                  type="email"
                  value={generalForm.email}
                  onChange={(e) => setGeneralForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="contacto@mygym.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={generalForm.phone}
                  onChange={(e) => setGeneralForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+54 11 1234-5678"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  value={generalForm.address}
                  onChange={(e) => setGeneralForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Av. Corrientes 1234, CABA"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <SaveButton saving={saving} saved={saved} onSave={saveGeneral} />
            </div>
          )}

          {activeTab === "plans" && (
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="font-semibold mb-4">Planes de membresía</h2>
              <p className="text-sm text-slate-500 mb-4">
                Gestioná los planes que ofrecés a tus socios desde la sección de Planes.
              </p>
              <Link
                href="/dashboard/plans"
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ir a Planes
              </Link>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-xl border p-6 shadow-sm max-w-xl">
              <h2 className="font-semibold mb-4">Configuración de pagos</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Proveedor activo</p>
                  <p className="text-sm text-slate-500 capitalize">
                    {gym.paymentProvider.toLowerCase()}
                  </p>
                </div>
                {gym.stripeAccountId && (
                  <div>
                    <p className="text-sm font-medium mb-1">Stripe Account ID</p>
                    <p className="text-sm font-mono text-slate-400">
                      {gym.stripeAccountId}
                    </p>
                  </div>
                )}
                {gym.mercadopagoAccountId && (
                  <div>
                    <p className="text-sm font-medium mb-1">MercadoPago Account ID</p>
                    <p className="text-sm font-mono text-slate-400">
                      {gym.mercadopagoAccountId}
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Para cambiar el proveedor o las credenciales, contactá al soporte de GymApp.
                </p>
              </div>
            </div>
          )}

          {activeTab === "instagram" && (
            <div className="bg-white rounded-xl border p-6 shadow-sm max-w-xl space-y-5">
              <div>
                <h2 className="font-semibold">Programa de Instagram</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Recompensá a tus socios que publican en Instagram con descuentos automáticos.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setInstagramForm((f) => ({ ...f, enabled: !f.enabled }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    instagramForm.enabled ? "bg-pink-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      instagramForm.enabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium">
                  {instagramForm.enabled ? "Activado" : "Desactivado"}
                </span>
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">1 publicación</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={instagramForm.discount1}
                      onChange={(e) =>
                        setInstagramForm((f) => ({ ...f, discount1: parseInt(e.target.value) || 0 }))
                      }
                      className="w-16 px-2 py-1 border rounded text-sm text-center"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">3 publicaciones</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={instagramForm.discount3}
                      onChange={(e) =>
                        setInstagramForm((f) => ({ ...f, discount3: parseInt(e.target.value) || 0 }))
                      }
                      className="w-16 px-2 py-1 border rounded text-sm text-center"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">5+ publicaciones</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={instagramForm.discount5}
                      onChange={(e) =>
                        setInstagramForm((f) => ({ ...f, discount5: parseInt(e.target.value) || 0 }))
                      }
                      className="w-16 px-2 py-1 border rounded text-sm text-center"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <SaveButton saving={saving} saved={saved} onSave={saveInstagram} />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl border p-6 shadow-sm max-w-xl">
              <h2 className="font-semibold mb-4">Notificaciones</h2>
              <p className="text-sm text-slate-500 mb-4">
                Configurá los templates de WhatsApp para cada tipo de notificación.
              </p>
              <div className="space-y-3">
                {[
                  { key: "payment_failed", label: "Pago fallido" },
                  { key: "payment_succeeded", label: "Pago exitoso" },
                  { key: "membership_expiring", label: "Membresía por vencer" },
                  { key: "welcome", label: "Bienvenida al gym" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <p className="text-sm">{n.label}</p>
                    <button className="text-xs text-indigo-600 hover:text-indigo-500">
                      Editar template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "nfc" && (
            <div>
              {!isProPlan ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                  <h2 className="font-semibold text-indigo-900 mb-2">Control de acceso NFC</h2>
                  <p className="text-indigo-700 text-sm mb-4">
                    Configurá lectores NFC para que tus socios entren tocando el celular.
                    Disponible en el plan Pro.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                  >
                    Actualizar a Pro
                  </Link>
                </div>
              ) : (
                <Link
                  href="/dashboard/settings/nfc"
                  className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                >
                  Configurar NFC
                </Link>
              )}
            </div>
          )}

          {activeTab === "branding" && (
            <div>
              {!isProPlan ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                  <h2 className="font-semibold text-indigo-900 mb-2">Marca personalizada</h2>
                  <p className="text-indigo-700 text-sm mb-4">
                    Poné tu logo, colores y nombre en la app y el Wallet pass.
                    Disponible en el plan Pro.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                  >
                    Actualizar a Pro
                  </Link>
                </div>
              ) : (
                <Link
                  href="/dashboard/settings/branding"
                  className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                >
                  Configurar marca
                </Link>
              )}
            </div>
          )}

          {activeTab === "seats" && (
            <div>
              {!isProPlan ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                  <h2 className="font-semibold text-indigo-900 mb-2">Multi-sede</h2>
                  <p className="text-indigo-700 text-sm mb-4">
                    Gestioná varias sedes y filtrá reportes por sucursal.
                    Disponible en el plan Pro.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                  >
                    Actualizar a Pro
                  </Link>
                </div>
              ) : (
                <Link
                  href="/dashboard/settings/seats"
                  className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                >
                  Gestionar sedes
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SaveButton({
  saving,
  saved,
  onSave,
}: {
  saving: boolean
  saved: boolean
  onSave: () => void
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
      {saved && (
        <span className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          Guardado
        </span>
      )}
    </div>
  )
}
