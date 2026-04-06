import Link from "next/link"
import { Dumbbell } from "lucide-react"

export function Footer() {
  const links = [
    { href: "#features", label: "Características" },
    { href: "#pricing", label: "Precios" },
    { href: "/demo", label: "Demo" },
    { href: "mailto:hola@gymapp.io", label: "Contacto" },
    { href: "/privacidad", label: "Privacidad" },
  ]

  return (
    <footer className="bg-slate-900 border-t border-white/5 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">GymApp</span>
            </Link>
            <p className="text-slate-500 text-sm">
              El software que hace crecer tu gimnasio en LATAM
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-600 text-xs">
            © 2026 GymApp — AIL Agency · Argentina · Colombia · México
          </p>
        </div>
      </div>
    </footer>
  )
}
