import * as XLSX from "xlsx"

/**
 * Convierte un array de objetos a un buffer .xlsx
 * El caller usa la respuesta como NextResponse con Content-Type apropiado
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string
): { buffer: Buffer; filename: string } {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte")

  // Auto-ajustar anchos de columna
  if (data.length > 0 && data[0]) {
    const cols = Object.keys(data[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...data.slice(0, 20).map((row) => String(row[key] ?? "").length)
      ),
    }))
    worksheet["!cols"] = cols
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer
  const safeFilename = filename.replace(/[^a-z0-9-_]/gi, "_")

  return { buffer, filename: `${safeFilename}.xlsx` }
}
