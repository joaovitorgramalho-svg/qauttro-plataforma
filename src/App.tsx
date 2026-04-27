import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { FilterProvider } from '@/context/FilterContext'

import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import SalesDashboard from '@/pages/SalesDashboard'
import VendasDoDia from '@/pages/VendasDoDia'
import ProdutosDashboard from '@/pages/ProdutosDashboard'
import PipelineDashboard from '@/pages/PipelineDashboard'
import FinanceiroDashboard from '@/pages/FinanceiroDashboard'
import DREDashboard from '@/pages/DREDashboard'
import EntradaVendas from '@/pages/EntradaVendas'
import EntradaFinanceiro from '@/pages/EntradaFinanceiro'
import EntradaMetas from '@/pages/EntradaMetas'
import Usuarios from '@/pages/Usuarios'
import Atendentes from '@/pages/Atendentes'
import Tarefas from '@/pages/Tarefas'
import Configuracoes from '@/pages/Configuracoes'
import QuattroIA from '@/pages/QuattroIA'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <FilterProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><SalesDashboard /></ProtectedRoute>} />
        <Route path="/vendas-dia" element={<ProtectedRoute><VendasDoDia /></ProtectedRoute>} />
        <Route path="/produtos" element={<ProtectedRoute><ProdutosDashboard /></ProtectedRoute>} />
        <Route path="/pipeline" element={<ProtectedRoute><PipelineDashboard /></ProtectedRoute>} />
        <Route path="/financeiro" element={<ProtectedRoute><FinanceiroDashboard /></ProtectedRoute>} />
        <Route path="/dre" element={<ProtectedRoute><DREDashboard /></ProtectedRoute>} />

        <Route path="/entrada-vendas" element={<ProtectedRoute><EntradaVendas /></ProtectedRoute>} />
        <Route path="/entrada-financeiro" element={<ProtectedRoute><EntradaFinanceiro /></ProtectedRoute>} />
        <Route path="/entrada-metas" element={<ProtectedRoute><EntradaMetas /></ProtectedRoute>} />

        <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/atendentes" element={<ProtectedRoute><Atendentes /></ProtectedRoute>} />
        <Route path="/tarefas" element={<ProtectedRoute><Tarefas /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
        <Route path="/quattroia" element={<ProtectedRoute><QuattroIA /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </FilterProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
