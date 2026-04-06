"use client"

import { useState } from "react"
import { FinancialTab } from "@/components/reports/FinancialTab"
import { MembersTab } from "@/components/reports/MembersTab"
import { AttendanceTab } from "@/components/reports/AttendanceTab"
import { AccessTab } from "@/components/reports/AccessTab"
import type { ReportsData } from "@/app/(dashboard)/dashboard/reports/page"
import clsx from "clsx"
import { Download } from "lucide-react"

type TabId = "financial" | "members" | "attendance" | "access"

const TABS: { id: TabId; label: string }[] = [
  { id: "financial", label: "Financiero" },
  { id: "members", label: "Socios" },
  { id: "attendance", label: "Asistencia" },
  { id: "access", label: "Accesos" },
]

interface ReportsClientProps {
  data: ReportsData
  gymId: string
}

export function ReportsClient({ data, gymId }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("financial")

  function handleExport() {
    window.open(`/api/gyms/${gymId}/reports/${activeTab}/export`, "_blank")
  }

  return (
    <>
      {/* Tabs + exportar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Contenido del tab activo */}
      <div className="space-y-6">
        {activeTab === "financial" && (
          <FinancialTab financial={data.financial} trend={data.financialTrend} />
        )}
        {activeTab === "members" && (
          <MembersTab members={data.members} trend={data.membersTrend} />
        )}
        {activeTab === "attendance" && (
          <AttendanceTab attendance={data.attendance} />
        )}
        {activeTab === "access" && (
          <AccessTab access={data.access} recentLogs={data.accessRecent} />
        )}
      </div>
    </>
  )
}
