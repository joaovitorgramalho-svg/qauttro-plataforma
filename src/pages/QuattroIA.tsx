import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Bot } from 'lucide-react'

export default function QuattroIA() {
  return (
    <DashboardLayout title="Quattro IA" showFilters={false}>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Quattro IA</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            O assistente de inteligência artificial da Farmácia Quattro estará disponível aqui.
            Ele poderá responder perguntas sobre vendas, recomendar produtos e gerar insights
            automáticos a partir dos seus dados.
          </p>
          <p className="mt-4 text-xs bg-muted px-4 py-2 rounded-md text-muted-foreground">
            Previsto para a Fase 3 — Integração com Claude API (Anthropic).
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
