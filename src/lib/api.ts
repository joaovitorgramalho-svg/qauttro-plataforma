const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  status: () => get<DataStatus>('/status'),
  reset: () => post<{ success: boolean }>('/reset', {}),
  setAttendants: (list: { id: number; name: string }[]) =>
    post<{ success: boolean; totalAttendants: number }>('/atendentes/set', { attendants: list }),
  sales: {
    summary: (params?: SalesParams) => get<SalesSummary>(`/sales/summary${toQuery(params)}`),
    byMonth: (params?: SalesParams) => get<MonthlySales[]>(`/sales/by-month${toQuery(params)}`),
    byBranch: (params?: SalesParams) => get<BranchSales[]>(`/sales/by-branch${toQuery(params)}`),
    byAttendant: (params?: SalesParams) => get<AttendantSales[]>(`/sales/by-attendant${toQuery(params)}`),
    byDay: (params?: SalesParams) => get<DailySales[]>(`/sales/by-day${toQuery(params)}`),
    byHour: (params?: SalesParams) => get<HourlySales[]>(`/sales/by-hour${toQuery(params)}`),
    orders: (params?: SalesParams) => get<Order[]>(`/sales/orders${toQuery(params)}`),
  },
  products: {
    top20: (params?: SalesParams) => get<ProductSales[]>(`/products/top20${toQuery(params)}`),
    trends: (params?: SalesParams) => get<ProductTrend[]>(`/products/trends${toQuery(params)}`),
  },
  pipeline: {
    funnel: (params?: SalesParams) => get<PipelineFunnel>(`/pipeline/funnel${toQuery(params)}`),
    payments: (params?: SalesParams) => get<PaymentBreakdown[]>(`/pipeline/payments${toQuery(params)}`),
  },
  atendentes: {
    list: () => get<Attendant[]>('/atendentes'),
    stats: (params?: SalesParams) => get<AttendantStats[]>(`/atendentes/stats${toQuery(params)}`),
  },
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/upload`, { method: 'POST', body: form }).then(r => {
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`)
      return r.json() as Promise<UploadResult>
    })
  },
  uploadFuncionarios: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/upload/funcionarios`, { method: 'POST', body: form }).then(r => {
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`)
      return r.json() as Promise<{ success: boolean; totalAttendants: number; sample: string[] }>
    })
  },
}

function toQuery(params?: Record<string, string | undefined>): string {
  if (!params) return ''
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

// ---- Types ----

export interface DataStatus {
  loaded: boolean
  loadedAt: string | null
  totalOrders: number
  totalItems: number
  totalAttendants: number
  dateRange: { from: string; to: string } | null
}

export interface SalesParams {
  branch?: string
  from?: string
  to?: string
  attendantId?: string
}

export interface SalesSummary {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  avgTicket: number
  uniqueCustomers: number
}

export interface MonthlySales {
  month: string
  revenue: number
  orders: number
}

export interface BranchSales {
  branchId: number
  branchName: string
  revenue: number
  orders: number
}

export interface AttendantSales {
  attendantId: number
  attendantName: string
  revenue: number
  orders: number
  avgTicket: number
}

export interface AttendantStats extends AttendantSales {
  items: number
}

export interface DailySales {
  date: string
  revenue: number
  orders: number
}

export interface HourlySales {
  hour: number
  revenue: number
  orders: number
}

export interface Order {
  orderId: number
  branchId: number
  branchName: string
  attendantId: number
  attendantName: string
  revenue: number
  cost: number
  date: string
  customerName: string
  itemCount: number
}

export interface ProductSales {
  name: string
  revenue: number
  orders: number
  avgPrice: number
}

export interface ProductTrend {
  name: string
  months: { month: string; revenue: number }[]
}

export interface PipelineFunnel {
  budgeted: number
  converted: number
  conversionRate: number
}

export interface PaymentBreakdown {
  label: string
  count: number
  revenue: number
}

export interface Attendant {
  id: number
  name: string
}

export interface UploadResult {
  success: boolean
  totalRawRows: number
  totalOrders: number
  totalItems: number
  totalAttendants: number
  dateRange: { from: string; to: string }
  warnings: string[]
}
