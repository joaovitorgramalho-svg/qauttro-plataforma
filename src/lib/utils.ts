import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function parseBrDate(str: string): Date | null {
  if (!str) return null
  const [day, month, year] = str.split('.')
  if (!day || !month || !year) return null
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export function fixExcelDateSerial(value: number | string): number {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 0
  // Excel serial dates are typically > 40000, convert back to currency
  // This bug happens when Excel auto-formats a number as a date
  // We detect it and return 0 (invalid) so the UI can show a warning
  if (num > 40000 && num < 50000) return 0
  return num
}
