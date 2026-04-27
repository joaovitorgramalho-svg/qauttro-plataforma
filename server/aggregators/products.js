import { getStore } from '../data-store.js'

function filterOrders({ branch, from, to } = {}) {
  let orders = getStore().orders
  if (branch) orders = orders.filter(o => o.branchId === Number(branch))
  if (from) orders = orders.filter(o => o.date && o.date >= from)
  if (to) orders = orders.filter(o => o.date && o.date <= to)
  return orders
}

export function getTop20Products(params) {
  const orders = filterOrders(params)
  // Products are identified by item ID (NRRQU_1 / itemId) — we use it as a product proxy
  // since the sheet doesn't have product names, we label them by item number
  const map = {}
  for (const o of orders) {
    for (const item of o.items) {
      const key = String(item.itemId)
      if (!map[key]) map[key] = { name: `Fórmula #${item.itemId}`, revenue: 0, orders: 0, avgPrice: 0 }
      map[key].revenue += item.revenue
      map[key].orders += 1
    }
  }
  const list = Object.values(map)
  for (const p of list) p.avgPrice = p.orders > 0 ? p.revenue / p.orders : 0
  return list.sort((a, b) => b.revenue - a.revenue).slice(0, 20)
}

export function getProductTrends(params) {
  const orders = filterOrders(params)
  // Get top 5 products by revenue
  const revenueMap = {}
  for (const o of orders) {
    for (const item of o.items) {
      const key = String(item.itemId)
      revenueMap[key] = (revenueMap[key] ?? 0) + item.revenue
    }
  }
  const top5 = Object.entries(revenueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k)

  return top5.map(itemId => {
    const monthMap = {}
    for (const o of orders) {
      if (!o.date) continue
      const month = o.date.slice(0, 7)
      for (const item of o.items) {
        if (String(item.itemId) !== itemId) continue
        if (!monthMap[month]) monthMap[month] = { month, revenue: 0 }
        monthMap[month].revenue += item.revenue
      }
    }
    return {
      name: `Fórmula #${itemId}`,
      months: Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)),
    }
  })
}
