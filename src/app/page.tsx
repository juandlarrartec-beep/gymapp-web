import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-xl w-full text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold text-white mb-3">GymApp</h1>
          <p className="text-slate-300 text-lg">
            Gestión integral para gimnasios. Socios, pagos, acceso y rutinas en un solo lugar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up/gym"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition-colors text-center"
          >
            Registrá tu gimnasio
          </Link>
          <Link
            href="/sign-in"
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-white transition-colors text-center"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-400">QR</p>
            <p className="text-sm text-slate-400 mt-1">Control de acceso</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-400">IA</p>
            <p className="text-sm text-slate-400 mt-1">Churn prediction</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-400">Auto</p>
            <p className="text-sm text-slate-400 mt-1">Cobros automáticos</p>
          </div>
        </div>
      </div>
    </main>
  )
}
