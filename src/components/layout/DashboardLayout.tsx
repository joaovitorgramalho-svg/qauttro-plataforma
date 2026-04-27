import { ReactNode, useState } from 'react'
import { Menu } from 'lucide-react'
import { AppSidebar } from './AppSidebar'
import { GlobalFilters } from './GlobalFilters'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showFilters?: boolean
  actions?: ReactNode
}

export function DashboardLayout({ children, title, subtitle, showFilters = true, actions }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:flex',
          sidebarOpen ? 'flex' : 'hidden'
        )}
      >
        <AppSidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 border-b bg-background px-4 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold leading-none truncate">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {showFilters && <GlobalFilters />}
            {actions}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
