import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info } from 'lucide-react'

const schema = z.object({
  type: z.enum(['receita', 'despesa']),
  category: z.string().min(1, 'Informe a categoria'),
  description: z.string().min(1, 'Informe a descrição'),
  amount: z.string().min(1, 'Informe o valor'),
  date: z.string().min(1, 'Informe a data'),
})

type FormData = z.infer<typeof schema>

export default function EntradaFinanceiro() {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'despesa' },
  })

  function onSubmit(data: FormData) {
    const existing = JSON.parse(localStorage.getItem('quattro_financeiro_manual') ?? '[]') as FormData[]
    existing.push(data)
    localStorage.setItem('quattro_financeiro_manual', JSON.stringify(existing))
    toast.success('Lançamento registrado localmente.')
    reset()
  }

  return (
    <DashboardLayout title="Lançar Financeiro" showFilters={false}>
      <div className="max-w-xl space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Lançamentos salvos localmente. Integração com planilha na Fase 2.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Novo Lançamento Financeiro</CardTitle>
            <CardDescription>Registre receitas ou despesas operacionais.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select defaultValue="despesa" onValueChange={v => setValue('type', v as 'receita' | 'despesa')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Input placeholder="Ex: Aluguel, Fornecedor..." {...register('category')} />
                  {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" {...register('amount')} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Descreva o lançamento" {...register('description')} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full">Registrar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
