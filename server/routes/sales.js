import { Router } from 'express'
import {
  getSummary, getSalesByMonth, getSalesByBranch,
  getSalesByAttendant, getSalesByDay, getSalesByHour, getOrders,
} from '../aggregators/sales.js'

const router = Router()

router.get('/summary', (req, res) => res.json(getSummary(req.query)))
router.get('/by-month', (req, res) => res.json(getSalesByMonth(req.query)))
router.get('/by-branch', (req, res) => res.json(getSalesByBranch(req.query)))
router.get('/by-attendant', (req, res) => res.json(getSalesByAttendant(req.query)))
router.get('/by-day', (req, res) => res.json(getSalesByDay(req.query)))
router.get('/by-hour', (req, res) => res.json(getSalesByHour(req.query)))
router.get('/orders', (req, res) => res.json(getOrders(req.query)))

export default router
