import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { db, uploadsDir, BLOCK_EXPLORERS } from '../db.js'
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
  if (u.bio && u.bio.length > 20) score += 15
  if (u.location) score += 10
  if (u.wallet_address) score += 15
  if (safeJson(u.skills_json, []).length > 0) score += 15
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
    const earningsByCrypto = db.prepare(`
      SELECT crypto_currency, COALESCE(SUM(net_amount), 0) as total
      FROM payments WHERE payee_id = ? AND status = 'verified_paid'
      GROUP BY crypto_currency
    `).all(uid)

    const pendingEscrowByCrypto = db.prepare(`
      SELECT currency as crypto_currency, COALESCE(SUM(amount), 0) as total
      FROM orders WHERE freelancer_id = ? AND escrow_status IN ('in_escrow', 'work_delivered')
      GROUP BY currency
    `).all(uid)

    const stats = {
      totalApplications: db.prepare('SELECT COUNT(*) as c FROM applications WHERE freelancer_id = ?').get(uid).c,
      activeOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE freelancer_id = ? AND status IN ('requirements', 'in_progress', 'in_revision', 'delivered')").get(uid).c,
      completedOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE freelancer_id = ? AND status = 'completed'").get(uid).c,
      earningsByCrypto,
      pendingEscrowByCrypto,
      activeGigs: db.prepare("SELECT COUNT(*) as c FROM gigs WHERE seller_id = ? AND status = 'active'").get(uid).c,
      profileCompletion: computeProfileCompletion(req.user),
    }
    return res.json({ role: 'freelancer', stats, recentNotifications, unreadNotifications, recentConversations })
  }

  // Client Dashboard stats
  const spendByCrypto = db.prepare(`
    SELECT crypto_currency, COALESCE(SUM(amount), 0) as total
    FROM payments WHERE payer_id = ? AND status = 'verified_paid'
    GROUP BY crypto_currency
  `).all(uid)

  const activeEscrowByCrypto = db.prepare(`
    SELECT currency as crypto_currency, COALESCE(SUM(amount), 0) as total
    FROM orders WHERE client_id = ? AND escrow_status IN ('in_escrow', 'work_delivered')
    GROUP BY currency
  `).all(uid)

  const stats = {
    postedProjects: db.prepare('SELECT COUNT(*) as c FROM projects WHERE client_id = ?').get(uid).c,
    totalApplications: db.prepare('SELECT COUNT(*) as c FROM applications a JOIN projects p ON p.id = a.project_id WHERE p.client_id = ?').get(uid).c,
    activeHires: db.prepare("SELECT COUNT(*) as c FROM orders WHERE client_id = ? AND status IN ('requirements', 'in_progress', 'in_revision', 'delivered')").get(uid).c,
    completedProjects: db.prepare("SELECT COUNT(*) as c FROM orders WHERE client_id = ? AND status = 'completed'").get(uid).c,
    spendByCrypto,
    activeEscrowByCrypto,
  }
  res.json({ role: 'client', stats, recentNotifications, unreadNotifications, recentConversations })
})

