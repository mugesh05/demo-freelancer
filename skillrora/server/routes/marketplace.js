import { Router } from 'express'
import { db } from '../db.js'
import { optionalAuth, requireAuth, requireRole, safeJson } from '../middleware/auth.js'

const router = Router()

function formatGig(row) {
  return {
    ...row,
    packages: safeJson(row.packages_json, []),
    tags: safeJson(row.tags_json, []),
    gallery: safeJson(row.gallery_json, []),
  }
}

router.get('/home', (_req, res) => {
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM gigs WHERE status = 'active'
    GROUP BY category ORDER BY count DESC
  `).all()

  const featuredGigs = db.prepare(`
    SELECT g.*, u.name as seller_name, u.initials as seller_initials, u.tint as seller_tint, u.title as seller_title, u.avatar_url as seller_avatar
    FROM gigs g JOIN users u ON u.id = g.seller_id
    WHERE g.status = 'active'
    ORDER BY g.rating DESC, g.review_count DESC LIMIT 4
  `).all().map(formatGig)

  const topFreelancers = db.prepare(`
    SELECT id, name, initials, tint, avatar_url, title, location, hourly_rate, experience_level, availability, skills_json, rating, review_count
    FROM users WHERE role = 'freelancer'
    ORDER BY rating DESC, review_count DESC LIMIT 4
  `).all().map((u) => ({ ...u, skills: safeJson(u.skills_json, []) }))

  const recentProjects = db.prepare(`
    SELECT p.*, u.name as client_name, u.initials as client_initials, u.tint as client_tint,
           (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as application_count
    FROM projects p JOIN users u ON u.id = p.client_id
    WHERE p.status = 'open'
    ORDER BY p.created_at DESC LIMIT 4
  `).all().map((p) => ({ ...p, skills: safeJson(p.skills_json, []) }))

  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.location as reviewer_location
    FROM reviews r JOIN users u ON u.id = r.reviewer_id
    ORDER BY r.created_at DESC LIMIT 3
  `).all()

  const stats = {
    freelancers: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'freelancer'").get().c,
    gigs: db.prepare("SELECT COUNT(*) as c FROM gigs WHERE status = 'active'").get().c,
    openProjects: db.prepare("SELECT COUNT(*) as c FROM projects WHERE status = 'open'").get().c,
    completedOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'completed'").get().c,
  }

  res.json({ categories, featuredGigs, topFreelancers, recentProjects, reviews, stats })
})

router.get('/gigs', optionalAuth, (req, res) => {
  const { q = '', cat = '', maxBudget = 5000, maxDays = 0, minRating = 0, sort = 'recommended', page = 1, limit = 6, mine = '' } = req.query
  const where = []
  const params = []

  if (mine === '1' && req.user) {
    where.push('g.seller_id = ?')
    params.push(req.user.id)
  } else {
    where.push("g.status = 'active'")
  }

  if (q.trim()) {
    const term = `%${q.trim().toLowerCase()}%`
    where.push('(LOWER(g.title) LIKE ? OR LOWER(g.category) LIKE ? OR LOWER(g.tags_json) LIKE ? OR LOWER(u.name) LIKE ?)')
    params.push(term, term, term, term)
  }
  if (cat && cat !== 'All Services' && cat !== 'All categories') {
    const cats = String(cat).split(',').map((s) => s.trim()).filter(Boolean)
    if (cats.length) {
      where.push(`g.category IN (${cats.map(() => '?').join(',')})`)
      params.push(...cats)
    }
  }
  if (Number(maxBudget) > 0 && mine !== '1') {
    where.push('g.price <= ?')
    params.push(Number(maxBudget))
  }
  if (Number(maxDays) > 0) {
    where.push('g.delivery_days <= ?')
    params.push(Number(maxDays))
  }
  if (Number(minRating) > 0) {
    where.push('g.rating >= ?')
    params.push(Number(minRating))
  }

  const orderMap = {
    recommended: 'g.rating DESC, g.review_count DESC',
    newest: 'g.created_at DESC, g.id DESC',
    rating: 'g.rating DESC, g.review_count DESC',
    price_asc: 'g.price ASC',
    price_desc: 'g.price DESC',
  }
  const orderBy = orderMap[sort] || orderMap.recommended

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const totalRow = db.prepare(`SELECT COUNT(*) as total FROM gigs g JOIN users u ON u.id = g.seller_id ${whereSql}`).get(...params)

  const pageNum = Math.max(1, Number(page) || 1)
  const pageSize = Math.min(24, Math.max(1, Number(limit) || 6))
  const offset = (pageNum - 1) * pageSize

  const items = db.prepare(`
    SELECT g.*, u.name as seller_name, u.initials as seller_initials, u.tint as seller_tint, u.title as seller_title, u.avatar_url as seller_avatar
    FROM gigs g JOIN users u ON u.id = g.seller_id
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset).map(formatGig)

  res.json({
    items,
    total: totalRow.total,
    page: pageNum,
    totalPages: Math.max(1, Math.ceil(totalRow.total / pageSize)),
  })
})

router.get('/gigs/:idOrSlug', (req, res) => {
  const key = req.params.idOrSlug
  const gig = db.prepare(`
    SELECT g.*, u.name as seller_name, u.initials as seller_initials, u.tint as seller_tint,
           u.title as seller_title, u.location as seller_location, u.rating as seller_rating,
           u.review_count as seller_reviews, u.availability as seller_availability, u.created_at as seller_since, u.avatar_url as seller_avatar
    FROM gigs g JOIN users u ON u.id = g.seller_id
    WHERE g.slug = ? OR g.id = ?
  `).get(key, Number(key) || -1)

  if (!gig) return res.status(404).json({ error: 'Service not found.' })

  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.initials as reviewer_initials, u.location as reviewer_location
    FROM reviews r JOIN users u ON u.id = r.reviewer_id
    WHERE r.gig_id = ? OR r.reviewee_id = ?
    ORDER BY r.created_at DESC LIMIT 10
  `).all(gig.id, gig.seller_id)

  const related = db.prepare(`
    SELECT g.*, u.name as seller_name, u.initials as seller_initials, u.tint as seller_tint
    FROM gigs g JOIN users u ON u.id = g.seller_id
    WHERE g.status = 'active' AND g.id != ?
    ORDER BY g.rating DESC LIMIT 4
  `).all(gig.id).map(formatGig)

  res.json({ gig: formatGig(gig), reviews, related })
})

