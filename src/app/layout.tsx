import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GymApp — Gestión para Gimnasios",
  description: "Software de gestión integral para gimnasios en LATAM. Socios, pagos, acceso QR, clases y reportes en un solo lugar.",
  keywords: ["gimnasio", "gym", "gestión", "socios", "control de acceso", "SaaS", "LATAM"],
  openGraph: {
    title: "GymApp — Gestión para Gimnasios",
    description: "Software de gestión integral para gimnasios en LATAM.",
    type: "website",
    locale: "es_AR",
  },
  robots: { index: false, follow: false }, // privado hasta lanzamiento
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>
          {children}
          <Toaster position="bottom-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
