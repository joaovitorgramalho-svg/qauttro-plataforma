import { getStore } from '../data-store.js'

function filterOrders({ branch, from, to } = {}) {
  let orders = getStore().orders
  if (branch) orders = orders.filter(o => o.branchId === Number(branch))
  if (from) orders = orders.filter(o => o.date && o.date >= from)
  if (to) orders = orders.filter(o => o.date && o.date <= to)
  return orders
}

function filterBudgets({ branch, from, to } = {}) {
  let budgets = getStore().budgets
  if (branch) budgets = budgets.filter(b => b.branchId === Number(branch))
  if (from) budgets = budgets.filter(b => b.date && b.date >= from)
  if (to) budgets = budgets.filter(b => b.date && b.date <= to)
  return budgets
}

export function getFunnel(params) {
  const orders = filterOrders(params)
  const budgets = filterBudgets(params)

  if (budgets.length > 0) {
    const converted = budgets.filter(b => b.converted).length
    return {
      budgeted: budgets.length,
      converted,
      conversionRate: Math.round((converted / budgets.length) * 100),
    }
  }

  // Fallback when ORÇAMENTOS not loaded: use order count only
  return {
    budgeted: orders.length,
    converted: orders.length,
    conversionRate: 100,
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
