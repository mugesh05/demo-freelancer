import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { db, uploadsDir } from '../db.js'
import { requireAuth, requireRole, safeJson, sanitizeUser } from '../middleware/auth.js'

const router = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed.'))
    cb(null, true)
  },
})

function computeProfileCompletion(u) {
  let score = 0
  if (u.name) score += 15
  if (u.title) score += 15
  if (u.bio && u.bio.length > 20) score += 20
  if (u.location) score += 10
  if (safeJson(u.skills_json, []).length > 0) score += 15
  if (u.education || safeJson(u.experience_json, []).length > 0) score += 10
  if (safeJson(u.portfolio_json, []).length > 0 || u.avatar_url) score += 15
  return Math.min(100, score)
}

router.get('/dashboard', requireAuth, (req, res) => {
  const uid = req.user.id
  const recentNotifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(uid)
  const unreadNotifications = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(uid).c
  const recentConversations = db.prepare(`
    SELECT c.id, c.updated_at,
           CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END as peer_name,
           CASE WHEN c.user1_id = ? THEN u2.initials ELSE u1.initials END as peer_initials,
           (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) as last_message,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
    FROM conversations c
    JOIN users u1 ON u1.id = c.user1_id
    JOIN users u2 ON u2.id = c.user2_id
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY c.updated_at DESC LIMIT 4
  `).all(uid, uid, uid, uid, uid)

  if (req.user.role === 'freelancer') {
    const stats = {
      totalApplications: db.prepare('SELECT COUNT(*) as c FROM applications WHERE freelancer_id = ?').get(uid).c,
      activeOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE freelancer_id = ? AND status IN ('requirements', 'in_progress', 'in_revision', 'delivered')").get(uid).c,
      completedOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE freelancer_id = ? AND status = 'completed'").get(uid).c,
      verifiedEarnings: db.prepare("SELECT COALESCE(SUM(net_amount), 0) as s FROM payments WHERE payee_id = ? AND status = 'verified_paid'").get(uid).s,
      pendingEarnings: db.prepare("SELECT COALESCE(SUM(net_amount), 0) as s FROM payments WHERE payee_id = ? AND status IN ('pending_gateway', 'requires_action')").get(uid).s,
      activeGigs: db.prepare("SELECT COUNT(*) as c FROM gigs WHERE seller_id = ? AND status = 'active'").get(uid).c,
      profileCompletion: computeProfileCompletion(req.user),
    }
    return res.json({ role: 'freelancer', stats, recentNotifications, unreadNotifications, recentConversations })
  }

  const stats = {
    postedProjects: db.prepare('SELECT COUNT(*) as c FROM projects WHERE client_id = ?').get(uid).c,
    totalApplications: db.prepare('SELECT COUNT(*) as c FROM applications a JOIN projects p ON p.id = a.project_id WHERE p.client_id = ?').get(uid).c,
    activeHires: db.prepare("SELECT COUNT(*) as c FROM orders WHERE client_id = ? AND status IN ('requirements', 'in_progress', 'in_revision', 'delivered')").get(uid).c,
    completedProjects: db.prepare("SELECT COUNT(*) as c FROM orders WHERE client_id = ? AND status = 'completed'").get(uid).c,
    totalSpentVerified: db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE payer_id = ? AND status = 'verified_paid'").get(uid).s,
  }
  res.json({ role: 'client', stats, recentNotifications, unreadNotifications, recentConversations })
})

router.put('/profile', requireAuth, (req, res) => {
  const { name, title, tagline, bio, location, hourly_rate, experience_level, availability, skills, education, experience, portfolio, languages } = req.body || {}
  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      title = COALESCE(?, title),
      tagline = COALESCE(?, tagline),
      bio = COALESCE(?, bio),
      location = COALESCE(?, location),
      hourly_rate = COALESCE(?, hourly_rate),
      experience_level = COALESCE(?, experience_level),
      availability = COALESCE(?, availability),
      skills_json = COALESCE(?, skills_json),
      education = COALESCE(?, education),
      experience_json = COALESCE(?, experience_json),
      portfolio_json = COALESCE(?, portfolio_json),
      languages_json = COALESCE(?, languages_json)
    WHERE id = ?
  `).run(
    name?.trim() || null, title ?? null, tagline ?? null, bio ?? null, location ?? null,
    hourly_rate !== undefined ? Number(hourly_rate) : null,
    ['entry', 'intermediate', 'expert'].includes(experience_level) ? experience_level : null,
    ['available', 'busy', 'unavailable'].includes(availability) ? availability : null,
    Array.isArray(skills) ? JSON.stringify(skills) : null,
    education ?? null,
    Array.isArray(experience) ? JSON.stringify(experience) : null,
    Array.isArray(portfolio) ? JSON.stringify(portfolio) : null,
    Array.isArray(languages) ? JSON.stringify(languages) : null,
    req.user.id
  )
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ user: sanitizeUser(updated) })
})

router.post('/profile/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please select a valid image file.' })
  const url = `/uploads/${req.file.filename}`
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(url, req.user.id)
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ avatar_url: url, user: sanitizeUser(updated) })
})

router.post('/uploads/image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please select a valid image file.' })
  res.status(201).json({ url: `/uploads/${req.file.filename}`, filename: req.file.originalname })
})

// Orders
router.get('/orders', requireAuth, (req, res) => {
  const col = req.user.role === 'freelancer' ? 'o.freelancer_id' : 'o.client_id'
  const items = db.prepare(`
    SELECT o.*, c.name as client_name, f.name as freelancer_name,
           (SELECT COUNT(*) FROM reviews r WHERE r.order_id = o.id AND r.reviewer_id = ?) as reviewed_by_me
    FROM orders o
    JOIN users c ON c.id = o.client_id
    JOIN users f ON f.id = o.freelancer_id
    WHERE ${col} = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id, req.user.id)
  res.json({ items })
})

