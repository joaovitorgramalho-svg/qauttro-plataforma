export interface Branch {
  id: number
  name: string
  code: string
}

export const BRANCHES: Branch[] = [
  { id: 1, name: 'Quattro', code: 'QTT' },
  { id: 2, name: 'WhatsApp', code: 'WPP' },
  { id: 3, name: 'Bessa', code: 'BSS' },
  { id: 4, name: 'Centro', code: 'CTR' },
]

export function getBranchName(id: number): string {
  return BRANCHES.find(b => b.id === id)?.name ?? `Filial ${id}`
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  branchId?: number
}
