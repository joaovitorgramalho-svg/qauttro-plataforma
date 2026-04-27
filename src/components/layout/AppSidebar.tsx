import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3, TrendingUp, Package, GitFork, DollarSign, FileText,
  ShoppingCart, Users, UserCheck, CheckSquare, Settings, Bot,
  LogOut, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const NAV_ITEMS = [
  {
    label: 'Dashboards',
    items: [
      { to: '/', icon: BarChart3, label: 'Vendas' },
      { to: '/vendas-dia', icon: TrendingUp, label: 'Vendas do Dia' },
      { to: '/produtos', icon: Package, label: 'Produtos' },
      { to: '/pipeline', icon: GitFork, label: 'Pipeline' },
      { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
      { to: '/dre', icon: FileText, label: 'DRE' },
    ],
  },
  {
    label: 'Entrada de Dados',
    items: [
      { to: '/entrada-vendas', icon: ShoppingCart, label: 'Lançar Vendas' },
      { to: '/entrada-financeiro', icon: DollarSign, label: 'Lançar Financeiro' },
      { to: '/entrada-metas', icon: TrendingUp, label: 'Definir Metas' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/usuarios', icon: Users, label: 'Usuários' },
      { to: '/atendentes', icon: UserCheck, label: 'Atendentes' },
      { to: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
      { to: '/configuracoes', icon: Settings, label: 'Configurações' },
      { to: '/quattroia', icon: Bot, label: 'Quattro IA' },
    ],
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-sidebar-foreground">Plataforma</p>
          <p className="text-xs text-sidebar-foreground/60">Quattro Farmácia</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {NAV_ITEMS.map(group => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-bold">
            {user?.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