router.put('/profile', requireAuth, (req, res) => {
  const { name, title, tagline, bio, location, hourly_rate, hourly_currency, experience_level, availability, skills, education, experience, portfolio, languages } = req.body || {}
  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      title = COALESCE(?, title),
      tagline = COALESCE(?, tagline),
      bio = COALESCE(?, bio),
      location = COALESCE(?, location),
      hourly_rate = COALESCE(?, hourly_rate),
      hourly_currency = COALESCE(?, hourly_currency),
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
    hourly_currency || null,
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

router.put('/profile/wallet', requireAuth, (req, res) => {
  const { wallet_address, wallet_network = 'Polygon' } = req.body || {}
  if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim().length < 10) {
    return res.status(400).json({ error: 'Valid wallet address is required.' })
  }
  db.prepare('UPDATE users SET wallet_address = ?, wallet_network = ? WHERE id = ?').run(
    wallet_address.trim(), wallet_network, req.user.id
  )
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ ok: true, user: sanitizeUser(updated) })
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
    SELECT o.*, c.name as client_name, c.wallet_address as client_saved_wallet,
           f.name as freelancer_name, f.wallet_address as freelancer_saved_wallet,
           (SELECT COUNT(*) FROM reviews r WHERE r.order_id = o.id AND r.reviewer_id = ?) as reviewed_by_me,
           (SELECT status FROM disputes d WHERE d.order_id = o.id ORDER BY d.id DESC LIMIT 1) as dispute_status
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
  const curr = gig.currency || 'USDT'
  const network = gig.crypto_network || 'Polygon'

  // Fetch current platform commission rate (percentage as integer)
  const commissionRateRow = db.prepare("SELECT value FROM settings WHERE key = 'commission_rate'").get();
  const commissionRate = commissionRateRow ? Number(commissionRateRow.value) : 20;

  const orderRes = db.prepare(`
    INSERT INTO orders (order_code, gig_id, client_id, freelancer_id, title, package_name, amount, currency, crypto_network, commission_percent, status, escrow_status, due_date, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requirements', 'pending_deposit', ?, ?)
  `).run(code, gig.id, req.user.id, gig.seller_id, gig.title, pkg.key, pkg.price, curr, network, commissionRate, due, gig.cover_image)

  // Platform fee based on commission rate
  const fee = Math.round(pkg.price * commissionRate / 100);
  db.prepare(`
    INSERT INTO payments (order_id, payer_id, payee_id, amount, platform_fee, net_amount, currency, crypto_currency, crypto_network, gateway_provider, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'crypto_escrow', 'pending_deposit')
  `).run(orderRes.lastInsertRowid, req.user.id, gig.seller_id, pkg.price, fee, pkg.price - fee, curr, curr, network)

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'order', 'New service order initiated', ?, '/orders')
  `).run(gig.seller_id, `${req.user.name} initiated order #${code} for ${pkg.price} ${curr}. Awaiting escrow deposit.`)

  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRes.lastInsertRowid)
  res.status(201).json({ order: created })
})

// Escrow Deposit Handler
router.post('/orders/:id/escrow/deposit', requireAuth, requireRole('client'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.client_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' })
  if (order.escrow_status !== 'pending_deposit') {
    return res.status(400).json({ error: `Escrow already processed (Current state: ${order.escrow_status}).` })
  }

  const { tx_hash, client_wallet, network } = req.body || {}
  if (!tx_hash || typeof tx_hash !== 'string' || tx_hash.trim().length < 8) {
    return res.status(400).json({ error: 'A valid blockchain transaction hash is required for escrow deposit verification.' })
  }

  const cleanTx = tx_hash.trim()
  const chosenNetwork = network || order.crypto_network || 'Polygon'
  const explorerBase = BLOCK_EXPLORERS[chosenNetwork] || BLOCK_EXPLORERS.Polygon
  const explorerUrl = `${explorerBase}${cleanTx}`
  const blockNum = Math.floor(12800000 + Math.random() * 95000)

  db.prepare(`
    UPDATE orders SET
      status = 'in_progress',
      escrow_status = 'in_escrow',
      escrow_tx_hash = ?,
      client_wallet = ?,
      crypto_network = ?
    WHERE id = ?
  `).run(cleanTx, client_wallet || req.user.wallet_address || '', chosenNetwork, order.id)

  db.prepare(`
    UPDATE payments SET
      status = 'in_escrow',
      tx_hash = ?,
      block_number = ?,
      explorer_url = ?,
      crypto_network = ?
    WHERE order_id = ?
  `).run(cleanTx, blockNum, explorerUrl, chosenNetwork, order.id)

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'escrow', 'Escrow Deposit Confirmed', ?, '/orders')
  `).run(order.freelancer_id, `Client deposited ${order.amount} ${order.currency} into escrow for #${order.order_code}. You may begin work.`)

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id)
  res.json({ ok: true, order: updated, explorer_url: explorerUrl })
})

