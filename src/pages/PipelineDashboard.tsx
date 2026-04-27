import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { useFilters } from '@/context/FilterContext'
import { formatCurrency } from '@/lib/utils'
import { GitFork } from 'lucide-react'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function PipelineDashboard() {
  const { toParams } = useFilters()
  const params = toParams()

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const { data: funnel } = useQuery({
    queryKey: ['pipeline-funnel', params],
    queryFn: () => api.pipeline.funnel(params),
    enabled: status?.loaded,
  })
  const { data: payments, isLoading } = useQuery({
    queryKey: ['pipeline-payments', params],
    queryFn: () => api.pipeline.payments(params),
    enabled: status?.loaded,
  })

  if (!status?.loaded) {
    return (
      <DashboardLayout title="Pipeline de Vendas">
        <EmptyState />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pipeline de Vendas" subtitle="Funil de conversão e formas de pagamento">
      <div className="space-y-6">
        {/* Funnel */}
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Orçamentos"
            value={funnel?.budgeted ?? '—'}
            icon={GitFork}
            subtitle="Pedidos orçados"
          />
          <MetricCard
            title="Convertidos"
            value={funnel?.converted ?? '—'}
            subtitle="Pedidos faturados"
            icon={GitFork}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={funnel ? `${funnel.conversionRate.toFixed(1)}%` : '—'}
            subtitle="Orçado → Faturado"
          >
            {funnel && (
              <Progress value={funnel.conversionRate} className="h-2" />
            )}
          </MetricCard>
        </div>

        {!funnel?.budgeted && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              A aba de Orçamentos ainda está vazia. Quando populada, o funil de conversão será exibido aqui.
            </CardContent>
          </Card>
        )}

        {/* Payment breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Observação / Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width={280} height={280}>
                  <PieChart>
                    <Pie
                      data={payments}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      dataKey="revenue"
                      nameKey="label"
                      paddingAngle={2}
                    >
                      {payments.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex-1 space-y-2 w-full">
                  {payments.map((p, i) => {
                    const total = payments.reduce((s, x) => s + x.revenue, 0)
                    const pct = total > 0 ? (p.revenue / total) * 100 : 0
                    return (
                      <div key={p.label} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm truncate">{p.label || '(sem obs.)'}</span>
                            <span className="text-sm font-medium shrink-0">{formatCurrency(p.revenue)}</span>
                          </div>
                          <Progress value={pct} className="h-1.5 mt-1" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                {isLoading ? 'Carregando...' : 'Sem dados para o período.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
