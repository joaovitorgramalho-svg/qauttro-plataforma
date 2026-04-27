import { Router } from 'express'
import multer from 'multer'
import XLSX from 'xlsx'
import { setStoreData, getStore, setBudgets } from '../data-store.js'
import { parseFuncionarios } from '../parsers/funcionarios.js'
import { parseVendas } from '../parsers/vendas.js'
import { parseOrcamentos } from '../parsers/orcamentos.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } })
const router = Router()

/**
 * Finds the FUNCIONARIOS sheet by trying name matches first,
 * then falling back to auto-detect: the sheet with only 2 columns
 * where one is numeric (CDFUN) and another is text (NOMEFUN).
 */
function findFuncionariosSheet(wb, vendasSheetName) {
  const sheetNames = wb.SheetNames
  const findByName = (name) => sheetNames.find(s => s.toUpperCase().includes(name.toUpperCase()))

  const byName =
    findByName('FUNCIONARIO') ??
    findByName('ATENDENTE') ??
    findByName('FUNC') ??
    findByName('COLABORADOR') ??
    findByName('EMPREGADO')

  if (byName) return byName

  // Auto-detect: scan non-VENDAS sheets for one with 2 columns (id + name)
  for (const name of sheetNames) {
    if (name === vendasSheetName) continue
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { raw: true, defval: null })
    if (rows.length === 0) continue
    const keys = Object.keys(rows[0])
    // Funcionarios sheet typically has 2 columns: a number and a string
    if (keys.length === 2) {
      const first = rows[0][keys[0]]
      const second = rows[0][keys[1]]
      // Accept numeric cells OR string cells that look like positive integers,
      // because Excel may export the CDFUN column as text in some configurations.
      const firstIsId = first !== null && first !== undefined && !isNaN(Number(first)) && Number(first) > 0
      if (firstIsId && typeof second === 'string') {
        console.log(`[upload] Auto-detected funcionarios sheet: "${name}" (columns: ${keys.join(', ')})`)
        return name
      }
    }
  }

  return null
}

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    // dense:true makes xlsx build a 2D array instead of a sparse cell map.
    // This avoids the common issue where !ref is truncated in large Google Sheets
    // exports, causing sheet_to_json to silently stop before the last row.
    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false, dense: true })
    const sheetNames = wb.SheetNames
    console.log('[upload] Sheets found:', sheetNames)

    const vendasSheetName =
      sheetNames.find(s => s.toUpperCase().includes('VENDA')) ?? sheetNames[0]

    const funcSheetName = findFuncionariosSheet(wb, vendasSheetName)
    console.log('[upload] Using:', { vendas: vendasSheetName, funcionarios: funcSheetName })

    // Log first row of func sheet for debugging
    if (funcSheetName) {
      const sample = XLSX.utils.sheet_to_json(wb.Sheets[funcSheetName], { raw: true, defval: null }).slice(0, 2)
      console.log('[upload] Funcionarios sample rows:', JSON.stringify(sample))
    }

    const funcSheet = funcSheetName ? wb.Sheets[funcSheetName] : null
    const attendants = funcSheet
      ? parseFuncionarios(XLSX.utils.sheet_to_json(funcSheet, { raw: true, defval: null }))
      : {}

    console.log('[upload] Attendants parsed:', Object.keys(attendants).length)

    const vendasSheet = wb.Sheets[vendasSheetName]
    console.log('[upload] Vendas sheet !ref:', vendasSheet['!ref'])

    const vendasRows = XLSX.utils.sheet_to_json(vendasSheet, { raw: true, defval: null })
    console.log('[upload] Vendas raw rows read from xlsx:', vendasRows.length)

    const { orders, warnings } = parseVendas(vendasRows, attendants)
    console.log('[upload] Orders after parse:', orders.length)

    const dates = orders.map(o => o.date).filter(Boolean).sort()
    const dateRange = dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : null

    setStoreData({ orders, attendants, loadedAt: new Date().toISOString() })

    return res.json({
      success: true,
      totalRawRows: vendasRows.length,
      totalOrders: orders.length,
      totalItems: orders.reduce((s, o) => s + o.items.length, 0),
      totalAttendants: Object.keys(attendants).length,
      dateRange,
      warnings,
      sheetsFound: sheetNames,
      sheetsUsed: { vendas: vendasSheetName, funcionarios: funcSheetName },
    })
  } catch (err) {
    console.error('[upload] Error:', err)
    return res.status(500).json({ error: 'Failed to parse file', detail: err.message })
  }
})

// Dedicated endpoint for uploading only the FUNCIONARIOS sheet
router.post('/funcionarios', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false })
    // Use first sheet (user exported just the FUNCIONARIOS tab)
    const sheetName = wb.SheetNames[0]
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: null })

    console.log('[upload/funcionarios] Sheet:', sheetName, '| Rows:', rows.length)
    if (rows.length > 0) console.log('[upload/funcionarios] First row:', JSON.stringify(rows[0]))

    const attendants = parseFuncionarios(rows)
    const total = Object.keys(attendants).length

    if (total === 0) {
      return res.status(400).json({
        error: 'Nenhum atendente encontrado. Verifique se as colunas são CDFUN e NOMEFUN.',
        firstRow: rows[0] ?? null,
      })
    }

    // Merge into store and update order names
    const store = getStore()
    for (const [id, name] of Object.entries(attendants)) {
      store.attendants[id] = name
    }
    for (const order of store.orders) {
      const name = store.attendants[order.attendantId]
      if (name) order.attendantName = name
    }

    const sample = Object.values(attendants).slice(0, 3)
    console.log(`[upload/funcionarios] Loaded ${total} attendants. Sample:`, sample)

    return res.json({ success: true, totalAttendants: total, sample })
  } catch (err) {
    console.error('[upload/funcionarios] Error:', err)
    return res.status(500).json({ error: 'Failed to parse file', detail: err.message })
  }
})

// Upload only the ORÇAMENTOS sheet
router.post('/orcamentos', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false, dense: true })
    // Try to find the ORÇAMENTOS sheet; fall back to first sheet
    const sheetName =
      wb.SheetNames.find(s => s.toUpperCase().includes('ORC') || s.toUpperCase().includes('ORÇ')) ??
      wb.SheetNames[0]

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: null })
    console.log('[upload/orcamentos] Sheet:', sheetName, '| Rows:', rows.length)
    if (rows.length > 0) console.log('[upload/orcamentos] First row:', JSON.stringify(rows[0]))

    const budgets = parseOrcamentos(rows)
    setBudgets(budgets)

    const dates = budgets.map(b => b.date).filter(Boolean).sort()
    const dateRange = dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : null
    const totalConverted = budgets.filter(b => b.converted).length

    console.log(`[upload/orcamentos] Loaded ${budgets.length} budgets, ${totalConverted} converted.`)

    return res.json({
      success: true,
      totalBudgets: budgets.length,
      totalConverted,
      dateRange,
      sheetUsed: sheetName,
    })
  } catch (err) {
    console.error('[upload/orcamentos] Error:', err)
    return res.status(500).json({ error: 'Failed to parse file', detail: err.message })
  }
})

export default router
