import { getStore } from '../data-store.js'

function filterOrders({ branch, from, to } = {}) {
  let orders = getStore().orders
  if (branch) orders = orders.filter(o => o.branchId === Number(branch))
  if (from) orders = orders.filter(o => o.date && o.date >= from)
  if (to) orders = orders.filter(o => o.date && o.date <= to)
  return orders
}

export function getFunnel(params) {
  const orders = filterOrders(params)
  // Orçamentos sheet is empty in MVP — return placeholder
  return {
    budgeted: 0,
    converted: orders.length,
    conversionRate: 0,
  }
}

export function getPaymentBreakdown(params) {
  const orders = filterOrders(params)
  const map = {}
  for (const o of orders) {
    const label = o.observation ? o.observation.slice(0, 30) : '(sem observação)'
    if (!map[label]) map[label] = { label, count: 0, revenue: 0 }
    map[label].count += 1
    map[label].revenue += o.revenue
  }
  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}
