import { SignIn } from "@clerk/nextjs"
import { Dumbbell } from "lucide-react"

export default function SignInPage() {
  return (
    <main className="min-h-screen flex bg-slate-50">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">GymApp</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestioná tu gimnasio<br />desde cualquier lugar
          </h1>
          <p className="text-indigo-200 text-lg">
            Socios, pagos, acceso QR/NFC, clases y reportes en un solo lugar.
            Diseñado para gimnasios en LATAM.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Socios gestionados", value: "10.000+" },
              { label: "Accesos registrados", value: "500k+" },
              { label: "Gyms activos", value: "150+" },
              { label: "Países", value: "AR · CO · MX" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-indigo-200 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-300 text-sm">
          © 2026 GymApp — AIL Agency
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-indigo-600">GymApp</span>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </main>
  )
}