// Escrow Release Handler (Client Approves Delivery)
router.post('/orders/:id/escrow/release', requireAuth, requireRole('client'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.client_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' })
  if (!['in_escrow', 'work_delivered'].includes(order.escrow_status)) {
    return res.status(400).json({ error: 'Order is not in an escrow state that can be released.' })
  }

  const { release_tx } = req.body || {}
  const releaseTxHash = release_tx?.trim() || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
  const explorerBase = BLOCK_EXPLORERS[order.crypto_network] || BLOCK_EXPLORERS.Polygon
  const explorerUrl = `${explorerBase}${releaseTxHash}`

  db.prepare(`
    UPDATE orders SET
      status = 'completed',
      escrow_status = 'approved_released',
      release_tx_hash = ?
    WHERE id = ?
  `).run(releaseTxHash, order.id)

  db.prepare(`
    UPDATE payments SET
      status = 'verified_paid',
      tx_hash = ?,
      explorer_url = ?
    WHERE order_id = ?
  `).run(releaseTxHash, explorerUrl, order.id)

  if (order.project_id) {
    db.prepare("UPDATE projects SET status = 'completed', progress = 100 WHERE id = ?").run(order.project_id)
  }

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'escrow', 'Escrow Released to Your Wallet', ?, '/orders')
  `).run(order.freelancer_id, `Payment of ${order.amount} ${order.currency} was approved and released to your wallet for order #${order.order_code}.`)

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id)
  res.json({ ok: true, order: updated, explorer_url: explorerUrl })
})

// Raise Dispute / Request Refund
router.post('/orders/:id/dispute', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.client_id !== req.user.id && order.freelancer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' })
  }

  const { reason, evidence = [] } = req.body || {}
  if (!reason || reason.trim().length < 15) {
    return res.status(400).json({ error: 'Please describe the dispute or refund reason in at least 15 characters.' })
  }

  db.prepare("UPDATE orders SET escrow_status = 'disputed' WHERE id = ?").run(order.id)
  db.prepare("UPDATE payments SET status = 'disputed' WHERE order_id = ?").run(order.id)

  const disputeRes = db.prepare(`
    INSERT INTO disputes (order_id, initiator_id, reason, evidence_json, status)
    VALUES (?, ?, ?, ?, 'open')
  `).run(order.id, req.user.id, reason.trim(), JSON.stringify(Array.isArray(evidence) ? evidence : []))

  const counterpartyId = req.user.id === order.client_id ? order.freelancer_id : order.client_id
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'escrow', 'Dispute Filed on Escrow', ?, '/orders')
  `).run(counterpartyId, `A dispute was opened on order #${order.order_code}. Admin mediation has been requested.`)

  res.status(201).json({ ok: true, dispute_id: disputeRes.lastInsertRowid })
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

  const newEscrow = status === 'delivered' ? 'work_delivered' : status === 'completed' ? 'approved_released' : order.escrow_status

  db.prepare('UPDATE orders SET status = ?, escrow_status = ?, deliverables_note = COALESCE(?, deliverables_note) WHERE id = ?').run(status, newEscrow, deliverables_note || null, order.id)
  if (status === 'completed' && order.project_id) {
    db.prepare("UPDATE projects SET status = 'completed', progress = 100 WHERE id = ?").run(order.project_id)
  }

  const targetId = req.user.id === order.client_id ? order.freelancer_id : order.client_id
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'order', 'Order status updated', ?, '/orders')
  `).run(targetId, `Order #${order.order_code} was updated to ${status.replace('_', ' ')}.`)

  res.json({ ok: true, status, escrow_status: newEscrow })
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
           o.order_code, o.title as order_title, o.amount as order_amount, o.currency as order_currency,
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

// Payments & Blockchain Ledger
router.get('/payments', requireAuth, (req, res) => {
  const items = db.prepare(`
    SELECT p.*, o.order_code, o.title as order_title, o.escrow_status,
           payer.name as payer_name, payer.wallet_address as payer_wallet,
           payee.name as payee_name, payee.wallet_address as payee_wallet
    FROM payments p
    LEFT JOIN orders o ON o.id = p.order_id
    JOIN users payer ON payer.id = p.payer_id
    JOIN users payee ON payee.id = p.payee_id
    WHERE p.payer_id = ? OR p.payee_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id, req.user.id)

  res.json({
    items,
    supportedCryptos: ['USDT', 'USDC', 'ETH', 'BTC'],
    supportedNetworks: ['Polygon', 'Ethereum', 'Arbitrum', 'Bitcoin'],
    escrowModel: 'non_custodial_smart_contract_testnet',
  })
})

export default router
