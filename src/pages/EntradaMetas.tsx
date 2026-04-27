import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BRANCHES } from '@/types'

interface MetaEntry {
  branchId: number
  month: string
  target: number
}

function getKey(branchId: number, month: string) {
  return `meta_${branchId}_${month}`
}

export default function EntradaMetas() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [metas, setMetas] = useState<Record<number, string>>({})

  useEffect(() => {
    const loaded: Record<number, string> = {}
    BRANCHES.forEach(b => {
      const stored = localStorage.getItem(getKey(b.id, month))
      loaded[b.id] = stored ?? ''
    })
    setMetas(loaded)
  }, [month])

  function handleSave() {
    BRANCHES.forEach(b => {
      const val = metas[b.id]
      if (val) localStorage.setItem(getKey(b.id, month), val)
      else localStorage.removeItem(getKey(b.id, month))
    })
    toast.success(`Metas de ${month} salvas.`)
  }

  return (
    <DashboardLayout title="Definir Metas" showFilters={false}>
      <div className="max-w-lg space-y-6">
        <div className="space-y-1">
          <Label>Mês de Referência</Label>
          <Input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="w-48"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta de Faturamento por Filial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {BRANCHES.map(b => (
              <div key={b.id} className="flex items-center gap-3">
                <Label className="w-28 shrink-0">{b.name}</Label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    className="pl-9"
                    placeholder="0,00"
                    value={metas[b.id] ?? ''}
                    onChange={e => setMetas(m => ({ ...m, [b.id]: e.target.value }))}
                  />
                </div>
              </div>
            ))}

            <Button className="w-full mt-2" onClick={handleSave}>Salvar Metas</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
