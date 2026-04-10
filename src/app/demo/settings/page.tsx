import { db } from "@/lib/db"
import { Settings, CreditCard, Palette, Wifi, Instagram } from "lucide-react"

export default async function DemoSettingsPage() {
  const gymId = process.env.DEMO_GYM_ID!

  const gym = await db.gym.findUnique({
    where: { id: gymId },
    select: {
      name: true, country: true, timezone: true, email: true,
      phone: true, address: true, currency: true, paymentProvider: true,
      nfcEnabled: true, instagramProgramEnabled: true, plan: true,
    },
  })

  if (!gym) return null

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="text-sm text-slate-500 mt-1">Ajustes del gimnasio</p>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-full">
          Modo Demo — solo lectura
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* General */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold">Información general</h2>
          </div>
          <dl className="space-y-3 text-sm">
            {[
              { label: "Nombre", value: gym.name },
              { label: "País", value: gym.country },
              { label: "Zona horaria", value: gym.timezone },
              { label: "Email", value: gym.email ?? "—" },
              { label: "Teléfono", value: gym.phone ?? "—" },
              { label: "Dirección", value: gym.address ?? "—" },
              { label: "Moneda", value: gym.currency },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="font-medium text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Pagos */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold">Pagos</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Proveedor</dt>
              <dd className="font-medium">{gym.paymentProvider}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Plan GymApp</dt>
              <dd>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {gym.plan}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* NFC */}
        <div className={`bg-white rounded-2xl border p-6 shadow-sm ${!gym.nfcEnabled ? "opacity-60" : ""}`}>
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold">Control de acceso NFC</h2>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${gym.nfcEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {gym.nfcEnabled ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {gym.nfcEnabled
              ? "Los socios pueden acceder tocando el celular en el lector NFC."
              : "Activá NFC en el plan Pro para que tus socios entren solo tocando el celular."}
          </p>
        </div>

        {/* Instagram */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Instagram className="w-5 h-5 text-pink-500" />
            <h2 className="font-semibold">Programa Instagram</h2>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${gym.instagramProgramEnabled ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-500"}`}>
              {gym.instagramProgramEnabled ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Recompensá a socios que publican en Instagram con descuentos automáticos en su membresía.
          </p>
        </div>

        {/* Branding Pro */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-indigo-900">Marca personalizada — Plan Pro</h2>
          </div>
          <p className="text-sm text-indigo-700 mb-3">
            Poné tu logo, colores y nombre en la app y en los Wallet passes de tus socios.
            Disponible en el plan Pro.
          </p>
          <div className="flex gap-3 text-sm">
            <span className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">✓ Logo personalizado</span>
            <span className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">✓ Colores de marca</span>
            <span className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">✓ White-label</span>
          </div>
        </div>
      </div>
    </div>
  )
}
