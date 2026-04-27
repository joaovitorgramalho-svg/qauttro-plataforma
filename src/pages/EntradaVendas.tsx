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
import { BRANCHES } from '@/types'
import { Info } from 'lucide-react'

const schema = z.object({
  branchId: z.string().min(1, 'Selecione a filial'),
  orderId: z.string().min(1, 'Informe o número do pedido'),
  attendantId: z.string().min(1, 'Informe o código do atendente'),
  customerName: z.string().optional(),
  revenue: z.string().min(1, 'Informe o valor'),
  date: z.string().min(1, 'Informe a data'),
})

type FormData = z.infer<typeof schema>

export default function EntradaVendas() {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function onSubmit(data: FormData) {
    const existing = JSON.parse(localStorage.getItem('quattro_vendas_manual') ?? '[]') as FormData[]
    existing.push({ ...data, date: data.date })
    localStorage.setItem('quattro_vendas_manual', JSON.stringify(existing))
    toast.success('Venda registrada localmente. Será sincronizada com a planilha na Fase 2.')
    reset()
  }

  return (
    <DashboardLayout title="Lançar Vendas" showFilters={false}>
      <div className="max-w-xl space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            No MVP, os lançamentos são salvos localmente. A sincronização bidirecional com o Google Sheets
            será implementada na Fase 2.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Novo Lançamento de Venda</CardTitle>
            <CardDescription>Registre manualmente uma venda não capturada pela planilha.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Filial</Label>
                  <Select onValueChange={v => setValue('branchId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branchId && <p className="text-xs text-destructive">{errors.branchId.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Número do Pedido</Label>
                  <Input placeholder="Ex: 34780" {...register('orderId')} />
                  {errors.orderId && <p className="text-xs text-destructive">{errors.orderId.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Código do Atendente</Label>
                  <Input placeholder="Ex: 32" {...register('attendantId')} />
                  {errors.attendantId && <p className="text-xs text-destructive">{errors.attendantId.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Nome do Cliente</Label>
                  <Input placeholder="Opcional" {...register('customerName')} />
                </div>

                <div className="space-y-1">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" {...register('revenue')} />
                  {errors.revenue && <p className="text-xs text-destructive">{errors.revenue.message}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full">Registrar Venda</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
