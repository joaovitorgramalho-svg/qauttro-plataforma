/**
 * Normalizes the VENDAS sheet.
 *
 * The sheet has a flattened structure where each row represents a formula (item)
 * within an order. The first 8 columns belong to the order (pedido), the rest to
 * the item (fórmula). Column names repeat, so xlsx reads them with suffixes (_1, _2…).
 *
 * Returns an array of normalized orders where each order has an `items` array.
 *
 * DTENTR format: "DD.MM.YYYY" — parsed manually.
 * PRREAL (item): can be corrupted as an Excel date serial (number > 40000).
 */

const EXCEL_EPOCH = new Date(1899, 11, 30)

function excelSerialToDate(serial) {
  const date = new Date(EXCEL_EPOCH)
  date.setDate(EXCEL_EPOCH.getDate() + serial)
  return date
}

function parseBrDate(str) {
  if (!str) return null
  const s = String(str).trim()
  // DD.MM.YYYY
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  // Try generic
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function fixPrice(val) {
  if (val === null || val === undefined || val === '') return 0
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'))
  if (isNaN(num)) return 0
  // Excel date serials for years 2000-2040 range roughly 36526-73050
  if (num > 36000 && num < 80000) return 0 // corrupted — return 0 with warning flag
  return num
}

function isCurrencyCorrupted(val) {
  if (val === null || val === undefined || val === '') return false
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  return !isNaN(num) && num > 36000 && num < 80000
}

/**
 * The VENDAS sheet columns (xlsx may read repeated headers with _1 suffix):
 * Order block  : CDFIL, NRRQU, SERIER, PRCOBR, VRTXA, PTDSC, VRDSC, PRREAL
 * Item block   : CDFIL_1, NRRQU_1, SERIER_1, PRCOBR_1, VRTXA_1, PTDSC_1, VRDSC_1, PRREAL_1,
 *                PRCUSTO, CDFUNRE, NRCRM, CDCLI, NOMECLIDAV, OBSPA, TPFORMAFARMA, DTENTR
 */
export function parseVendas(rows, attendantsMap = {}) {
  const ordersMap = {}
  const warnings = new Set()

  for (const row of rows) {
    // Skip completely empty rows
    const hasData = Object.values(row).some(v => v !== null && v !== undefined && v !== '')
    if (!hasData) continue

    // Order-level fields
    const orderBranch = Number(row['CDFIL'] ?? 0)
    const orderNum = Number(row['NRRQU'] ?? 0)
    const orderRevenue = fixPrice(row['PRREAL'])

    // Item-level fields (xlsx adds _1 suffix to duplicate column names)
    const itemBranch = Number(row['CDFIL_1'] ?? row['CDFIL'] ?? 0)
    const itemNum = Number(row['NRRQU_1'] ?? row['NRRQU'] ?? 0)
    const itemRevenue = fixPrice(row['PRREAL_1'] ?? row['PRREAL'])
    const itemCost = fixPrice(row['PRCUSTO'] ?? 0)

    if (isCurrencyCorrupted(row['PRREAL_1'])) {
      warnings.add('Alguns valores de PRREAL (item) estão corrompidos como datas do Excel e foram zerados.')
    }

    // CDFUNRE can arrive as a number, a numeric string ("27"), empty string, or absent.
    // Treat anything that doesn't resolve to a positive integer as 0 (unknown attendant).
    const rawAttendant = row['CDFUNRE']
    const attendantId =
      rawAttendant !== null && rawAttendant !== undefined && rawAttendant !== ''
        ? Number(rawAttendant)
        : 0
    const customerName = String(row['TPFORMAFARMA'] ?? row['NOMECLIDAV'] ?? '').trim()
    const observation = String(row['OBSPA'] ?? '').trim()

    // Date parsing
    let date = null
    const rawDate = row['DTENTR']
    if (rawDate) {
      if (typeof rawDate === 'number') {
        // Excel stores dates as serial numbers when auto-formatted
        date = excelSerialToDate(rawDate)
      } else {
        date = parseBrDate(rawDate)
      }
    }

    if (!orderNum || !orderBranch) continue

    const orderKey = `${orderBranch}-${orderNum}`

    if (!ordersMap[orderKey]) {
      ordersMap[orderKey] = {
        orderId: orderNum,
        branchId: orderBranch,
        attendantId,
        attendantName: attendantsMap[attendantId] ?? `Atendente ${attendantId}`,
        revenue: orderRevenue,
        cost: 0,
        date: date ? date.toISOString().split('T')[0] : null,
        customerName,
        observation,
        items: [],
      }
    }

    // Add item
    ordersMap[orderKey].items.push({
      itemId: itemNum,
      branchId: itemBranch,
      revenue: itemRevenue,
      cost: itemCost,
    })
    ordersMap[orderKey].cost += itemCost

    // Use item revenue if order revenue is 0 (corruption fallback)
    if (ordersMap[orderKey].revenue === 0 && itemRevenue > 0) {
      ordersMap[orderKey].revenue = itemRevenue
    }
  }

  return {
    orders: Object.values(ordersMap),
    warnings: Array.from(warnings),
  }
}
