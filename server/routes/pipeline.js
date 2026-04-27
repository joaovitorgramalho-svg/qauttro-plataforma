import { Router } from 'express'
import { getFunnel, getPaymentBreakdown } from '../aggregators/pipeline.js'

const router = Router()

router.get('/funnel', (req, res) => res.json(getFunnel(req.query)))
router.get('/payments', (req, res) => res.json(getPaymentBreakdown(req.query)))

export default router
