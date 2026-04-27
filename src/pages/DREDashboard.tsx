import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function DREDashboard() {
  return (
    <DashboardLayout title="DRE" subtitle="Demonstrativo de Resultado do Exercício">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">DRE Completo</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            O DRE completo com comparativos de períodos será exibido aqui na Fase 2, após integração
            dos dados financeiros via Google Sheets.
          </p>
          <p className="mt-4 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-md">
            Previsto: Receita bruta → Deduções → Lucro bruto → Despesas operacionais → EBITDA → Lucro líquido.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
