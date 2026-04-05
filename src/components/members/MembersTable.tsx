"use client"

import { useState } from "react"
import Link from "next/link"
import { MemberStatus } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MemberRow {
  id: string
  firstName: string
  lastName: string
  email: string
  status: MemberStatus
  nextPaymentDate: Date | string
  membershipPlan: {
    name: string
    priceAmount: number
    currency: string
  }
}

interface MembersTableProps {
  members: MemberRow[]
  gymId: string
  onSuspend?: (memberId: string) => void
}

const statusLabel: Record<MemberStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  FROZEN: "Congelado",
  CANCELLED: "Cancelado",
}

const statusClass: Record<MemberStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  FROZEN: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-slate-100 text-slate-500",
}

export function MembersTable({ members, onSuspend }: MembersTableProps) {
  const [search, setSearch] = useState("")

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Próximo pago</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  No hay socios que coincidan con la búsqueda
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-slate-400">{member.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {member.membershipPlan.name}
                    <div className="text-xs text-slate-400">
                      {(member.membershipPlan.priceAmount / 100).toLocaleString("es-AR")}{" "}
                      {member.membershipPlan.currency}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusClass[member.status]}`}
                    >
                      {statusLabel[member.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {format(new Date(member.nextPaymentDate), "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/members/${member.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Ver perfil
                      </Link>
                      {member.status === MemberStatus.ACTIVE && onSuspend && (
                        <button
                          onClick={() => onSuspend(member.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Suspender
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
