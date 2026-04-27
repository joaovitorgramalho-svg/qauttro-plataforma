import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-4 text-xl font-semibold">Página não encontrada</p>
      <p className="mt-2 text-sm text-muted-foreground">A rota que você acessou não existe.</p>
      <Button className="mt-6" onClick={() => navigate('/')}>Voltar ao início</Button>
    </div>
  )
}
