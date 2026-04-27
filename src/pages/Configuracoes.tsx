import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { BRANCHES } from '@/types'
import { CheckCircle2, FileSpreadsheet, AlertCircle, Trash2, UserCheck, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Configuracoes() {
  const queryClient = useQueryClient()
  const { data: status, refetch } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  const [draggingFunc, setDraggingFunc] = useState(false)
  const [uploadingFunc, setUploadingFunc] = useState(false)
  const [funcLoaded, setFuncLoaded] = useState<{ total: number; sample: string[] } | null>(null)

  const [draggingOrc, setDraggingOrc] = useState(false)
  const [uploadingOrc, setUploadingOrc] = useState(false)
  const [orcLoaded, setOrcLoaded] = useState<{ total: number; converted: number; dateRange: { from: string; to: string } | null } | null>(null)

  async function uploadFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Arquivo inválido. Envie um arquivo .xlsx, .xls ou .csv.')
      return
    }
    setUploading(true)
    setWarnings([])
    try {
      const result = await api.upload(file)
      if (result.success) {
        const rowsInfo = result.totalRawRows != null ? ` (${result.totalRawRows.toLocaleString('pt-BR')} linhas lidas)` : ''
        toast.success(`Planilha carregada: ${result.totalOrders} pedidos, ${result.totalAttendants} atendentes.${rowsInfo}`)
        if (result.warnings.length > 0) setWarnings(result.warnings)
        await refetch()
        queryClient.invalidateQueries()
      }
    } catch {
      toast.error('Falha no upload. Verifique se o servidor está rodando.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  async function uploadFuncionarios(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Arquivo inválido. Envie um arquivo .xlsx, .xls ou .csv.')
      return
    }
    setUploadingFunc(true)
    try {
      const result = await api.uploadFuncionarios(file)
      if (result.success) {
        setFuncLoaded({ total: result.totalAttendants, sample: result.sample })
        await refetch()
        queryClient.invalidateQueries()
        toast.success(`${result.totalAttendants} atendentes carregados.`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Try to extract the server's error detail
      const detail = msg.includes('400')
        ? 'Colunas não reconhecidas. O arquivo deve ter CDFUN e NOMEFUN (ou similar).'
        : msg.includes('fetch') || msg.includes('Failed')
          ? 'Servidor não encontrado. Confirme que o backend está rodando na porta 3001.'
          : msg
      toast.error(detail)
    } finally {
      setUploadingFunc(false)
    }
  }

  const handleDropFunc = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDraggingFunc(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFuncionarios(file)
  }, [])

  const handleFileInputFunc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFuncionarios(file)
    e.target.value = ''
  }

  async function uploadOrcamentos(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Arquivo inválido. Envie um arquivo .xlsx, .xls ou .csv.')
      return
    }
    setUploadingOrc(true)
    try {
      const result = await api.uploadOrcamentos(file)
      if (result.success) {
        setOrcLoaded({ total: result.totalBudgets, converted: result.totalConverted, dateRange: result.dateRange })
        await refetch()
        queryClient.invalidateQueries()
        toast.success(`${result.totalBudgets} orçamentos carregados (${result.totalConverted} convertidos).`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg.includes('fetch') || msg.includes('Failed') ? 'Servidor não encontrado.' : msg)
    } finally {
      setUploadingOrc(false)
    }
  }

  const handleDropOrc = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDraggingOrc(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadOrcamentos(file)
  }, [])

  const handleFileInputOrc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadOrcamentos(file)
    e.target.value = ''
  }

  return (
    <DashboardLayout title="Configurações" showFilters={false}>
      <div className="max-w-2xl space-y-6">

        {/* Upload VENDAS */}
        <Card>
          <CardHeader>
            <CardTitle>Upload da Planilha de Vendas</CardTitle>
            <CardDescription>
              Faça o upload do arquivo Excel com os dados de vendas (aba VENDAS do Google Sheets).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors',
                dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              )}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={handleFileInput} />
              {uploading ? (
                <>
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-3 text-sm font-medium">Processando planilha...</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                  <p className="mt-1 text-xs text-muted-foreground">.xlsx, .xls ou .csv</p>
                </>
              )}
            </label>

            {status?.loaded && (
              <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-green-800">Planilha carregada</p>
                  <p className="text-green-700 mt-0.5">
                    {status.totalOrders} pedidos · {status.totalItems} fórmulas · {status.totalAttendants} atendentes
                  </p>
                  {status.dateRange && (
                    <p className="text-green-600 text-xs mt-0.5">
                      Período: {status.dateRange.from} → {status.dateRange.to}
                    </p>
                  )}
                  {status.loadedAt && (
                    <p className="text-green-500 text-xs mt-0.5">
                      Carregado em: {new Date(status.loadedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={async () => {
                    await api.reset()
                    setWarnings([])
                    await refetch()
                    queryClient.invalidateQueries()
                    toast.success('Dados zerados.')
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Zerar
                </Button>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  Avisos durante o processamento:
                </div>
                <ul className="text-xs text-yellow-700 space-y-0.5 ml-6 list-disc">
                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload FUNCIONARIOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Upload de Atendentes
            </CardTitle>
            <CardDescription>
              Exporte a aba <strong>FUNCIONARIOS</strong> do Google Sheets como arquivo .xlsx separado
              e faça o upload aqui. O arquivo deve ter as colunas <strong>CDFUN</strong> e <strong>NOMEFUN</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors',
                draggingFunc ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              )}
              onDragOver={e => { e.preventDefault(); setDraggingFunc(true) }}
              onDragLeave={() => setDraggingFunc(false)}
              onDrop={handleDropFunc}
            >
              <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={handleFileInputFunc} />
              {uploadingFunc ? (
                <>
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-3 text-sm font-medium">Processando atendentes...</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Arraste o arquivo de atendentes aqui ou clique para selecionar</p>
                  <p className="mt-1 text-xs text-muted-foreground">.xlsx, .xls ou .csv — aba FUNCIONARIOS</p>
                </>
              )}
            </label>

            {funcLoaded && (
              <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">{funcLoaded.total} atendentes carregados</p>
                  {funcLoaded.sample.length > 0 && (
                    <p className="text-green-700 mt-0.5 text-xs">
                      Ex: {funcLoaded.sample.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload ORÇAMENTOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Upload de Orçamentos
            </CardTitle>
            <CardDescription>
              Exporte a aba <strong>ORÇAMENTOS</strong> do Google Sheets como arquivo .xlsx e faça o upload aqui.
              Os dados alimentam o funil de conversão no Pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors',
                draggingOrc ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              )}
              onDragOver={e => { e.preventDefault(); setDraggingOrc(true) }}
              onDragLeave={() => setDraggingOrc(false)}
              onDrop={handleDropOrc}
            >
              <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={handleFileInputOrc} />
              {uploadingOrc ? (
                <>
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-3 text-sm font-medium">Processando orçamentos...</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Arraste o arquivo de orçamentos aqui ou clique para selecionar</p>
                  <p className="mt-1 text-xs text-muted-foreground">.xlsx, .xls ou .csv — aba ORÇAMENTOS</p>
                </>
              )}
            </label>

            {(orcLoaded || (status?.totalBudgets != null && status.totalBudgets > 0)) && (
              <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">
                    {orcLoaded?.total ?? status?.totalBudgets} orçamentos carregados
                  </p>
                  {orcLoaded && (
                    <p className="text-green-700 mt-0.5 text-xs">
                      {orcLoaded.converted} convertidos
                      {orcLoaded.dateRange ? ` · ${orcLoaded.dateRange.from} → ${orcLoaded.dateRange.to}` : ''}
                    </p>
                  )}
                  {status?.budgetsLoadedAt && (
                    <p className="text-green-500 text-xs mt-0.5">
                      Carregado em: {new Date(status.budgetsLoadedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filiais */}
        <Card>
          <CardHeader>
            <CardTitle>Filiais Configuradas</CardTitle>
            <CardDescription>Mapeamento dos códigos CDFIL para nomes das filiais.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {BRANCHES.map(b => (
                <div key={b.id} className="flex items-center justify-between rounded-md border px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">CDFIL={b.id}</Badge>
                    <span className="text-sm font-medium">{b.name}</span>
                  </div>
                  <Badge variant="secondary">{b.code}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Confirme com a farmácia quais códigos correspondem a cada filial e ajuste em{' '}
              <code className="bg-muted px-1 rounded">src/types/index.ts</code>.
            </p>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
