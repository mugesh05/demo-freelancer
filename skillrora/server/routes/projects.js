import { Router } from 'express'
import { db } from '../db.js'
import { optionalAuth, requireAuth, requireRole, safeJson } from '../middleware/auth.js'

const router = Router()

function formatProject(p) {
  return { ...p, skills: safeJson(p.skills_json, []) }
}

router.get('/projects', (req, res) => {
  const { q = '', cat = '', maxBudget = 0, experience = '', status = 'open', sort = 'newest', page = 1, limit = 8 } = req.query
  const where = []
  const params = []

  if (status && status !== 'all') {
    where.push('p.status = ?')
    params.push(status)
  }
  if (q.trim()) {
    const term = `%${q.trim().toLowerCase()}%`
    where.push('(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.skills_json) LIKE ?)')
    params.push(term, term, term)
  }
  if (cat && cat !== 'All categories') {
    where.push('p.category = ?')
    params.push(cat)
  }
  if (Number(maxBudget) > 0) {
    where.push('p.budget_min <= ?')
    params.push(Number(maxBudget))
  }
  if (experience) {
    where.push('p.experience_level = ?')
    params.push(experience)
  }

  const orderBy = sort === 'budget_desc' ? 'p.budget_max DESC' : 'p.created_at DESC, p.id DESC'
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db.prepare(`SELECT COUNT(*) as total FROM projects p ${whereSql}`).get(...params).total
  const pageNum = Math.max(1, Number(page) || 1)
  const pageSize = Math.min(24, Math.max(1, Number(limit) || 8))
  const offset = (pageNum - 1) * pageSize

  const items = db.prepare(`
    SELECT p.*, u.name as client_name, u.initials as client_initials, u.tint as client_tint, u.location as client_location,
           (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as application_count
    FROM projects p JOIN users u ON u.id = p.client_id
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset).map(formatProject)

  res.json({ items, total, page: pageNum, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
})

router.get('/my/projects', requireAuth, requireRole('client'), (req, res) => {
  const items = db.prepare(`
    SELECT p.*, u.name as hired_name,
           (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) as application_count
    FROM projects p
    LEFT JOIN users u ON u.id = p.hired_freelancer_id
    WHERE p.client_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id).map(formatProject)
  res.json({ items })
})

router.get('/my/applications', requireAuth, requireRole('freelancer'), (req, res) => {
  const items = db.prepare(`
    SELECT a.*, p.title as project_title, p.category as project_category, p.status as project_status,
           p.budget_min, p.budget_max, p.deadline, u.name as client_name
    FROM applications a
    JOIN projects p ON p.id = a.project_id
    JOIN users u ON u.id = p.client_id
    WHERE a.freelancer_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.id)
  res.json({ items })
})

router.get('/projects/:id', optionalAuth, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as client_name, u.initials as client_initials, u.tint as client_tint, u.location as client_location, u.title as client_title
    FROM projects p JOIN users u ON u.id = p.client_id
    WHERE p.id = ?
  `).get(Number(req.params.id))

  if (!project) return res.status(404).json({ error: 'Project not found.' })

  let applications = []
  let myApplication = null
  if (req.user && req.user.id === project.client_id) {
    applications = db.prepare(`
      SELECT a.*, u.name as freelancer_name, u.initials as freelancer_initials, u.tint as freelancer_tint,
             u.title as freelancer_title, u.rating as freelancer_rating, u.hourly_rate, u.skills_json
      FROM applications a JOIN users u ON u.id = a.freelancer_id
      WHERE a.project_id = ? ORDER BY a.created_at DESC
    `).all(project.id).map((a) => ({ ...a, skills: safeJson(a.skills_json, []) }))
  } else if (req.user && req.user.role === 'freelancer') {
    myApplication = db.prepare('SELECT * FROM applications WHERE project_id = ? AND freelancer_id = ?').get(project.id, req.user.id) || null
  }

  res.json({ project: formatProject(project), applications, myApplication })
})

