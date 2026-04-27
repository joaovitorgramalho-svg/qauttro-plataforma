import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useFilters } from '@/context/FilterContext'
import { formatCurrency } from '@/lib/utils'

export default function Atendentes() {
  const { toParams } = useFilters()
  const params = toParams()

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: api.status })

  // Full roster — unaffected by date/branch filters. Used for the total count
  // and to ensure all attendants are visible regardless of the active filter window.
  const { data: allAttendants } = useQuery({
    queryKey: ['atendentes-list'],
    queryFn: () => api.atendentes.list(),
    enabled: status?.loaded,
  })

  // Stats include all attendants (zeroed for those outside the filter window).
  // The /stats endpoint was fixed server-side to always return the full roster.
  const { data: stats, isLoading } = useQuery({
    queryKey: ['atendentes-stats', params],
    queryFn: () => api.atendentes.stats(params),
    enabled: status?.loaded,
  })

  if (!status?.loaded) {
    return (
      <DashboardLayout title="Atendentes" showFilters={false}>
        <EmptyState />
      </DashboardLayout>
    )
  }

  // Show total from full roster; fall back to stats length while roster loads
  const totalCount = allAttendants?.length ?? stats?.length ?? 0

  return (
    <DashboardLayout title="Atendentes" subtitle={`${totalCount} atendentes`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por Atendente</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && stats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Fórmulas</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((a, i) => (
                  <TableRow key={a.attendantId}>
                    <TableCell className="text-muted-foreground text-xs w-8">{i + 1}</TableCell>
                    <TableCell className="font-medium">{a.attendantName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{a.orders}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{a.items}</TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(a.revenue)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(a.avgTicket)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : 'Nenhum atendente encontrado.'}
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
