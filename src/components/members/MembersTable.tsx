"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { MemberStatus } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, ChevronLeft, ChevronRight, UserCircle } from "lucide-react"
import clsx from "clsx"
import { toast } from "sonner"
import { changeMemberStatus } from "@/lib/actions/members"

interface MemberRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: MemberStatus
  membershipPlan: { name: string } | null
  nextPaymentDate: Date | string
  createdAt: Date | string
}

interface FilterPlan {
  id: string
  name: string
}

interface MembersTableProps {
  members: MemberRow[]
  gymId: string
  plans?: FilterPlan[]
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  FROZEN: "Congelado",
  CANCELLED: "Cancelado",
}

const STATUS_CLASS: Record<MemberStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  FROZEN: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-slate-100 text-slate-500",
}

const PAGE_SIZE = 20

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

function exportCSV(members: MemberRow[]) {
  const header = "Nombre,Apellido,Email,Teléfono,Plan,Estado,Próximo pago,Miembro desde"
  const rows = members.map((m) =>
    [
      m.firstName,
      m.lastName,
      m.email,
      m.phone ?? "",
      m.membershipPlan?.name ?? "",
      STATUS_LABELS[m.status],
      format(new Date(m.nextPaymentDate), "dd/MM/yyyy"),
      format(new Date(m.createdAt), "dd/MM/yyyy"),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  )
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "socios.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function ChangeStatusDropdown({
  memberId,
  currentStatus,
}: {
  memberId: string
  currentStatus: MemberStatus
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const options = (
    Object.keys(STATUS_LABELS) as MemberStatus[]
  ).filter((s) => s !== currentStatus)

  function handleChange(status: MemberStatus) {
    setOpen(false)
    startTransition(() => {
      void (async () => {
        const result = await changeMemberStatus(memberId, status)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Estado cambiado a ${STATUS_LABELS[status]}`)
        }
      })()
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="text-slate-500 hover:text-slate-700 text-xs font-medium disabled:opacity-40"
      >
        {isPending ? "..." : "Estado"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-5 z-20 bg-white border rounded-lg shadow-lg py-1 min-w-[140px]">
            {options.map((s) => (
              <button
                key={s}
                onClick={() => handleChange(s)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
              >
                → {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function MembersTable({ members, plans = [] }: MembersTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "ALL">("ALL")
  const [planFilter, setPlanFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)

  // Filtrar client-side
  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    const matchStatus = statusFilter === "ALL" || m.status === statusFilter
    const matchPlan = planFilter === "ALL" || m.membershipPlan?.name === planFilter
    return matchSearch && matchStatus && matchPlan
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Reset página cuando cambian filtros
  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }
  function handleStatusFilter(v: MemberStatus | "ALL") {
    setStatusFilter(v)
    setPage(1)
  }
  function handlePlanFilter(v: string) {
    setPlanFilter(v)
    setPage(1)
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserCircle className="w-12 h-12 text-slate-200 mb-3" />
          <p className="text-slate-600 font-medium mb-1">Todavía no hay socios registrados</p>
          <p className="text-sm text-slate-400 mb-5">
            Registrá tu primer socio para empezar a gestionar el gimnasio
          </p>
          <Link
            href="/dashboard/members/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            + Registrar primer socio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value as MemberStatus | "ALL")}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="ALL">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as MemberStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {plans.length > 0 && (
          <select
            value={planFilter}
            onChange={(e) => handlePlanFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">Todos los planes</option>
            {plans.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => exportCSV(filtered)}
          className="border rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          Exportar CSV
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Socio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Próximo pago</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">
                  <UserCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  No hay socios que coincidan con los filtros
                </td>
              </tr>
            ) : (
              paginated.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-xs text-slate-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {member.membershipPlan?.name ?? (
                      <span className="text-slate-400 italic">Sin plan</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                        STATUS_CLASS[member.status]
                      )}
                    >
                      {STATUS_LABELS[member.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {format(new Date(member.nextPaymentDate), "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/members/${member.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Ver perfil
                      </Link>
                      <Link
                        href={`/dashboard/members/${member.id}/edit`}
                        className="text-slate-500 hover:text-slate-700 text-xs font-medium"
                      >
                        Editar
                      </Link>
                      <ChangeStatusDropdown
                        memberId={member.id}
                        currentStatus={member.status}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
            <p className="text-xs text-slate-500">
              {filtered.length} socios · página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