router.post('/projects', requireAuth, requireRole('client'), (req, res) => {
  const { title, category, subcategory = '', description, budget_min, budget_max, currency = 'USDT', crypto_network = 'Polygon', remote_preference = 'worldwide', attachments = [], deadline, experience_level = 'intermediate', skills = [] } = req.body || {}
  if (!title || title.trim().length < 6) return res.status(400).json({ error: 'Project title must be at least 6 characters.' })
  if (!category) return res.status(400).json({ error: 'Category is required.' })
  if (!description || description.trim().length < 20) return res.status(400).json({ error: 'Project description must be at least 20 characters.' })
  const minB = Number(budget_min)
  const maxB = Number(budget_max)
  if (!minB || !maxB || minB <= 0 || maxB < minB) return res.status(400).json({ error: 'Provide a valid budget range.' })
  if (!deadline) return res.status(400).json({ error: 'Deadline is required.' })

  const validCurrencies = ['USDT', 'USDC', 'ETH', 'BTC']
  const validCurr = validCurrencies.includes(currency) ? currency : 'USDT'

  const result = db.prepare(`
    INSERT INTO projects (client_id, title, category, subcategory, description, budget_min, budget_max, currency, crypto_network, remote_preference, attachments_json, deadline, experience_level, skills_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, title.trim(), category, subcategory.trim(), description.trim(),
    minB, maxB, validCurr, crypto_network, remote_preference,
    JSON.stringify(Array.isArray(attachments) ? attachments : []),
    deadline, experience_level, JSON.stringify(Array.isArray(skills) ? skills : [])
  )

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ project: formatProject(created) })
})

router.put('/projects/:id', requireAuth, requireRole('client'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(req.params.id))
  if (!project) return res.status(404).json({ error: 'Project not found.' })
  if (project.client_id !== req.user.id) return res.status(403).json({ error: 'You can only update your own projects.' })

  const { title, category, description, budget_min, budget_max, deadline, experience_level, skills, status, progress } = req.body || {}
  db.prepare(`
    UPDATE projects SET
      title = COALESCE(?, title),
      category = COALESCE(?, category),
      description = COALESCE(?, description),
      budget_min = COALESCE(?, budget_min),
      budget_max = COALESCE(?, budget_max),
      deadline = COALESCE(?, deadline),
      experience_level = COALESCE(?, experience_level),
      skills_json = COALESCE(?, skills_json),
      status = COALESCE(?, status),
      progress = COALESCE(?, progress)
    WHERE id = ?
  `).run(
    title?.trim() || null, category || null, description?.trim() || null,
    budget_min ? Number(budget_min) : null, budget_max ? Number(budget_max) : null,
    deadline || null, experience_level || null, skills ? JSON.stringify(skills) : null,
    status || null, progress !== undefined ? Math.min(100, Math.max(0, Number(progress))) : null, project.id
  )
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id)
  res.json({ project: formatProject(updated) })
})

router.delete('/projects/:id', requireAuth, requireRole('client'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(req.params.id))
  if (!project) return res.status(404).json({ error: 'Project not found.' })
  if (project.client_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own projects.' })
  db.prepare('DELETE FROM projects WHERE id = ?').run(project.id)
  res.json({ ok: true })
})

router.post('/projects/:id/apply', requireAuth, requireRole('freelancer'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(req.params.id))
  if (!project) return res.status(404).json({ error: 'Project not found.' })
  if (project.status !== 'open') return res.status(400).json({ error: 'This project is no longer accepting applications.' })

  const { cover_letter, proposed_budget, currency, delivery_days } = req.body || {}
  if (!cover_letter || cover_letter.trim().length < 20) {
    return res.status(400).json({ error: 'Cover letter must be at least 20 characters.' })
  }
  const budget = Number(proposed_budget)
  const days = Number(delivery_days)
  if (!budget || budget <= 0 || !days || days <= 0) {
    return res.status(400).json({ error: 'Proposed budget and delivery days must be positive numbers.' })
  }

  const validCurr = ['USDT', 'USDC', 'ETH', 'BTC'].includes(currency) ? currency : (project.currency || 'USDT')

  const existing = db.prepare('SELECT id FROM applications WHERE project_id = ? AND freelancer_id = ?').get(project.id, req.user.id)
  if (existing) return res.status(409).json({ error: 'You have already applied to this project.' })

  const result = db.prepare(`
    INSERT INTO applications (project_id, freelancer_id, cover_letter, proposed_budget, currency, delivery_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(project.id, req.user.id, cover_letter.trim(), budget, validCurr, days)

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'application', 'New project proposal', ?, ?)
  `).run(project.client_id, `${req.user.name} applied to "${project.title}" for ${budget} ${validCurr}.`, `/projects/${project.id}`)

  const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ application: appRow })
})

router.put('/applications/:id/status', requireAuth, requireRole('client'), (req, res) => {
  const appRow = db.prepare(`
    SELECT a.*, p.client_id, p.title as project_title, p.deadline
    FROM applications a JOIN projects p ON p.id = a.project_id
    WHERE a.id = ?
  `).get(Number(req.params.id))
  if (!appRow) return res.status(404).json({ error: 'Application not found.' })
  if (appRow.client_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' })

  const { status } = req.body || {}
  if (!['shortlisted', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' })
  }

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, appRow.id)

  if (status === 'accepted') {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(appRow.project_id)
    db.prepare("UPDATE projects SET status = 'in_progress', hired_freelancer_id = ?, progress = 15 WHERE id = ?").run(appRow.freelancer_id, appRow.project_id)
    db.prepare("UPDATE applications SET status = 'rejected' WHERE project_id = ? AND id != ? AND status IN ('pending', 'shortlisted')").run(appRow.project_id, appRow.id)

    const orderCode = `SK-${Math.floor(1030 + Math.random() * 8900)}`
    const curr = appRow.currency || project?.currency || 'USDT'
    const network = project?.crypto_network || 'Polygon'

    const orderRes = db.prepare(`
      INSERT INTO orders (order_code, project_id, client_id, freelancer_id, title, package_name, amount, currency, crypto_network, status, escrow_status, due_date)
      VALUES (?, ?, ?, ?, ?, 'Contract Milestone', ?, ?, ?, 'requirements', 'pending_deposit', ?)
    `).run(orderCode, appRow.project_id, req.user.id, appRow.freelancer_id, appRow.project_title, appRow.proposed_budget, curr, network, appRow.deadline)

    const fee = Math.round(appRow.proposed_budget * 0.1)
    db.prepare(`
      INSERT INTO payments (order_id, project_id, payer_id, payee_id, amount, platform_fee, net_amount, currency, crypto_currency, crypto_network, gateway_provider, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'crypto_escrow', 'pending_deposit')
    `).run(
      orderRes.lastInsertRowid, appRow.project_id, req.user.id, appRow.freelancer_id,
      appRow.proposed_budget, fee, appRow.proposed_budget - fee,
      curr, curr, network
    )

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (?, 'escrow', 'Escrow Deposit Required', ?, '/orders')
    `).run(req.user.id, `Please deposit ${appRow.proposed_budget} ${curr} into smart contract escrow for order #${orderCode}.`)
  }

  const label = status === 'accepted' ? 'Hired!' : status === 'shortlisted' ? 'Shortlisted' : 'Application update'
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'application', ?, ?, ?)
  `).run(appRow.freelancer_id, label, `Your proposal for "${appRow.project_title}" was marked as ${status}.`, `/projects/${appRow.project_id}`)

  res.json({ ok: true, status })
})

export default router
