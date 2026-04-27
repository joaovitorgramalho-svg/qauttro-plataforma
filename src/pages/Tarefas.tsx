import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: 'pending' | 'done'
  createdAt: string
}

function loadTasks(): Task[] {
  const stored = localStorage.getItem('quattro_tasks')
  return stored ? JSON.parse(stored) as Task[] : []
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem('quattro_tasks', JSON.stringify(tasks))
}

export default function Tarefas() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [newTitle, setNewTitle] = useState('')

  function handleAdd() {
    if (!newTitle.trim()) return
    const updated = [
      ...tasks,
      { id: crypto.randomUUID(), title: newTitle.trim(), status: 'pending' as const, createdAt: new Date().toISOString() },
    ]
    setTasks(updated)
    saveTasks(updated)
    setNewTitle('')
  }

  function handleToggle(id: string) {
    const updated = tasks.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } as Task : t)
    setTasks(updated)
    saveTasks(updated)
  }

  function handleDelete(id: string) {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated)
    saveTasks(updated)
    toast.success('Tarefa removida.')
  }

  const pending = tasks.filter(t => t.status === 'pending')
  const done = tasks.filter(t => t.status === 'done')

  return (
    <DashboardLayout title="Tarefas" showFilters={false}>
      <div className="max-w-2xl space-y-6">
        {/* Add task */}
        <div className="flex gap-2">
          <Input
            placeholder="Nova tarefa..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        {/* Pending */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm flex items-center gap-2">
              Pendentes
              <Badge variant="secondary">{pending.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">Nenhuma tarefa pendente.</p>
            )}
            {pending.map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded-md border p-3">
                <button
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors"
                  onClick={() => handleToggle(t.id)}
                />
                <span className="flex-1 text-sm">{t.title}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Done */}
        {done.length > 0 && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm flex items-center gap-2">
                Concluídas
                <Badge variant="outline">{done.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {done.map(t => (
                <div key={t.id} className={cn('flex items-center gap-3 rounded-md border p-3 opacity-60')}>
                  <button
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary border-2 border-primary transition-colors"
                    onClick={() => handleToggle(t.id)}
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </button>
                  <span className="flex-1 text-sm line-through">{t.title}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
