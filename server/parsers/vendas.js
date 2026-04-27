/**
 * Normalizes the VENDAS sheet.
 *
 * The CSV/XLSX has a flattened structure with two possible layouts per row:
 *
 * Layout A (order block filled):
 *   Cols 1-8  : CDFIL, NRRQU, SERIER, PRCOBR, VRTXA, PTDSC, VRDSC, PRREAL  (order totals)
 *   Cols 9-24 : CDFIL_1, NRRQU_1, ... PRREAL_1, PRCUSTO, CDFUNRE, ..., DTENTR (item detail)
 *
 * Layout B (order block empty — very common in exports):
 *   Cols 1-8  : all empty
 *   Cols 9-24 : same item block as above, with NRRQU_1 = order number, PRREAL_1 = item price
 *
 * Layout B rows were previously being completely skipped. This parser handles both.
 *
 * Number format: NRRQU values use Brazilian thousands dots ("27.745" = 27745).
 * We use the raw string as the order key to avoid dot-as-decimal ambiguity.
 *
 * PRREAL_1 in Layout A comes as an Excel date string ("16/05/1900") because
 * small prices (e.g. R$137) match Excel date serials and get auto-formatted.
 * We detect and convert these back to the original numeric value.
 */

// Excel epoch with leap-year-bug correction: serial 1 = Jan 1, 1900.
// Serials > 59 are off-by-one because Excel mistakenly counted Feb 29, 1900.
const EXCEL_EPOCH = new Date(1899, 11, 31) // Dec 31, 1899

function excelSerialToDate(serial) {
  let days = Math.floor(serial)
  if (days > 59) days-- // skip phantom Feb 29, 1900
  const date = new Date(EXCEL_EPOCH)
  date.setDate(EXCEL_EPOCH.getDate() + days)
  return date
}

// Converts an Excel-auto-formatted price string like "16/05/1900" back to its
// original numeric value (the Excel serial = the actual price in reais).
function parsePriceFromDateString(str) {
  // Only match dates in year 1900 (small serial ≤ 366 = small price ≤ R$366)
  const m = String(str).trim().match(/^(\d{1,2})\/(\d{1,2})\/(1900)$/)
  if (!m) return null
  const day = parseInt(m[1], 10)
  const month = parseInt(m[2], 10)
  // Compute Excel serial: days from Jan 1, 1900 (serial 1) including phantom Feb 29
  const d = new Date(1900, month - 1, day)
  const jan1 = new Date(1900, 0, 1)
  let serial = Math.round((d - jan1) / 86400000) + 1 // +1 because Jan 1 = serial 1
  if (d > new Date(1900, 1, 28)) serial++ // phantom Feb 29 shifts all dates after Feb 28
  return serial > 0 ? serial : null
}

function parseBrDate(str) {
  if (!str) return null
  const s = String(str).trim()
  // DD.MM.YYYY (standard export format from Google Sheets)
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  // DD/MM/YYYY fallback
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m2) return new Date(parseInt(m2[3]), parseInt(m2[2]) - 1, parseInt(m2[1]))
  return null
}

function fixPrice(val) {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'string') {
    // Check if it's an Excel auto-formatted price displayed as a 1900 date
    const fromDate = parsePriceFromDateString(val)
    if (fromDate !== null) return fromDate
  }
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'))
  if (isNaN(num)) return 0
  // Excel date serials for modern dates (2000-2120) look like large prices — zero them
  if (num > 36000 && num < 80000) return 0
  return num
}

export function parseVendas(rows, attendantsMap = {}) {
  const ordersMap = {}
  const warnings = new Set()

  for (const row of rows) {
    // Skip completely empty rows
    const hasData = Object.values(row).some(v => v !== null && v !== undefined && v !== '')
    if (!hasData) continue

    // Determine layout: if CDFIL (order block) is empty → Layout B
    const rawOrderBranch = row['CDFIL']
    const rawOrderNum = row['NRRQU']
    const orderBlockFilled = !!(rawOrderBranch && rawOrderBranch !== '' && rawOrderNum && rawOrderNum !== '')

    let orderBranch, orderNumKey, orderRevenue

    if (orderBlockFilled) {
      // Layout A: use order block for identity; PRREAL = this item's price
      orderBranch = Number(rawOrderBranch)
      orderNumKey = String(rawOrderNum).trim() // keep raw string (PT-BR "34.780")
      orderRevenue = fixPrice(row['PRREAL'])
    } else {
      // Layout B: order block empty — use item block columns instead
      orderBranch = Number(row['CDFIL_1'] ?? 0)
      orderNumKey = String(row['NRRQU_1'] ?? '').trim()
      orderRevenue = fixPrice(row['PRREAL_1'])
    }

    if (!orderBranch || !orderNumKey) continue

    // Item-level fields
    const itemBranch = Number(row['CDFIL_1'] ?? orderBranch)
    const itemRevenue = fixPrice(row['PRREAL_1'] ?? 0)
    const itemCost = fixPrice(row['PRCUSTO'] ?? 0)

    // CDFUNRE can arrive as number, numeric string, empty, or absent
    const rawAttendant = row['CDFUNRE']
    const attendantId =
      rawAttendant !== null && rawAttendant !== undefined && rawAttendant !== ''
        ? Number(rawAttendant)
        : 0

    const customerName = String(row['TPFORMAFARMA'] ?? row['NOMECLIDAV'] ?? '').trim()
    const observation = String(row['OBSPA'] ?? '').trim()

    // Date parsing — DTENTR is always in the item block (col 24)
    let date = null
    const rawDate = row['DTENTR']
    if (rawDate) {
      date = typeof rawDate === 'number'
        ? excelSerialToDate(rawDate)
        : parseBrDate(rawDate)
    }

    // Prefix prevents filled rows (F-) from colliding with empty rows (E-).
    // Filled rows use NRRQU (customer order number); empty rows use NRRQU_1
    // (which in some exports is the production order number and shares the same
    // numeric range — merging them would put 2026 revenue under 2025 dates).
    const orderKey = `${orderBlockFilled ? 'F' : 'E'}-${orderBranch}-${orderNumKey}`

    if (!ordersMap[orderKey]) {
      ordersMap[orderKey] = {
        orderId: parseInt(orderNumKey.replace(/\./g, ''), 10) || 0,
        branchId: orderBranch,
        attendantId,
        attendantName: attendantsMap[attendantId] ?? `Atendente ${attendantId}`,
        revenue: 0,
        cost: 0,
        date: date ? date.toISOString().split('T')[0] : null,
        customerName,
        observation,
        items: [],
      }
    }

    const order = ordersMap[orderKey]

    // Always accumulate: each row represents one formula/item.
    // PRREAL (Layout A) and PRREAL_1 (Layout B) are both per-item prices.
    order.revenue += orderRevenue

    // Patch date if first row had none
    if (!order.date && date) {
      order.date = date.toISOString().split('T')[0]
    }

    // Add item
    order.items.push({
      itemId: parseInt(String(row['NRRQU_1'] ?? '0').replace(/\./g, ''), 10),
      branchId: itemBranch,
      revenue: itemRevenue,
      cost: itemCost,
    })
    order.cost += itemCost
  }

  const orders = Object.values(ordersMap)

  if (warnings.size === 0 && orders.length === 0) {
    warnings.add('Nenhum pedido foi encontrado. Verifique se o arquivo contém a aba VENDAS.')
  }

  return {
    orders,
    warnings: Array.from(warnings),
  }
}
