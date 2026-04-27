import { useFilters } from '@/context/FilterContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BRANCHES } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function GlobalFilters() {
  const { branch, from, to, setBranch, setDateRange, reset } = useFilters()
  const hasFilter = branch || from || to

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={branch || 'all'} onValueChange={v => setBranch(v === 'all' ? '' : v)}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Todas as filiais" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as filiais</SelectItem>
          {BRANCHES.map(b => (
            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={from}
        onChange={e => setDateRange(e.target.value, to)}
        className="h-8 w-[130px] text-xs"
        placeholder="De"
      />
      <Input
        type="date"
        value={to}
        onChange={e => setDateRange(from, e.target.value)}
        className="h-8 w-[130px] text-xs"
        placeholder="Até"
      />

      {hasFilter && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={reset}>
          <X className="h-3 w-3 mr-1" /> Limpar
        </Button>
      )}
    </div>
  )
}
