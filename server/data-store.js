/**
 * In-memory singleton holding the parsed spreadsheet data.
 * Reset on each upload; accessed by all route handlers.
 */
const store = {
  loaded: false,
  loadedAt: null,
  orders: [],       // normalized Order[]
  attendants: {},   // { [cdfun]: string } name map
  budgets: [],      // normalized Budget[] from ORÇAMENTOS sheet
  budgetsLoadedAt: null,
}

export function getStore() {
  return store
}

export function setStoreData({ orders, attendants, loadedAt }) {
  store.loaded = true
  store.loadedAt = loadedAt ?? new Date().toISOString()
  store.orders = orders
  store.attendants = attendants
}

export function setBudgets(budgets) {
  store.budgets = budgets
  store.budgetsLoadedAt = new Date().toISOString()
}

export function resetStore() {
  store.loaded = false
  store.loadedAt = null
  store.orders = []
  store.attendants = {}
  store.budgets = []
  store.budgetsLoadedAt = null
}
