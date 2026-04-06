import { SignUp } from "@clerk/nextjs"
import { Dumbbell, CheckCircle2 } from "lucide-react"

export default function SignUpPage() {
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
            Tu gimnasio, digitalizado<br />en 5 minutos
          </h1>
          <p className="text-indigo-200 text-lg">
            Empezá gratis. Sin tarjeta de crédito. Sin límite de tiempo.
          </p>
          <ul className="space-y-3">
            {[
              "Gestión de socios y membresías",
              "Cobros automáticos con MercadoPago",
              "Control de acceso por QR y NFC",
              "IA para detectar socios en riesgo de fuga",
              "WhatsApp automático para recordatorios",
              "App móvil para tus socios incluida",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-indigo-100 text-sm">{item}</span>
              </li>
            ))}
          </ul>
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
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          redirectUrl="/sign-up/gym"
        />
      </div>
    </main>
  )
}
