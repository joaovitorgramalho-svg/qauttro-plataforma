import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({
  title = 'Nenhum dado carregado',
  description = 'Para visualizar os dashboards, faça o upload da planilha da farmácia em Configurações.',
}: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Upload className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button className="mt-6" onClick={() => navigate('/configuracoes')}>
        Ir para Configurações
      </Button>
    </div>
  )
}
