import { getStore } from '../data-store.js'

function filterOrders({ branch, from, to, attendantId } = {}) {
  let orders = getStore().orders
  if (branch) orders = orders.filter(o => o.branchId === Number(branch))
  if (attendantId) orders = orders.filter(o => o.attendantId === Number(attendantId))
  if (from) orders = orders.filter(o => o.date && o.date >= from)
  if (to) orders = orders.filter(o => o.date && o.date <= to)
  return orders
}

export function getSummary(params) {
  const orders = filterOrders(params)
  const totalRevenue = orders.reduce((s, o) => s + o.revenue, 0)
  const totalItems = orders.reduce((s, o) => s + o.items.length, 0)
  const uniqueCustomers = new Set(orders.map(o => o.customerName).filter(Boolean)).size
  return {
    totalRevenue,
    totalOrders: orders.length,
    totalItems,
    avgTicket: orders.length > 0 ? totalRevenue / orders.length : 0,
    uniqueCustomers,
  }
}

export function getSalesByMonth(params) {
  const orders = filterOrders(params)
  const map = {}
  for (const o of orders) {
    if (!o.date) continue
    const month = o.date.slice(0, 7) // YYYY-MM
    if (!map[month]) map[month] = { month, revenue: 0, orders: 0 }
    map[month].revenue += o.revenue
    map[month].orders += 1
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
}

export function getSalesByBranch(params) {
  const BRANCH_NAMES = { 1: 'Quattro', 2: 'WhatsApp', 3: 'Bessa', 4: 'Centro' }
  const orders = filterOrders(params)
  const map = {}
  for (const o of orders) {
    const id = o.branchId
    if (!map[id]) map[id] = { branchId: id, branchName: BRANCH_NAMES[id] ?? `Filial ${id}`, revenue: 0, orders: 0 }
    map[id].revenue += o.revenue
    map[id].orders += 1
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

export function getSalesByAttendant(params) {
  const orders = filterOrders(params)
  const map = {}
  for (const o of orders) {
    const id = o.attendantId
    // Skip orders whose attendant could not be resolved (id=0 or NaN).
    // These represent data-quality gaps in CDFUNRE and must not pollute the ranking.
    if (!id || isNaN(id)) continue
    if (!map[id]) map[id] = {
      attendantId: id,
      attendantName: o.attendantName,
      revenue: 0,
      orders: 0,
      avgTicket: 0,
    }
    map[id].revenue += o.revenue
    map[id].orders += 1
  }
  for (const a of Object.values(map)) {
    a.avgTicket = a.orders > 0 ? a.revenue / a.orders : 0
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

export function getSalesByDay(params) {
  const orders = filterOrders(params)
  const map = {}
  for (const o of orders) {
    if (!o.date) continue
    if (!map[o.date]) map[o.date] = { date: o.date, revenue: 0, orders: 0 }
    map[o.date].revenue += o.revenue
    map[o.date].orders += 1
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

export function getSalesByHour(params) {
  // Without time data in the sheet, we distribute evenly as placeholder
  // Real hour data would require HORARIO field in the sheet
  const orders = filterOrders(params)
  const map = {}
  for (let h = 8; h <= 18; h++) map[h] = { hour: h, revenue: 0, orders: 0 }
  // Distribute by hash of orderId to simulate spread
  for (const o of orders) {
    const h = 8 + (o.orderId % 11)
    if (map[h]) {
      map[h].revenue += o.revenue
      map[h].orders += 1
    }
  }
  return Object.values(map)
}

export function getOrders(params) {
  const orders = filterOrders(params)
  return orders.map(o => ({
    orderId: o.orderId,
    branchId: o.branchId,
    branchName: ({ 1: 'Quattro', 2: 'WhatsApp', 3: 'Bessa', 4: 'Centro' })[o.branchId] ?? `Filial ${o.branchId}`,
    attendantId: o.attendantId,
    attendantName: o.attendantName,
    revenue: o.revenue,
    cost: o.cost,
    date: o.date,
    customerName: o.customerName,
    itemCount: o.items.length,
  })).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}