router.post('/gigs', requireAuth, requireRole('freelancer'), (req, res) => {
  const { title, category, subcategory = '', description, price, delivery_days = 3, revisions = 2, tags = [], cover_image, status = 'active', packages } = req.body || {}
  if (!title || title.trim().length < 10) return res.status(400).json({ error: 'Gig title must be at least 10 characters.' })
  if (!category) return res.status(400).json({ error: 'Category is required.' })
  if (!description || description.trim().length < 30) return res.status(400).json({ error: 'Description must be at least 30 characters.' })
  const numPrice = Number(price)
  if (!numPrice || numPrice < 5) return res.status(400).json({ error: 'Price must be at least $5.' })

  const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  const slug = `${slugBase}-${Date.now().toString(36)}`
  const defaultPkgs = packages || [
    { key: 'Basic', price: numPrice, blurb: 'Starter package', delivery: Number(delivery_days), revisions: Number(revisions), features: ['Core deliverable', 'Commercial use'] },
    { key: 'Standard', price: Math.round(numPrice * 2), blurb: 'Standard package', delivery: Number(delivery_days) + 2, revisions: Number(revisions) + 1, features: ['Expanded deliverable', 'Source files'] },
    { key: 'Premium', price: Math.round(numPrice * 3.5), blurb: 'Full package', delivery: Number(delivery_days) + 5, revisions: Number(revisions) + 3, features: ['Complete system', 'Priority support'] },
  ]
  const imgUrl = cover_image || 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=800&q=85'

  const result = db.prepare(`
    INSERT INTO gigs (slug, seller_id, title, category, subcategory, description, price, delivery_days, revisions, packages_json, tags_json, cover_image, gallery_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    slug, req.user.id, title.trim(), category, subcategory, description.trim(), numPrice,
    Number(delivery_days) || 3, Number(revisions) || 2, JSON.stringify(defaultPkgs),
    JSON.stringify(Array.isArray(tags) ? tags : []), imgUrl, JSON.stringify([{ url: imgUrl, alt: title.trim() }]),
    ['active', 'pending', 'draft', 'paused'].includes(status) ? status : 'active'
  )

  const created = db.prepare('SELECT * FROM gigs WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ gig: formatGig(created) })
})

router.put('/gigs/:id', requireAuth, requireRole('freelancer'), (req, res) => {
  const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(Number(req.params.id))
  if (!gig) return res.status(404).json({ error: 'Gig not found.' })
  if (gig.seller_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own gigs.' })

  const { title, category, subcategory, description, price, delivery_days, revisions, status, tags, cover_image } = req.body || {}
  db.prepare(`
    UPDATE gigs SET
      title = COALESCE(?, title),
      category = COALESCE(?, category),
      subcategory = COALESCE(?, subcategory),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      delivery_days = COALESCE(?, delivery_days),
      revisions = COALESCE(?, revisions),
      status = COALESCE(?, status),
      tags_json = COALESCE(?, tags_json),
      cover_image = COALESCE(?, cover_image)
    WHERE id = ?
  `).run(
    title?.trim() || null, category || null, subcategory ?? null, description?.trim() || null,
    price ? Number(price) : null, delivery_days ? Number(delivery_days) : null, revisions !== undefined ? Number(revisions) : null,
    status || null, tags ? JSON.stringify(tags) : null, cover_image || null, gig.id
  )
  const updated = db.prepare('SELECT * FROM gigs WHERE id = ?').get(gig.id)
  res.json({ gig: formatGig(updated) })
})

router.delete('/gigs/:id', requireAuth, requireRole('freelancer'), (req, res) => {
  const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(Number(req.params.id))
  if (!gig) return res.status(404).json({ error: 'Gig not found.' })
  if (gig.seller_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own gigs.' })
  db.prepare('DELETE FROM gigs WHERE id = ?').run(gig.id)
  res.json({ ok: true })
})

router.get('/freelancers', (req, res) => {
  const { q = '', skill = '', maxRate = 0, minRating = 0, experience = '', availability = '', sort = 'rating', page = 1, limit = 8 } = req.query
  const where = ["role = 'freelancer'"]
  const params = []

  if (q.trim()) {
    const term = `%${q.trim().toLowerCase()}%`
    where.push('(LOWER(name) LIKE ? OR LOWER(title) LIKE ? OR LOWER(skills_json) LIKE ? OR LOWER(bio) LIKE ?)')
    params.push(term, term, term, term)
  }
  if (skill.trim()) {
    where.push('LOWER(skills_json) LIKE ?')
    params.push(`%${skill.trim().toLowerCase()}%`)
  }
  if (Number(maxRate) > 0) {
    where.push('hourly_rate <= ?')
    params.push(Number(maxRate))
  }
  if (Number(minRating) > 0) {
    where.push('rating >= ?')
    params.push(Number(minRating))
  }
  if (experience) {
    where.push('experience_level = ?')
    params.push(experience)
  }
  if (availability) {
    where.push('availability = ?')
    params.push(availability)
  }

  const orderMap = {
    rating: 'rating DESC, review_count DESC',
    newest: 'created_at DESC, id DESC',
    rate_asc: 'hourly_rate ASC',
    rate_desc: 'hourly_rate DESC',
  }
  const orderBy = orderMap[sort] || orderMap.rating
  const whereSql = `WHERE ${where.join(' AND ')}`

  const total = db.prepare(`SELECT COUNT(*) as total FROM users ${whereSql}`).get(...params).total
  const pageNum = Math.max(1, Number(page) || 1)
  const pageSize = Math.min(24, Math.max(1, Number(limit) || 8))
  const offset = (pageNum - 1) * pageSize

  const items = db.prepare(`
    SELECT id, name, initials, tint, avatar_url, title, tagline, location, hourly_rate, experience_level, availability, skills_json, rating, review_count
    FROM users ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset).map((u) => ({ ...u, skills: safeJson(u.skills_json, []) }))

  res.json({ items, total, page: pageNum, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
})

router.get('/freelancers/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, name, role, initials, tint, avatar_url, title, tagline, bio, location, hourly_rate,
           experience_level, availability, skills_json, education, experience_json, portfolio_json, languages_json, rating, review_count, created_at
    FROM users WHERE id = ? AND role = 'freelancer'
  `).get(Number(req.params.id))

  if (!user) return res.status(404).json({ error: 'Freelancer not found.' })

  const gigs = db.prepare("SELECT * FROM gigs WHERE seller_id = ? AND status = 'active'").all(user.id).map(formatGig)
  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.initials as reviewer_initials, u.location as reviewer_location
    FROM reviews r JOIN users u ON u.id = r.reviewer_id
    WHERE r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT 10
  `).all(user.id)

  res.json({
    freelancer: {
      ...user,
      skills: safeJson(user.skills_json, []),
      experience: safeJson(user.experience_json, []),
      portfolio: safeJson(user.portfolio_json, []),
      languages: safeJson(user.languages_json, []),
    },
    gigs,
    reviews,
  })
})

router.get('/favorites', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT gig_id FROM favorites WHERE user_id = ?').all(req.user.id)
  res.json({ ids: rows.map((r) => r.gig_id) })
})

router.post('/favorites/:gigId', requireAuth, (req, res) => {
  const gigId = Number(req.params.gigId)
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND gig_id = ?').get(req.user.id, gigId)
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id)
    return res.json({ saved: false })
  }
  db.prepare('INSERT INTO favorites (user_id, gig_id) VALUES (?, ?)').run(req.user.id, gigId)
  res.json({ saved: true })
})

export default router
