import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

export default function FinanceiroDashboard() {
  return (
    <DashboardLayout title="Financeiro" subtitle="Despesas e fluxo de caixa">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Dashboard Financeiro</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Este dashboard exibirá despesas, fluxo de caixa e breakdown de custos quando os dados
              financeiros forem integrados à planilha (Fase 2 — Google Sheets Sync).
            </p>
            <p className="mt-4 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-md">
              Previsto: contas a pagar/receber, folha de pagamento, custos operacionais, margem de contribuição.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