router.post('/orders', requireAuth, requireRole('client'), (req, res) => {
  const { gig_id, package_name = 'Standard' } = req.body || {}
  const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(Number(gig_id))
  if (!gig) return res.status(404).json({ error: 'Service not found.' })
  if (gig.seller_id === req.user.id) return res.status(400).json({ error: 'You cannot order your own service.' })

  const pkgs = safeJson(gig.packages_json, [])
  const pkg = pkgs.find((p) => p.key === package_name) || pkgs[0] || { key: 'Basic', price: gig.price, delivery: gig.delivery_days }
  const due = new Date(Date.now() + (pkg.delivery || 5) * 86400000).toISOString().slice(0, 10)
  const code = `SK-${Math.floor(1030 + Math.random() * 8900)}`

  const orderRes = db.prepare(`
    INSERT INTO orders (order_code, gig_id, client_id, freelancer_id, title, package_name, amount, status, due_date, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?)
  `).run(code, gig.id, req.user.id, gig.seller_id, gig.title, pkg.key, pkg.price, due, gig.cover_image)

  const fee = Math.round(pkg.price * 0.1)
  db.prepare(`
    INSERT INTO payments (order_id, payer_id, payee_id, amount, platform_fee, net_amount, gateway_provider, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_gateway')
  `).run(orderRes.lastInsertRowid, req.user.id, gig.seller_id, pkg.price, fee, pkg.price - fee, process.env.STRIPE_SECRET_KEY ? 'stripe_connect' : 'stripe_unconfigured')

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'order', 'New order received', ?, '/orders')
  `).run(gig.seller_id, `${req.user.name} placed order #${code} ($${pkg.price}).`)

  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRes.lastInsertRowid)
  res.status(201).json({ order: created })
})

router.put('/orders/:id/status', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.client_id !== req.user.id && order.freelancer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' })
  }
  const { status, deliverables_note } = req.body || {}
  const allowed = ['in_progress', 'in_revision', 'delivered', 'completed', 'cancelled']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid order status.' })

  if (status === 'delivered' && req.user.id !== order.freelancer_id) {
    return res.status(403).json({ error: 'Only the assigned freelancer can mark an order delivered.' })
  }
  if (status === 'completed' && req.user.id !== order.client_id) {
    return res.status(403).json({ error: 'Only the client can approve and complete an order.' })
  }

  db.prepare('UPDATE orders SET status = ?, deliverables_note = COALESCE(?, deliverables_note) WHERE id = ?').run(status, deliverables_note || null, order.id)
  if (status === 'completed' && order.project_id) {
    db.prepare("UPDATE projects SET status = 'completed', progress = 100 WHERE id = ?").run(order.project_id)
  }

  const targetId = req.user.id === order.client_id ? order.freelancer_id : order.client_id
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'order', 'Order status updated', ?, '/orders')
  `).run(targetId, `Order #${order.order_code} was updated to ${status.replace('_', ' ')}.`)

  res.json({ ok: true, status })
})

router.post('/orders/:id/review', requireAuth, requireRole('client'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!order || order.client_id !== req.user.id) return res.status(404).json({ error: 'Order not found.' })
  if (order.status !== 'completed') return res.status(400).json({ error: 'You can only review completed orders.' })

  const { rating, comment } = req.body || {}
  const numRating = Number(rating)
  if (!numRating || numRating < 1 || numRating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' })
  if (!comment || comment.trim().length < 5) return res.status(400).json({ error: 'Please write a short review comment.' })

  const exists = db.prepare('SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?').get(order.id, req.user.id)
  if (exists) return res.status(409).json({ error: 'You already reviewed this order.' })

  db.prepare(`
    INSERT INTO reviews (order_id, project_id, gig_id, reviewer_id, reviewee_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(order.id, order.project_id, order.gig_id, req.user.id, order.freelancer_id, numRating, comment.trim())

  const stats = db.prepare('SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE reviewee_id = ?').get(order.freelancer_id)
  db.prepare('UPDATE users SET rating = ?, review_count = ? WHERE id = ?').run(Number(stats.avg_r.toFixed(1)), stats.cnt, order.freelancer_id)

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'review', 'New client review', ?, '/my-profile')
  `).run(order.freelancer_id, `${req.user.name} left a ${numRating}-star review on #${order.order_code}.`)

  res.status(201).json({ ok: true })
})

