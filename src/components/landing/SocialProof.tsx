"use client"

import { useEffect, useRef, useState } from "react"

interface CounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
}

function Counter({ end, suffix = "", prefix = "", duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [started, end, duration])

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString("es-AR")}
      {suffix}
    </span>
  )
}


export function SocialProof() {
  const [rating, setRating] = useState(0)
  const [ratingStarted, setRatingStarted] = useState(false)
  const ratingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !ratingStarted) setRatingStarted(true)
      },
      { threshold: 0.3 }
    )
    if (ratingRef.current) observer.observe(ratingRef.current)
    return () => observer.disconnect()
  }, [ratingStarted])

  useEffect(() => {
    if (!ratingStarted) return
    const end = 4.8
    const duration = 2000
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setRating(Math.round(eased * end * 10) / 10)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [ratingStarted])

  return (
    <section className="bg-white py-20 border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900">
              <Counter end={150} suffix="+" />
            </p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Gimnasios activos</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900">
              <Counter end={10000} suffix="+" />
            </p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Socios gestionados</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900">
              <Counter end={500} suffix="k+" />
            </p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Accesos registrados</p>
          </div>
          <div ref={ratingRef}>
            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900">
              {rating.toFixed(1)}/5
            </p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Rating promedio</p>
          </div>
        </div>

        {/* Logos placeholder */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm uppercase tracking-wider font-medium mb-6">
            Usado por gimnasios en toda LATAM
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale">
            {["CrossFit Impulso", "Iron Gym", "FitZone", "Élite Training", "BodyPower"].map((name) => (
              <span key={name} className="text-slate-700 font-bold text-sm tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
