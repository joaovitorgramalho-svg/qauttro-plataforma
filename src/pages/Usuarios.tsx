import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import type { User } from '@/types'
import { toast } from 'sonner'

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin Quattro', email: 'admin@quattro.com', role: 'admin' },
  { id: '2', name: 'Gerente', email: 'gerente@quattro.com', role: 'manager' },
]

function loadUsers(): User[] {
  const stored = localStorage.getItem('quattro_users')
  return stored ? JSON.parse(stored) as User[] : INITIAL_USERS
}

function saveUsers(users: User[]) {
  localStorage.setItem('quattro_users', JSON.stringify(users))
}

const ROLE_LABELS: Record<User['role'], string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  viewer: 'Visualizador',
}

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>(loadUsers)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' as User['role'] })

  function handleAdd() {
    if (!form.name || !form.email) return
    const updated = [...users, { ...form, id: crypto.randomUUID() }]
    setUsers(updated)
    saveUsers(updated)
    setOpen(false)
    setForm({ name: '', email: '', role: 'viewer' })
    toast.success('Usuário adicionado.')
  }

  function handleDelete(id: string) {
    const updated = users.filter(u => u.id !== id)
    setUsers(updated)
    saveUsers(updated)
    toast.success('Usuário removido.')
  }

  return (
    <DashboardLayout
      title="Usuários"
      showFilters={false}
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Usuário
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{users.length} usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as User['role'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