// Conversations & Messages
router.get('/conversations', requireAuth, (req, res) => {
  const uid = req.user.id
  const items = db.prepare(`
    SELECT c.*,
           CASE WHEN c.user1_id = ? THEN u2.id ELSE u1.id END as peer_id,
           CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END as peer_name,
           CASE WHEN c.user1_id = ? THEN u2.initials ELSE u1.initials END as peer_initials,
           CASE WHEN c.user1_id = ? THEN u2.tint ELSE u1.tint END as peer_tint,
           CASE WHEN c.user1_id = ? THEN u2.title ELSE u1.title END as peer_title,
           o.order_code, o.title as order_title, o.amount as order_amount,
           (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) as last_time,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
    FROM conversations c
    JOIN users u1 ON u1.id = c.user1_id
    JOIN users u2 ON u2.id = c.user2_id
    LEFT JOIN orders o ON o.id = c.order_id
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY c.updated_at DESC
  `).all(uid, uid, uid, uid, uid, uid, uid, uid)
  res.json({ items })
})

router.post('/conversations', requireAuth, (req, res) => {
  const peerId = Number(req.body?.peer_id)
  if (!peerId || peerId === req.user.id) return res.status(400).json({ error: 'Valid recipient is required.' })

  const existing = db.prepare(`
    SELECT * FROM conversations
    WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
  `).get(req.user.id, peerId, peerId, req.user.id)

  if (existing) return res.json({ conversation: existing })

  const result = db.prepare('INSERT INTO conversations (user1_id, user2_id, order_id, project_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, peerId, req.body?.order_id || null, req.body?.project_id || null
  )
  const created = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ conversation: created })
})

router.get('/conversations/:id/messages', requireAuth, (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(Number(req.params.id))
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' })
  if (conv.user1_id !== req.user.id && conv.user2_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' })
  }

  db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?').run(conv.id, req.user.id)
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.initials as sender_initials
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? ORDER BY m.id ASC
  `).all(conv.id)
  res.json({ messages })
})

router.post('/conversations/:id/messages', requireAuth, (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(Number(req.params.id))
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' })
  if (conv.user1_id !== req.user.id && conv.user2_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' })
  }
  const content = String(req.body?.content || '').trim()
  if (!content) return res.status(400).json({ error: 'Message cannot be empty.' })

  const result = db.prepare('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)').run(conv.id, req.user.id, content)
  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conv.id)

  const peerId = conv.user1_id === req.user.id ? conv.user2_id : conv.user1_id
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'message', ?, ?, '/messages')
  `).run(peerId, `New message from ${req.user.name}`, content.slice(0, 100))

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ message: msg })
})

// Notifications
router.get('/notifications', requireAuth, (req, res) => {
  const items = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(req.user.id)
  const unread = items.filter((n) => !n.is_read).length
  res.json({ items, unread })
})

router.put('/notifications/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id)
  res.json({ ok: true })
})

router.put('/notifications/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id)
  res.json({ ok: true })
})

// Payments & Transaction History
router.get('/payments', requireAuth, (req, res) => {
  const items = db.prepare(`
    SELECT p.*, o.order_code, o.title as order_title, payer.name as payer_name, payee.name as payee_name
    FROM payments p
    LEFT JOIN orders o ON o.id = p.order_id
    JOIN users payer ON payer.id = p.payer_id
    JOIN users payee ON payee.id = p.payee_id
    WHERE p.payer_id = ? OR p.payee_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id, req.user.id)

  res.json({
    items,
    gatewayConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    provider: process.env.STRIPE_SECRET_KEY ? 'stripe_connect' : 'stripe_unconfigured',
  })
})

router.post('/payments/:id/initiate', requireAuth, requireRole('client'), (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND payer_id = ?').get(Number(req.params.id), req.user.id)
  if (!payment) return res.status(404).json({ error: 'Payment record not found.' })
  if (payment.status === 'verified_paid') return res.json({ payment, message: 'Payment already verified.' })

  // Never simulate a successful real payment without a verified payment gateway response.
  if (!process.env.STRIPE_SECRET_KEY) {
    db.prepare("UPDATE payments SET status = 'requires_action', failure_reason = 'Live payment gateway (STRIPE_SECRET_KEY) is not configured on the server.' WHERE id = ?").run(payment.id)
    const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id)
    return res.status(402).json({
      error: 'Payment gateway not configured. Set STRIPE_SECRET_KEY on the server to process live payments.',
      payment: updated,
    })
  }

  res.status(501).json({ error: 'Connect your Stripe Checkout webhook handler to verify and settle live payments.' })
})

export default router
