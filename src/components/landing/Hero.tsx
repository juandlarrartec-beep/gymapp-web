"use client"

import { motion, type Variants, type Transition } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.1 } as Transition,
  }),
}

const floatVariant: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } as Transition,
  },
}

export function Hero() {
  return (
    <section className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Gradient mesh fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-indigo-400/10 blur-[80px]" />
        {/* Grid lines sutil */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
        {/* Badge shimmer */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium relative overflow-hidden">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuevo — Churn Scoring IA incluido</span>
            {/* Shimmer */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent animate-[shimmer_2.5s_infinite]" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight"
        >
          <span className="text-white">El software que hace</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            crecer tu gimnasio
          </span>
          <br />
          <span className="text-white">en LATAM</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-2xl text-slate-400 text-lg sm:text-xl leading-relaxed"
        >
          Gestión de socios, pagos automáticos, acceso QR y NFC — todo en un solo lugar.
          Más tiempo para entrenar, menos tiempo en planillas.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-3 items-center"
        >
          <Link
            href="/sign-up"
            className="group flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]"
          >
            Empezar gratis
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/demo"
            className="flex items-center gap-2 px-7 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 hover:bg-white/5"
          >
            Ver demo en vivo
            <ArrowRight className="w-4 h-4 opacity-60" />
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2 text-slate-500 text-sm"
        >
          <div className="flex -space-x-2">
            {["bg-indigo-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500"].map((color, i) => (
              <div key={i} className={`w-6 h-6 rounded-full ${color} border-2 border-slate-950`} />
            ))}
          </div>
          <span>
            <span className="text-slate-300 font-semibold">150+</span> gimnasios ·{" "}
            <span className="text-slate-300 font-semibold">10.000+</span> socios activos
          </span>
        </motion.div>

        {/* Dashboard mockup flotando */}
        <motion.div
          variants={floatVariant}
          initial="initial"
          animate="animate"
          className="mt-8 w-full max-w-4xl"
        >
          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-900/40"
          >
            {/* Fake browser chrome */}
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-slate-700 rounded-md px-3 py-1 text-slate-400 text-xs text-center w-full max-w-xs mx-auto">
                  app.gymapp.io/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="bg-slate-900 p-6 min-h-[320px] sm:min-h-[400px]">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Socios activos", value: "148", delta: "+12", color: "indigo" },
                  { label: "MRR", value: "$2.847", delta: "+8%", color: "violet" },
                  { label: "Asistencia hoy", value: "34", delta: "68%", color: "emerald" },
                  { label: "Churn risk", value: "7", delta: "alta", color: "rose" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-800/60 border border-white/5 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className={`text-${stat.color}-400 text-xs font-medium mt-0.5`}>{stat.delta}</p>
                  </div>
                ))}
              </div>
              {/* Chart placeholder */}
              <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4 h-36 flex flex-col justify-end gap-1">
                <p className="text-slate-500 text-xs mb-2">Accesos esta semana</p>
                <div className="flex items-end gap-2 h-20">
                  {[40, 65, 55, 80, 72, 90, 68].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-500/60 rounded-t-sm hover:bg-indigo-400/80 transition-colors"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-slate-600 text-[10px] mt-1">
                  {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                    <span key={d} className="flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Shimmer keyframe en globals — referenciado en badge */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </section>
  )
}
