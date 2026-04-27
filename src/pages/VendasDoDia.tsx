import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { useFilters } from '@/context/FilterContext'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function VendasDoDia() {
  const { toParams } = useFilters()
  const params = {
    ...toParams(),
    from: toParams().from ?? new Date().toISOString().split('T')[0],
    to: toParams().to ?? new Date().toISOString().split('T')[0],
  }

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const { data: hourly, isLoading } = useQuery({
    queryKey: ['sales-hourly', params],
    queryFn: () => api.sales.byHour(params),
    enabled: status?.loaded,
  })
  const { data: orders } = useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => api.sales.orders(params),
    enabled: status?.loaded,
  })

  if (!status?.loaded) {
    return (
      <DashboardLayout title="Vendas do Dia">
        <EmptyState />
      </DashboardLayout>
    )
  }

  const totalRevenue = hourly?.reduce((s, h) => s + h.revenue, 0) ?? 0
  const totalOrders = hourly?.reduce((s, h) => s + h.orders, 0) ?? 0
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <DashboardLayout
      title="Vendas do Dia"
      subtitle={formatDate(new Date())}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard title="Faturamento" value={formatCurrency(totalRevenue)} icon={DollarSign} />
          <MetricCard title="Pedidos" value={totalOrders} icon={ShoppingCart} />
          <MetricCard title="Ticket Médio" value={formatCurrency(avgTicket)} icon={TrendingUp} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            {hourly && hourly.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={hourly}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tickFormatter={h => `${h}h`} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={h => `${h}:00`} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} name="Faturamento" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                {isLoading ? 'Carregando...' : 'Sem vendas para hoje ainda.'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Atendente</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Fórmulas</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={`${o.branchId}-${o.orderId}`}>
                      <TableCell className="font-mono text-sm">#{o.orderId}</TableCell>
                      <TableCell className="text-sm">{o.attendantName}</TableCell>
                      <TableCell className="text-sm">{o.branchName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.customerName || '—'}</TableCell>
                      <TableCell className="text-right text-sm">{o.itemCount}</TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatCurrency(o.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
