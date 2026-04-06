"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"

export function DemoPreview() {
  return (
    <section className="bg-indigo-600 py-24 px-4 overflow-hidden relative">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/40 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[400px] h-[400px] rounded-full bg-violet-600/30 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Mirá el dashboard en vivo
            </h2>
            <p className="text-indigo-200 text-lg mb-8 max-w-lg">
              Navegá el sistema con datos reales de un gym demo. Sin registro, sin tarjeta.
              Explorá todas las funciones en minutos.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-indigo-600 text-indigo-600" />
              Abrir demo interactiva
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Preview mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex-1 w-full max-w-xl"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-indigo-900/40 bg-slate-900">
              {/* Chrome */}
              <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-slate-700 rounded px-3 py-1 text-slate-400 text-[11px] text-center max-w-[200px] mx-auto">
                    demo.gymapp.io
                  </div>
                </div>
              </div>

              {/* Content preview */}
              <div className="p-4 space-y-3">
                {/* Top metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Socios", val: "148" },
                    { label: "MRR", val: "$2.8k" },
                    { label: "Churn", val: "4.2%" },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-800 rounded-lg p-3 text-center">
                      <p className="text-white font-bold text-base">{m.val}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Member list */}
                <div className="bg-slate-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-slate-400 text-xs font-medium">Últimos accesos</p>
                  </div>
                  {[
                    { name: "María García", time: "hace 3 min", status: "green" },
                    { name: "Carlos López", time: "hace 12 min", status: "green" },
                    { name: "Ana Martínez", time: "hace 28 min", status: "yellow" },
                    { name: "Luis Torres", time: "hace 1h", status: "slate" },
                  ].map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.04] last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{m.name}</p>
                        <p className="text-slate-500 text-[10px]">{m.time}</p>
                      </div>
                      <div
                        className={`w-1.5 h-1.5 rounded-full bg-${m.status}-400`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
