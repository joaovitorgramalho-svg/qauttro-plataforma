import { Router } from 'express'
import { getTop20Products, getProductTrends } from '../aggregators/products.js'

const router = Router()

router.get('/top20', (req, res) => res.json(getTop20Products(req.query)))
router.get('/trends', (req, res) => res.json(getProductTrends(req.query)))

export default router
