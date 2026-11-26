import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { db } from '../db.js'
import { requireAuth, sanitizeUser, signToken } from '../middleware/auth.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TINTS = ['#e6d5c8', '#d9e2ee', '#d7ece2', '#f4d9e1', '#dce4f5']

function makeInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'U'
}

router.post('/register', (req, res) => {
  const { name, email, password, role, title, wallet_address = '' } = req.body || {}
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters.' })
  }
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' })
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }
  if (!['client', 'freelancer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Please select a valid role.' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  const passwordHash = bcrypt.hashSync(String(password), 10)
  const initials = makeInitials(name)
  const tint = TINTS[Math.floor(Math.random() * TINTS.length)]
  const defaultTitle = title?.trim() || (role === 'freelancer' ? 'Independent Freelancer' : role === 'admin' ? 'Administrator' : 'Client')

  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, initials, tint, title, wallet_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name.trim(), normalizedEmail, passwordHash, role, initials, tint, defaultTitle, wallet_address.trim())

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, 'system', 'Welcome to Skillrora!', ?, ?)
  `).run(
    user.id,
    role === 'freelancer'
      ? 'Complete your freelancer profile and publish your first gig to start getting hired.'
      : 'Post your first project or explore vetted freelancers to get started.',
    role === 'freelancer' ? '/dashboard' : role === 'admin' ? '/admin' : '/client-dashboard'
  )

  const token = signToken(user)
  res.status(201).json({ token, user: sanitizeUser(user) })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase())
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const token = signToken(user)
  res.json({ token, user: sanitizeUser(user) })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) })
})

router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {}
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)
  let devResetToken = null
  if (user) {
    const token = crypto.randomBytes(24).toString('hex')
    const expires = Date.now() + 60 * 60 * 1000 // 1 hour
    db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(token, expires, user.id)
    if (process.env.NODE_ENV !== 'production') {
      devResetToken = token
    }
  }
  res.json({
    message: 'If an account matches that email, a password reset link has been generated.',
    ...(devResetToken ? { devResetToken } : {}),
  })
})

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body || {}
  if (!token || !password || String(password).length < 8) {
    return res.status(400).json({ error: 'Valid reset token and password (min 8 chars) are required.' })
  }
  const user = db.prepare('SELECT id, reset_expires FROM users WHERE reset_token = ?').get(String(token))
  if (!user || !user.reset_expires || Number(user.reset_expires) < Date.now()) {
    return res.status(400).json({ error: 'Reset token is invalid or has expired.' })
  }
  const hash = bcrypt.hashSync(String(password), 10)
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?').run(hash, user.id)
  res.json({ message: 'Your password has been reset. You can now log in.' })
})

router.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

export default router
