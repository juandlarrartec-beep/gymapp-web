"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { RegisterPaymentModal } from "@/components/payments/RegisterPaymentModal"

export function RegisterPaymentButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Registrar cobro
      </button>

      {open && (
        <RegisterPaymentModal
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </>
  )
}
