import { createContext, useContext, useState, ReactNode } from 'react'

interface FilterState {
  branch: string // '' = todas
  from: string   // ISO date string or ''
  to: string
}

interface FilterContextValue extends FilterState {
  setBranch: (v: string) => void
  setDateRange: (from: string, to: string) => void
  reset: () => void
  toParams: () => Record<string, string | undefined>
}

const FilterContext = createContext<FilterContextValue | null>(null)

const DEFAULT: FilterState = { branch: '', from: '', to: '' }

export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FilterState>(DEFAULT)

  function setBranch(v: string) {
    setState(s => ({ ...s, branch: v }))
  }

  function setDateRange(from: string, to: string) {
    setState(s => ({ ...s, from, to }))
  }

  function reset() {
    setState(DEFAULT)
  }

  function toParams() {
    return {
      branch: state.branch || undefined,
      from: state.from || undefined,
      to: state.to || undefined,
    }
  }

  return (
    <FilterContext.Provider value={{ ...state, setBranch, setDateRange, reset, toParams }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be inside FilterProvider')
  return ctx
}
