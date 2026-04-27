import { Router } from 'express'
import { getStore } from '../data-store.js'
import { getSalesByAttendant } from '../aggregators/sales.js'

const router = Router()

router.get('/', (req, res) => {
  const { attendants } = getStore()
  const list = Object.entries(attendants).map(([id, name]) => ({ id: Number(id), name }))
  res.json(list)
})

router.get('/stats', (req, res) => {
  // getSalesByAttendant already applies date/branch/attendant filters and
  // skips invalid attendant IDs (0, NaN). Result only contains attendants
  // that had at least one order in the filtered window.
  const byAttendant = getSalesByAttendant(req.query)
  const { attendants, orders } = getStore()

  // Build item counts from the SAME filtered order set so they stay consistent
  // with the revenue/order figures. Using req.query re-applies the same filters.
  // We replicate the filter inline to avoid importing filterOrders here.
  const { branch, from, to, attendantId: filterAttendantId } = req.query
  let filteredOrders = orders
  if (branch) filteredOrders = filteredOrders.filter(o => o.branchId === Number(branch))
  if (filterAttendantId) filteredOrders = filteredOrders.filter(o => o.attendantId === Number(filterAttendantId))
  if (from) filteredOrders = filteredOrders.filter(o => o.date && o.date >= from)
  if (to) filteredOrders = filteredOrders.filter(o => o.date && o.date <= to)

  const itemMap = {}
  for (const o of filteredOrders) {
    if (!o.attendantId || isNaN(o.attendantId)) continue
    if (!itemMap[o.attendantId]) itemMap[o.attendantId] = 0
    itemMap[o.attendantId] += o.items.length
  }

  // Build a lookup from the sales aggregation for fast merge
  const salesById = {}
  for (const a of byAttendant) {
    salesById[a.attendantId] = a
  }

  // Emit ALL attendants from the master map so the page always shows the full
  // roster. Attendants with no orders in the filtered window get zeroed stats
  // and sort to the bottom (stable sort: name alpha).
  const stats = Object.entries(attendants).map(([idStr, name]) => {
    const id = Number(idStr)
    const sales = salesById[id]
    return {
      attendantId: id,
      attendantName: name,
      revenue: sales?.revenue ?? 0,
      orders: sales?.orders ?? 0,
      avgTicket: sales?.avgTicket ?? 0,
      items: itemMap[id] ?? 0,
    }
  })

  // Sort: attendants with sales first (desc revenue), then zero-sale attendants alpha
  stats.sort((a, b) => {
    if (a.revenue !== b.revenue) return b.revenue - a.revenue
    return a.attendantName.localeCompare(b.attendantName, 'pt-BR')
  })

  res.json(stats)
})

// Manually set/merge attendants from the frontend
router.post('/set', (req, res) => {
  const { attendants: list } = req.body
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: 'attendants must be an array' })
  }

  const store = getStore()
  for (const { id, name } of list) {
    if (id !== undefined && name) {
      store.attendants[Number(id)] = String(name).trim()
    }
  }

  // Update attendant names in existing orders
  for (const order of store.orders) {
    const name = store.attendants[order.attendantId]
    if (name) order.attendantName = name
  }

  console.log(`[atendentes] Manual set: ${list.length} attendants merged. Total: ${Object.keys(store.attendants).length}`)

  res.json({ success: true, totalAttendants: Object.keys(store.attendants).length })
})

export default router
