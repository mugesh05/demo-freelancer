import jwt from 'jsonwebtoken'
import { db } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable not set')
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

export function sanitizeUser(u) {
  if (!u) return null
  const { password_hash, reset_token, reset_expires, ...rest } = u
  return {
    ...rest,
    skills: safeJson(u.skills_json, []),
    experience: safeJson(u.experience_json, []),
    portfolio: safeJson(u.portfolio_json, []),
    languages: safeJson(u.languages_json, []),
  }
}

export function safeJson(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback
  } catch {
    return fallback
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id)
    if (!user) return res.status(401).json({ error: 'User account not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id)
      if (user) req.user = user
    } catch {
      // Ignore invalid optional token
    }
  }
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access restricted to ${roles.join(' or ')} accounts` })
    }
    next()
  }
}
