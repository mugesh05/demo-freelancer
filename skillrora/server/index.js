import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { initDatabase, uploadsDir } from './db.js'
import authRoutes from './routes/auth.js'
import marketplaceRoutes from './routes/marketplace.js'
import projectRoutes from './routes/projects.js'
import workspaceRoutes from './routes/workspace.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

initDatabase()

const app = express()
app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))
app.use(express.json({ limit: '2mb' }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication requests, please try again shortly.' },
})

app.use('/uploads', express.static(uploadsDir))
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api', marketplaceRoutes)
app.use('/api', projectRoutes)
app.use('/api', workspaceRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'skillrora-api' })
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' })
})

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' })
})

const PORT = Number(process.env.PORT) || 5000
app.listen(PORT, () => {
  console.log(`Skillrora server running on http://localhost:${PORT}`)
})
