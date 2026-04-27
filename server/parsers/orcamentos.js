/**
 * Parses the ORÇAMENTOS sheet.
 * Column names vary by export, so we probe common aliases in priority order.
 */

const EXCEL_EPOCH = new Date(1899, 11, 31)

function excelSerialToDate(serial) {
  let days = Math.floor(serial)
  if (days > 59) days--
  const date = new Date(EXCEL_EPOCH)
  date.setDate(EXCEL_EPOCH.getDate() + days)
  return date
}

function parseBrDate(str) {
  if (!str) return null
  const s = String(str).trim()
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  // Try ISO or localized formats
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function parseDate(raw) {
  if (!raw) return null
  if (typeof raw === 'number') return excelSerialToDate(raw)
  return parseBrDate(raw)
}

function col(row, ...names) {
  for (const n of names) {
    const key = Object.keys(row).find(k => k.toUpperCase() === n.toUpperCase())
    if (key !== undefined && row[key] !== null && row[key] !== undefined && row[key] !== '') {
      return row[key]
    }
  }
  return null
}

export function parseOrcamentos(rows) {
  const budgets = []
  for (const row of rows) {
    const hasData = Object.values(row).some(v => v !== null && v !== undefined && v !== '')
    if (!hasData) continue

    const id = Number(col(row, 'NRORC', 'NRORÇ', 'NRRQU', 'NUMERO', 'NR', 'ID') ?? 0)
    const branch = Number(col(row, 'CDFIL', 'FILIAL', 'CD_FIL') ?? 0)
    const rawDate = col(row, 'DTORÇ', 'DTORCAMENTO', 'DTATEND', 'DTENTR', 'DATA', 'DT')
    const date = parseDate(rawDate)
    const rawValue = col(row, 'PRREAL', 'VLRORC', 'VLTOTAL', 'VALOR', 'TOTAL', 'PRCOBR')
    const value = parseFloat(String(rawValue ?? '0').replace(',', '.')) || 0
    const status = String(col(row, 'STATUS', 'SITUACAO', 'SITU', 'ST') ?? '').trim().toUpperCase()
    const client = String(col(row, 'NOMECLIDAV', 'NOMECLI', 'CLIENTE', 'NOME') ?? '').trim()

    // Skip rows with no meaningful identifier
    if (!id && !branch) continue

    const converted =
      status === 'A' ||
      status === 'S' ||
      status === 'APROVADO' ||
      status === 'CONVERTIDO' ||
      status === 'FATURADO'

    budgets.push({
      id,
      branchId: branch,
      date: date ? date.toISOString().split('T')[0] : null,
      value,
      status,
      client,
      converted,
    })
  }
  return budgets
}
