import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useFilters } from '@/context/FilterContext'
import { formatCurrency } from '@/lib/utils'

export default function ProdutosDashboard() {
  const { toParams } = useFilters()
  const params = toParams()

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const { data: top20, isLoading } = useQuery({
    queryKey: ['products-top20', params],
    queryFn: () => api.products.top20(params),
    enabled: status?.loaded,
  })
  const { data: trends } = useQuery({
    queryKey: ['products-trends', params],
    queryFn: () => api.products.trends(params),
    enabled: status?.loaded,
  })

  if (!status?.loaded) {
    return (
      <DashboardLayout title="Produtos">
        <EmptyState />
      </DashboardLayout>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <DashboardLayout title="Produtos" subtitle="Top fórmulas por faturamento">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 20 Produtos por Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            {top20 && top20.length > 0 ? (
              <ResponsiveContainer width="100%" height={480}>
                <BarChart data={top20.slice(0, 20)} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[480px] items-center justify-center text-sm text-muted-foreground">
                {isLoading ? 'Carregando...' : 'Sem dados para o período.'}
              </div>
            )}
          </CardContent>
        </Card>

        {trends && trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendência — Top 5 Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends[0]?.months ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  {trends.slice(0, 5).map((t, i) => (
                    <Line
                      key={t.name}
                      type="monotone"
                      dataKey="revenue"
                      data={t.months}
                      name={t.name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
