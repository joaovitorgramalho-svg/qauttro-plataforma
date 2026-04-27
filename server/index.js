import express from 'express'
import cors from 'cors'
import { getStore, resetStore } from './data-store.js'
import uploadRouter from './routes/upload.js'
import salesRouter from './routes/sales.js'
import productsRouter from './routes/products.js'
import pipelineRouter from './routes/pipeline.js'
import atendentesRouter from './routes/atendentes.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

// Status endpoint
app.get('/api/status', (req, res) => {
  const store = getStore()
  if (!store.loaded) {
    return res.json({ loaded: false, loadedAt: null, totalOrders: 0, totalItems: 0, totalAttendants: 0, dateRange: null })
  }
  const dates = store.orders.map(o => o.date).filter(Boolean).sort()
  res.json({
    loaded: true,
    loadedAt: store.loadedAt,
    totalOrders: store.orders.length,
    totalItems: store.orders.reduce((s, o) => s + o.items.length, 0),
    totalAttendants: Object.keys(store.attendants).length,
    dateRange: dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : null,
  })
})

// Reset endpoint — clears in-memory data without restarting
app.post('/api/reset', (req, res) => {
  resetStore()
  console.log('[server] Data store reset.')
  res.json({ success: true })
})

app.use('/api/upload', uploadRouter)
app.use('/api/sales', salesRouter)
app.use('/api/products', productsRouter)
app.use('/api/pipeline', pipelineRouter)
app.use('/api/atendentes', atendentesRouter)

app.use((req, res) => res.status(404).json({ error: 'Not found' }))

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`[server] Plataforma Quattro backend running on http://localhost:${PORT}`)
})
