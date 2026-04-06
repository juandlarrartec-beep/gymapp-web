"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    q: "¿Funciona en Argentina, Colombia y México?",
    a: "Sí. GymApp está diseñado para LATAM. Soporta pesos argentinos, pesos colombianos y pesos mexicanos. La integración con MercadoPago cubre AR, CO y MX de forma nativa.",
  },
  {
    q: "¿Necesito instalar algo?",
    a: "No. GymApp es 100% web. Funciona desde cualquier navegador en tu computadora o celular. La app móvil para socios se descarga desde la Play Store y App Store, sin configuración técnica.",
  },
  {
    q: "¿Cómo funciona el acceso por QR?",
    a: "Cada socio tiene un código QR único en su app o puede recibirlo por WhatsApp. El encargado escanea con cualquier celular usando la app de scanner, y el sistema registra el acceso en tiempo real.",
  },
  {
    q: "¿Qué pasa si el socio no tiene internet?",
    a: "El QR funciona offline en la app del socio. El scanner guarda los accesos localmente y los sincroniza cuando recupera conexión. La experiencia es fluida incluso con conectividad limitada.",
  },
  {
    q: "¿Puedo migrar desde mi sistema actual?",
    a: "Sí. Ofrecemos importación de socios desde Excel/CSV. Si usás otro software, nuestro equipo de soporte te ayuda con la migración sin costo adicional en los planes Starter y Pro.",
  },
  {
    q: "¿Hay contrato de permanencia?",
    a: "No. Podés cancelar en cualquier momento. Sin penalidades, sin letra chica. Si pagaste anual y cancelás, te devolvemos el proporcional de los meses restantes.",
  },
]

interface FAQItemProps {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}

function FAQItem({ q, a, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors duration-150"
      >
        <span className="font-semibold text-slate-900 text-sm sm:text-base pr-4">{q}</span>
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
          {isOpen ? (
            <Minus className="w-3.5 h-3.5 text-indigo-600" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section className="bg-slate-50 py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
            FAQ
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-slate-500 text-lg">
            Todo lo que necesitás saber antes de empezar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="space-y-3"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
