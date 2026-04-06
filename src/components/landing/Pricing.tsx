"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    description: "Para empezar sin riesgo",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Empezar gratis",
    ctaHref: "/sign-up",
    highlighted: false,
    features: [
      "Hasta 30 socios",
      "Dashboard completo",
      "Control QR de acceso",
      "Gestión de socios",
      "Reportes básicos",
    ],
  },
  {
    name: "Starter",
    badge: "Más popular",
    description: "Para gimnasios en crecimiento",
    monthlyPrice: 9,
    annualPrice: 7,
    cta: "Empezar ahora",
    ctaHref: "/sign-up?plan=starter",
    highlighted: true,
    features: [
      "Hasta 200 socios",
      "Todo lo del plan Free",
      "Pagos con MercadoPago",
      "WhatsApp automatizado",
      "IA Churn Scoring",
      "App móvil para socios",
      "Reportes avanzados",
    ],
  },
  {
    name: "Pro",
    description: "Para cadenas y multi-sede",
    monthlyPrice: 39,
    annualPrice: 31,
    cta: "Contactar ventas",
    ctaHref: "/sign-up?plan=pro",
    highlighted: false,
    features: [
      "Socios ilimitados",
      "Todo lo del plan Starter",
      "Acceso NFC",
      "White-label",
      "Multi-sede",
      "Acceso API",
      "Soporte prioritario",
    ],
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="bg-white py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
            Precios
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Simple y transparente
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto mb-8">
            Sin sorpresas. Empezá gratis y escalá cuando tu gimnasio crezca.
          </p>

          {/* Toggle mensual / anual */}
          <div className="inline-flex items-center gap-3 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                !annual
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Anual
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
              className={`relative flex flex-col rounded-2xl p-6 border transition-all duration-200 ${
                plan.highlighted
                  ? "ring-2 ring-indigo-500 border-indigo-200 bg-indigo-50 scale-[1.03] shadow-xl shadow-indigo-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.monthlyPrice === 0 ? (
                  <p className="text-4xl font-extrabold text-slate-900">Gratis</p>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-slate-400 text-lg font-medium">USD</span>
                    <span className="text-4xl font-extrabold text-slate-900">
                      ${annual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-slate-400 text-sm mb-1">/mes</span>
                  </div>
                )}
                {annual && plan.monthlyPrice > 0 && (
                  <p className="text-emerald-600 text-xs font-semibold mt-1">
                    Ahorrás ${(plan.monthlyPrice - plan.annualPrice) * 12}/año
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? "text-indigo-600" : "text-emerald-500"
                      }`}
                    />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-200 hover:shadow-indigo-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-slate-400 text-sm mt-8"
        >
          Todos los planes incluyen SSL, soporte por email y acceso a actualizaciones.
        </motion.p>
      </div>
    </section>
  )
}
