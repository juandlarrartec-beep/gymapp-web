"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { X, Loader2, Search } from "lucide-react"
import clsx from "clsx"
import { format, addDays } from "date-fns"
import {
  registerManualPaymentAction,
  getGymMembersForPaymentAction,
} from "@/app/(dashboard)/dashboard/payments/actions"

interface MemberOption {
  id: string
  firstName: string
  lastName: string
  email: string
  membershipPlan: {
    priceAmount: number
    currency: string
    durationDays: number
    name: string
  }
}

interface RegisterPaymentModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function RegisterPaymentModal({ onClose, onSuccess }: RegisterPaymentModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  const [members, setMembers] = useState<MemberOption[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Pre-fill de monto y periodo basado en el plan del socio
  const [amount, setAmount] = useState("")
  const [periodStart, setPeriodStart] = useState(format(new Date(), "yyyy-MM-dd"))
  const [periodEnd, setPeriodEnd] = useState("")

  useEffect(() => {
    getGymMembersForPaymentAction().then((result) => {
      if (result.data) setMembers(result.data)
      setLoadingMembers(false)
    })
  }, [])

  useEffect(() => {
    if (selectedMember) {
      setAmount(String(selectedMember.membershipPlan.priceAmount / 100))
      const start = new Date(periodStart)
      const end = addDays(start, selectedMember.membershipPlan.durationDays)
      setPeriodEnd(format(end, "yyyy-MM-dd"))
    }
  }, [selectedMember, periodStart])

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  function selectMember(member: MemberOption) {
    setSelectedMember(member)
    setSearch(`${member.firstName} ${member.lastName}`)
    setShowDropdown(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedMember) {
      toast.error("Seleccioná un socio")
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set("memberId", selectedMember.id)

    startTransition(async () => {
      const result = await registerManualPaymentAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Pago registrado correctamente")
        onSuccess()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Registrar cobro</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Socio (select con búsqueda) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Socio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setShowDropdown(true)
                    if (!e.target.value) setSelectedMember(null)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoComplete="off"
                />
              </div>

              {showDropdown && search.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {loadingMembers ? (
                    <div className="px-4 py-3 text-sm text-slate-400">Cargando...</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">Sin resultados</div>
                  ) : (
                    filteredMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectMember(m)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b last:border-b-0"
                      >
                        <p className="font-medium text-slate-800">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {m.email} — {m.membershipPlan.name}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedMember && (
              <p className="text-xs text-indigo-600 mt-1">
                Plan: {selectedMember.membershipPlan.name} —{" "}
                {selectedMember.membershipPlan.durationDays} días
              </p>
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                $
              </span>
              <input
                name="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="18000"
                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Período desde <span className="text-red-500">*</span>
              </label>
              <input
                name="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Período hasta <span className="text-red-500">*</span>
              </label>
              <input
                name="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notas <span className="text-xs text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Ej: Pago en efectivo, descuento aplicado..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedMember}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors",
                isPending || !selectedMember
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-indigo-500"
              )}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar cobro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
