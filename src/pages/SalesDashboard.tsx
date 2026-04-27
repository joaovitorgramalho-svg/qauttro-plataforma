import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { DollarSign, ShoppingCart, Users, Package, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { useFilters } from '@/context/FilterContext'
import { formatCurrency } from '@/lib/utils'

export default function SalesDashboard() {
  const { toParams } = useFilters()
  const params = toParams()

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const { data: summary, isLoading } = useQuery({
    queryKey: ['sales-summary', params],
    queryFn: () => api.sales.summary(params),
    enabled: status?.loaded,
  })
  const { data: monthly } = useQuery({
    queryKey: ['sales-monthly', params],
    queryFn: () => api.sales.byMonth(params),
    enabled: status?.loaded,
  })
  const { data: byBranch } = useQuery({
    queryKey: ['sales-branch', params],
    queryFn: () => api.sales.byBranch(params),
    enabled: status?.loaded,
  })
  const { data: byAttendant } = useQuery({
    queryKey: ['sales-attendant', params],
    queryFn: () => api.sales.byAttendant(params),
    enabled: status?.loaded,
  })

  if (!status?.loaded) {
    return (
      <DashboardLayout title="Dashboard de Vendas">
        <EmptyState />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Dashboard de Vendas"
      subtitle={status.dateRange ? `${status.dateRange.from} – ${status.dateRange.to}` : undefined}
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Faturamento Total"
            value={summary ? formatCurrency(summary.totalRevenue) : '—'}
            icon={DollarSign}
          />
          <MetricCard
            title="Pedidos"
            value={summary?.totalOrders ?? '—'}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Fórmulas"
            value={summary?.totalItems ?? '—'}
            icon={Package}
          />
          <MetricCard
            title="Ticket Médio"
            value={summary ? formatCurrency(summary.avgTicket) : '—'}
            icon={TrendingUp}
          />
        </div>

        {/* Monthly Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Mensal de Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            {monthly && monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Faturamento" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                {isLoading ? 'Carregando...' : 'Sem dados para o período selecionado.'}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* By Branch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faturamento por Filial</CardTitle>
            </CardHeader>
            <CardContent>
              {byBranch && byBranch.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byBranch} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="branchName" tick={{ fontSize: 12 }} width={70} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Faturamento" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? 'Carregando...' : 'Sem dados.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendant ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de Atendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {byAttendant && byAttendant.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Atendente</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Pedidos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byAttendant.slice(0, 10).map((a, i) => (
                      <TableRow key={a.attendantId}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{a.attendantName}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(a.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{a.orders}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? 'Carregando...' : 'Sem dados.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
