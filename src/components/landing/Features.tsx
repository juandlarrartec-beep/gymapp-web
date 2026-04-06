"use client"

import { motion } from "framer-motion"
import {
  Dumbbell,
  CreditCard,
  Brain,
  MessageSquare,
  Smartphone,
  BarChart3,
  Wallet,
  MapPin,
} from "lucide-react"

const features = [
  {
    icon: Dumbbell,
    title: "Control de acceso QR/NFC",
    description: "Socios entran tocando el celular o escaneando QR. Sin filas, sin papel.",
    color: "indigo",
  },
  {
    icon: CreditCard,
    title: "Pagos automáticos",
    description: "Cobros recurrentes con MercadoPago. El sistema cobra solo, vos descansás.",
    color: "violet",
  },
  {
    icon: Brain,
    title: "IA Churn Scoring",
    description: "Detectamos socios que están por irse antes de que se vayan. Actuá a tiempo.",
    color: "purple",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp automatizado",
    description: "Recordatorios de pago, bienvenidas y ofertas directo al WhatsApp del socio.",
    color: "emerald",
  },
  {
    icon: Smartphone,
    title: "App móvil incluida",
    description: "Tus socios ven sus rutinas, reservan clases y muestran su QR desde el celular.",
    color: "blue",
  },
  {
    icon: BarChart3,
    title: "Reportes en tiempo real",
    description: "MRR, retención, asistencia y churn en dashboards listos para tomar decisiones.",
    color: "amber",
  },
  {
    icon: Wallet,
    title: "Wallet Digital",
    description: "Pases en Apple Wallet y Google Wallet para que el socio siempre tenga su acceso.",
    color: "rose",
  },
  {
    icon: MapPin,
    title: "Multi-sede",
    description: "Gestioná varias sucursales desde un solo panel. Reportes por sede.",
    color: "teal",
  },
]

const colorMap: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
  violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
  purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
  teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-100",
}

const borderMap: Record<string, string> = {
  indigo: "group-hover:border-indigo-200",
  violet: "group-hover:border-violet-200",
  purple: "group-hover:border-purple-200",
  emerald: "group-hover:border-emerald-200",
  blue: "group-hover:border-blue-200",
  amber: "group-hover:border-amber-200",
  rose: "group-hover:border-rose-200",
  teal: "group-hover:border-teal-200",
}

export function Features() {
  return (
    <section id="features" className="bg-slate-50 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
            Características
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Todo lo que tu gimnasio necesita
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Una plataforma completa para gestionar socios, automatizar cobros y tomar decisiones con datos reales.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                className={`group bg-white border border-slate-200 ${borderMap[feature.color]} rounded-2xl p-6 cursor-default transition-all duration-200 hover:shadow-lg`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 ${colorMap[feature.color]}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm leading-snug">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
