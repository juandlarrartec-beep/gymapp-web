"use client"

import { useState } from "react"
import { Wifi, WifiOff, Copy, CheckCircle2, ExternalLink } from "lucide-react"

const NFC_PROVIDERS = [
  {
    name: "VTAP",
    url: "https://vtapnfc.com",
    description: "Lector NFC compacto con soporte Apple/Google Wallet nativo",
  },
  {
    name: "ELATEC",
    url: "https://elatec.com",
    description: "Lectores industriales multi-tecnología, ideal para gyms de alto tráfico",
  },
  {
    name: "Wellyx",
    url: "https://wellyx.com",
    description: "Solución integrada para gestión de acceso en centros deportivos",
  },
  {
    name: "Gantner",
    url: "https://gantner.com",
    description: "Torniquetes y control de acceso con NFC para instalaciones deportivas",
  },
  {
    name: "Spintly",
    url: "https://spintly.com",
    description: "Control de acceso inalámbrico cloud, fácil instalación sin cableado",
  },
]

interface GymData {
  id: string
  slug: string
  plan: string
  nfcEnabled: boolean
  nfcReaderId: string | null
}

interface Props {
  gym: GymData
}

export default function NfcSettingsClient({ gym }: Props) {
  const [nfcEnabled, setNfcEnabled] = useState(gym.nfcEnabled)
  const [readerId, setReaderId] = useState(gym.nfcReaderId ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const webhookUrl = `https://${gym.slug}.gymapp.com/api/nfc/validate`

  if (gym.plan !== "PRO") {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Control de acceso NFC</h1>
        <p className="text-slate-500 mb-6">
          Permite que tus socios accedan al gym tocando su celular en el lector.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Wifi className="w-6 h-6 text-indigo-600" />
            <h2 className="font-semibold text-indigo-900">
              Función disponible en el plan Pro
            </h2>
          </div>
          <p className="text-indigo-700 text-sm mb-4">
            Con el plan Pro podés configurar lectores NFC para que tus socios entren
            tocando su celular con Apple Wallet o Google Wallet.
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

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/gyms/${gym.id}/nfc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfcEnabled, nfcReaderId: readerId || null }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function copyWebhook() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Control de acceso NFC</h1>
        <p className="text-slate-500 text-sm">
          Configura el lector NFC para que tus socios entren tocando su celular.
        </p>
      </div>

      {/* Toggle NFC */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {nfcEnabled ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <p className="font-medium">NFC {nfcEnabled ? "activado" : "desactivado"}</p>
              <p className="text-sm text-slate-400">
                {nfcEnabled
                  ? "Los socios pueden usar Apple/Google Wallet para entrar"
                  : "Activá NFC para habilitar el acceso por celular"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNfcEnabled((prev) => !prev)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              nfcEnabled ? "bg-green-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                nfcEnabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Reader ID */}
      <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold mb-1">ID del lector</h2>
          <p className="text-sm text-slate-400 mb-3">
            Ingresá el ID del lector NFC instalado en la entrada del gym.
            Lo encontrás en la etiqueta del dispositivo o en su app de configuración.
          </p>
          <input
            type="text"
            value={readerId}
            onChange={(e) => setReaderId(e.target.value)}
            placeholder="Ej: VTAP100-A3F9B2 o ELATEC-TWN4-001"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Webhook URL */}
        <div>
          <h3 className="text-sm font-medium mb-2">
            URL del webhook a configurar en el lector
          </h3>
          <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2">
            <code className="flex-1 text-xs text-slate-700 truncate">{webhookUrl}</code>
            <button
              onClick={copyWebhook}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 transition-colors shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configurá esta URL como webhook POST en el panel de administración del lector.
          </p>
        </div>
      </div>

      {/* Proveedores recomendados */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Proveedores recomendados</h2>
        <div className="space-y-3">
          {NFC_PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              className="flex items-start justify-between gap-4 py-2 border-b last:border-0"
            >
              <div>
                <p className="font-medium text-sm">{provider.name}</p>
                <p className="text-xs text-slate-400">{provider.description}</p>
              </div>
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 shrink-0 transition-colors"
              >
                Ver <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
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
            Guardado
          </span>
        )}
      </div>
    </div>
  )
}
