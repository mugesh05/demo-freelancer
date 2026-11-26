import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireRole, safeJson, sanitizeUser } from '../middleware/auth.js'

const router = Router()

// All admin routes require 'admin' role
router.use(requireAuth, requireRole('admin'))

router.get('/stats', (_req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c
  const totalFreelancers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'freelancer'").get().c
  const totalClients = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'client'").get().c
  const activeGigs = db.prepare("SELECT COUNT(*) as c FROM gigs WHERE status = 'active'").get().c
  const openProjects = db.prepare("SELECT COUNT(*) as c FROM projects WHERE status = 'open'").get().c
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c
  const inEscrowOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE escrow_status = 'in_escrow'").get().c
  const activeDisputes = db.prepare("SELECT COUNT(*) as c FROM disputes WHERE status IN ('open', 'under_review')").get().c
  
  // Volume locked in escrow
  const escrowVolume = db.prepare(`
    SELECT currency, COALESCE(SUM(amount), 0) as total
    FROM orders
    WHERE escrow_status IN ('in_escrow', 'work_delivered', 'disputed')
    GROUP BY currency
  `).all()

  // Total fees collected
  const feesCollected = db.prepare(`
    SELECT crypto_currency as currency, COALESCE(SUM(platform_fee), 0) as total
    FROM payments
    WHERE status = 'verified_paid'
    GROUP BY crypto_currency
  `).all()

  res.json({
    totalUsers,
    totalFreelancers,
    totalClients,
    activeGigs,
    openProjects,
    totalOrders,
    inEscrowOrders,
    activeDisputes,
    escrowVolume,
    feesCollected,
  })
})

router.get('/users', (_req, res) => {
  const items = db.prepare(`
    SELECT id, name, email, role, secondary_role, wallet_address, wallet_network, location, rating, review_count, created_at
    FROM users
    ORDER BY id ASC
  `).all()
  res.json({ items })
})

router.put('/users/:id/role', (req, res) => {
  const { role } = req.body || {}
  if (!['client', 'freelancer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' })
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, Number(req.params.id))
  res.json({ ok: true, role })
})

router.get('/disputes', (_req, res) => {
  const items = db.prepare(`
    SELECT d.*, o.order_code, o.title as order_title, o.amount, o.currency, o.crypto_network,
           o.escrow_status, o.escrow_tx_hash, o.client_id, o.freelancer_id,
           u_init.name as initiator_name,
           u_client.name as client_name, u_client.wallet_address as client_wallet,
           u_free.name as freelancer_name, u_free.wallet_address as freelancer_wallet
    FROM disputes d
    JOIN orders o ON o.id = d.order_id
    JOIN users u_init ON u_init.id = d.initiator_id
    JOIN users u_client ON u_client.id = o.client_id
    JOIN users u_free ON u_free.id = o.freelancer_id
    ORDER BY d.created_at DESC
  `).all().map((row) => ({
    ...row,
    evidence: safeJson(row.evidence_json, []),
  }))
  res.json({ items })
})

router.put('/disputes/:id/resolve', (req, res) => {
  const { resolution, admin_notes = '' } = req.body || {}
  if (!['release_to_freelancer', 'refund_to_client'].includes(resolution)) {
    return res.status(400).json({ error: 'Valid resolution action is required.' })
  }

  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(Number(req.params.id))
  if (!dispute) return res.status(404).json({ error: 'Dispute not found.' })

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id)
  if (!order) return res.status(404).json({ error: 'Associated order not found.' })

  const newStatus = resolution === 'release_to_freelancer' ? 'resolved_released' : 'resolved_refunded'
  const newEscrow = resolution === 'release_to_freelancer' ? 'approved_released' : 'refunded'
  const newOrder = resolution === 'release_to_freelancer' ? 'completed' : 'cancelled'
  const newPayStatus = resolution === 'release_to_freelancer' ? 'verified_paid' : 'refunded'

  db.prepare(`
    UPDATE disputes
    SET status = ?, admin_notes = ?, resolved_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newStatus, admin_notes, req.user.id, dispute.id)

  db.prepare('UPDATE orders SET status = ?, escrow_status = ? WHERE id = ?').run(newOrder, newEscrow, order.id)
  db.prepare('UPDATE payments SET status = ? WHERE order_id = ?').run(newPayStatus, order.id)

  const bodyMsg = resolution === 'release_to_freelancer'
    ? `Dispute on order #${order.order_code} was resolved. Funds of ${order.amount} ${order.currency} were released to the freelancer.`
    : `Dispute on order #${order.order_code} was resolved. Funds of ${order.amount} ${order.currency} were refunded to the client.`

  db.prepare('INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)').run(order.client_id, 'escrow', 'Dispute Resolved', bodyMsg, '/orders')
  db.prepare('INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)').run(order.freelancer_id, 'escrow', 'Dispute Resolved', bodyMsg, '/orders')

  res.json({ ok: true, status: newStatus, escrow_status: newEscrow })
})

router.get('/orders', (_req, res) => {
  const items = db.prepare(`
    SELECT o.*, c.name as client_name, f.name as freelancer_name
    FROM orders o
    JOIN users c ON c.id = o.client_id
    JOIN users f ON f.id = o.freelancer_id
    ORDER BY o.created_at DESC LIMIT 50
  `).all()
  res.json({ items })
})

router.get('/transactions', (_req, res) => {
  const items = db.prepare(`
    SELECT p.*, o.order_code, payer.name as payer_name, payee.name as payee_name
    FROM payments p
    LEFT JOIN orders o ON o.id = p.order_id
    JOIN users payer ON payer.id = p.payer_id
    JOIN users payee ON payee.id = p.payee_id
    ORDER BY p.created_at DESC LIMIT 50
  `).all()
  res.json({ items })
})

export default router
