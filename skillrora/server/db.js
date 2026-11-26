import { DatabaseSync } from 'node:sqlite'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'skillrora.db')
export const uploadsDir = path.join(__dirname, 'uploads')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })
fs.mkdirSync(uploadsDir, { recursive: true })

export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

export const SUPPORTED_CRYPTOS = ['USDT', 'USDC', 'ETH', 'BTC']
export const SUPPORTED_NETWORKS = ['Polygon', 'Ethereum', 'Arbitrum', 'Bitcoin']

export const BLOCK_EXPLORERS = {
  Polygon: 'https://amoy.polygonscan.com/tx/',
  Ethereum: 'https://sepolia.etherscan.io/tx/',
  Arbitrum: 'https://sepolia.arbiscan.io/tx/',
  Bitcoin: 'https://mempool.space/testnet/tx/',
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'freelancer', 'admin')),
      secondary_role TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      initials TEXT NOT NULL,
      tint TEXT DEFAULT '#e6d5c8',
      title TEXT DEFAULT '',
      tagline TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      location TEXT DEFAULT 'Worldwide',
      hourly_rate INTEGER DEFAULT 45,
      hourly_currency TEXT DEFAULT 'USDT',
      wallet_address TEXT DEFAULT '',
      wallet_network TEXT DEFAULT 'Polygon',
      experience_level TEXT DEFAULT 'intermediate' CHECK(experience_level IN ('entry', 'intermediate', 'expert')),
      availability TEXT DEFAULT 'available' CHECK(availability IN ('available', 'busy', 'unavailable')),
      skills_json TEXT DEFAULT '[]',
      education TEXT DEFAULT '',
      experience_json TEXT DEFAULT '[]',
      portfolio_json TEXT DEFAULT '[]',
      languages_json TEXT DEFAULT '[{"language":"English","level":"Native / Bilingual"}]',
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      email_verified INTEGER DEFAULT 1,
      reset_token TEXT,
      reset_expires INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gigs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT DEFAULT '',
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDT',
      crypto_network TEXT NOT NULL DEFAULT 'Polygon',
      delivery_days INTEGER NOT NULL DEFAULT 3,
      revisions INTEGER NOT NULL DEFAULT 2,
      packages_json TEXT NOT NULL,
      tags_json TEXT DEFAULT '[]',
      cover_image TEXT NOT NULL,
      gallery_json TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'pending', 'draft', 'paused')),
      views INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT DEFAULT '',
      description TEXT NOT NULL,
      budget_min INTEGER NOT NULL,
      budget_max INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDT',
      crypto_network TEXT NOT NULL DEFAULT 'Polygon',
      remote_preference TEXT DEFAULT 'worldwide',
      attachments_json TEXT DEFAULT '[]',
      deadline TEXT NOT NULL,
      experience_level TEXT NOT NULL DEFAULT 'intermediate',
      skills_json TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'completed', 'cancelled')),
      hired_freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      progress INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cover_letter TEXT NOT NULL,
      proposed_budget INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDT',
      delivery_days INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'shortlisted', 'accepted', 'rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(project_id, freelancer_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT NOT NULL UNIQUE,
      gig_id INTEGER REFERENCES gigs(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      package_name TEXT DEFAULT 'Standard',
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDT',
      crypto_network TEXT NOT NULL DEFAULT 'Polygon',
      status TEXT NOT NULL DEFAULT 'requirements' CHECK(status IN ('requirements', 'in_progress', 'in_revision', 'delivered', 'completed', 'cancelled')),
      escrow_status TEXT NOT NULL DEFAULT 'pending_deposit' CHECK(escrow_status IN ('pending_deposit', 'in_escrow', 'work_delivered', 'approved_released', 'refund_requested', 'disputed', 'refunded')),
      escrow_tx_hash TEXT DEFAULT '',
      release_tx_hash TEXT DEFAULT '',
      client_wallet TEXT DEFAULT '',
      freelancer_wallet TEXT DEFAULT '',
      due_date TEXT NOT NULL,
      deliverables_note TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      attachment_url TEXT DEFAULT '',
      attachment_name TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT DEFAULT '/',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      gig_id INTEGER REFERENCES gigs(id) ON DELETE SET NULL,
      reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      payer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      platform_fee INTEGER NOT NULL,
      net_amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'USDT',
      crypto_currency TEXT DEFAULT 'USDT',
      crypto_network TEXT DEFAULT 'Polygon',
      gateway_provider TEXT DEFAULT 'crypto_escrow',
      gateway_reference TEXT DEFAULT '',
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      explorer_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_deposit' CHECK(status IN ('pending_deposit', 'in_escrow', 'verified_paid', 'refunded', 'disputed', 'failed')),
      failure_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      initiator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      evidence_json TEXT DEFAULT '[]',
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'resolved_released', 'resolved_refunded')),
      admin_notes TEXT DEFAULT '',
      resolved_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, gig_id)
    );
  `)

  // Run dynamic column additions for existing installations
  const safeMigrations = [
    "ALTER TABLE users ADD COLUMN wallet_address TEXT DEFAULT '';",
    "ALTER TABLE users ADD COLUMN wallet_network TEXT DEFAULT 'Polygon';",
    "ALTER TABLE users ADD COLUMN secondary_role TEXT DEFAULT '';",
    "ALTER TABLE users ADD COLUMN hourly_currency TEXT DEFAULT 'USDT';",
    "ALTER TABLE gigs ADD COLUMN currency TEXT DEFAULT 'USDT';",
    "ALTER TABLE gigs ADD COLUMN crypto_network TEXT DEFAULT 'Polygon';",
    "ALTER TABLE projects ADD COLUMN currency TEXT DEFAULT 'USDT';",
    "ALTER TABLE projects ADD COLUMN crypto_network TEXT DEFAULT 'Polygon';",
    "ALTER TABLE projects ADD COLUMN remote_preference TEXT DEFAULT 'worldwide';",
    "ALTER TABLE projects ADD COLUMN attachments_json TEXT DEFAULT '[]';",
    "ALTER TABLE applications ADD COLUMN currency TEXT DEFAULT 'USDT';",
    "ALTER TABLE orders ADD COLUMN currency TEXT DEFAULT 'USDT';",
    "ALTER TABLE orders ADD COLUMN crypto_network TEXT DEFAULT 'Polygon';",
    "ALTER TABLE orders ADD COLUMN escrow_status TEXT DEFAULT 'pending_deposit';",
    "ALTER TABLE orders ADD COLUMN escrow_tx_hash TEXT DEFAULT '';",
    "ALTER TABLE orders ADD COLUMN release_tx_hash TEXT DEFAULT '';",
    "ALTER TABLE orders ADD COLUMN client_wallet TEXT DEFAULT '';",
    "ALTER TABLE orders ADD COLUMN freelancer_wallet TEXT DEFAULT '';",
    "ALTER TABLE payments ADD COLUMN crypto_currency TEXT DEFAULT 'USDT';",
    "ALTER TABLE payments ADD COLUMN crypto_network TEXT DEFAULT 'Polygon';",
    "ALTER TABLE payments ADD COLUMN tx_hash TEXT DEFAULT '';",
    "ALTER TABLE payments ADD COLUMN block_number INTEGER DEFAULT 0;",
    "ALTER TABLE payments ADD COLUMN explorer_url TEXT DEFAULT '';",
  ]

  for (const mig of safeMigrations) {
    try { db.exec(mig) } catch { /* Column already exists */ }
  }

  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM users').get()
  if (countRow.cnt === 0) {
    seedDatabase()
  } else {
    // Ensure admin user exists
    ensureAdminUser()
  }
}

function ensureAdminUser() {
  const admin = db.prepare("SELECT id FROM users WHERE email = 'admin@skillrora.com'").get()
  if (!admin) {
    const hash = bcrypt.hashSync('SkillroraAdmin123!', 10)
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, initials, tint, title, bio, wallet_address, wallet_network)
      VALUES (?, ?, ?, 'admin', 'AD', '#0f172a', 'Skillrora Global Administrator', 'Platform escrow mediator and system administrator.', '0x71C...a891', 'Polygon')
    `).run('Skillrora Admin', 'admin@skillrora.com', hash)
  }
}

const unsplash = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`

export function seedDatabase() {
  const hash = bcrypt.hashSync('Skillrora123!', 10)
  const adminHash = bcrypt.hashSync('SkillroraAdmin123!', 10)

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, initials, tint, title, tagline, bio, location, hourly_rate, hourly_currency, wallet_address, wallet_network, experience_level, availability, skills_json, education, experience_json, portfolio_json, languages_json, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // 1. Admin
  insertUser.run(
    'Skillrora Admin', 'admin@skillrora.com', adminHash, 'admin', 'AD', '#0f172a',
    'Platform Administrator & Escrow Mediator', 'Global escrow supervisor and dispute arbitrator.',
    'Official Skillrora platform administrator. Moderates escrow transactions, resolves disputes, and oversees platform security.',
    'Global / Decentralized', 0, 'USDT', '0x17c95a0248e351829e1db87265a6e87f82b49b21', 'Polygon', 'expert', 'available',
    JSON.stringify(['Arbitration', 'Escrow Management', 'Smart Contract Auditing']),
    'M.S. Cybersecurity, Stanford University', JSON.stringify([]), JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }]), 5.0, 0
  )

  // 2. Freelancers (Crypto & Tech Leaders)
  const alex = insertUser.run(
    'Alex Morgan', 'alex@skillrora.com', hash, 'freelancer', 'AM', '#e6d5c8',
    'Web3 UI/UX & Brand Designer', 'Designing intuitive DeFi & crypto interfaces.',
    'Specialist in Web3, DeFi dashboards, tokenomics branding, and crypto-native design systems. Over 6 years turning complex blockchain protocols into clean consumer experiences.',
    'United States', 65, 'USDT', '0x71C8366420A8004b90BE6Ec2fC35B9B086c8f421', 'Polygon', 'expert', 'available',
    JSON.stringify(['UI/UX Design', 'Figma', 'Web3', 'Design Systems', 'Brand Identity', 'Prototyping']),
    'B.F.A. Interaction Design, Rhode Island School of Design',
    JSON.stringify([
      { role: 'Lead DApp Designer', company: 'Nexus Protocol', period: '2022 – Present' },
      { role: 'Senior Product Designer', company: 'ConsenSys Studio', period: '2019 – 2022' }
    ]),
    JSON.stringify([
      { title: 'Aura — DEX & Swap Interface', category: 'Graphics & Design', image: unsplash('photo-1551288049-bebda4e38f71', 700) },
      { title: 'Vault — Staking Dashboard', category: 'Graphics & Design', image: unsplash('photo-1559028012-481c04fa702d', 700) },
      { title: 'TokenBrand — Web3 Identity', category: 'Graphics & Design', image: unsplash('photo-1558655146-d09347e92766', 700) }
    ]),
    JSON.stringify([{ language: 'English', level: 'Native' }, { language: 'Spanish', level: 'Conversational' }]),
    4.9, 86
  ).lastInsertRowid

  const sarah = insertUser.run(
    'Sarah Mitchell', 'sarah@skillrora.com', hash, 'freelancer', 'SM', '#d9e2ee',
    'Senior Smart Contract & SaaS Architect', 'Secure EVM Smart Contracts & Scalable Web Apps.',
    'Senior full-stack engineer and Solidity auditor. I architect gas-optimized smart contracts and build high-converting SaaS applications with Web3 payment gateways.',
    'United Kingdom', 85, 'USDC', '0x32A4B3b791475A771AcDbFaC7702f30B6f4614A2', 'Ethereum', 'expert', 'available',
    JSON.stringify(['Solidity', 'Ethereum', 'Smart Contracts', 'React', 'Node.js', 'Web3.js']),
    'M.Sc. Advanced Computer Science, University of Oxford',
    JSON.stringify([{ role: 'Principal Smart Contract Engineer', company: 'AuditedDApps', period: '2021 – Present' }]),
    JSON.stringify([{ title: 'Vault Escrow Smart Contract', category: 'Programming & Tech', image: unsplash('photo-1551650975-87deedd944c3', 700) }]),
    JSON.stringify([{ language: 'English', level: 'Native' }, { language: 'German', level: 'Fluent' }]),
    4.9, 128
  ).lastInsertRowid

  const david = insertUser.run(
    'David Chen', 'david@skillrora.com', hash, 'freelancer', 'DC', '#d7ece2',
    'Full-Stack Web3 & DApp Developer', 'Fast, responsive, gas-efficient decentralized apps.',
    'TypeScript, React, Node.js, and Ethers.js developer. I build production-ready Web3 applications with clean REST APIs and wallet connection handlers.',
    'Canada', 75, 'USDT', '0x84B294f31cE84Db6F1F9a3A10aE201B48F1948B0', 'Arbitrum', 'expert', 'available',
    JSON.stringify(['React', 'Node.js', 'Ethers.js', 'Arbitrum', 'PostgreSQL', 'TypeScript']),
    'B.Sc. Computer Science, University of Waterloo',
    JSON.stringify([{ role: 'Senior Web3 Engineer', company: 'EtherScale', period: '2020 – Present' }]),
    JSON.stringify([{ title: 'CryptoPay Gateway Portal', category: 'Programming & Tech', image: unsplash('photo-1542744094-3a31f272c490', 700) }]),
    JSON.stringify([{ language: 'English', level: 'Native' }, { language: 'Chinese', level: 'Fluent' }]),
    4.8, 74
  ).lastInsertRowid

  const maya = insertUser.run(
    'Maya Nelson', 'maya@skillrora.com', hash, 'freelancer', 'MN', '#f4d9e1',
    '3D Motion Designer & Video Editor', 'High-impact 3D visuals & crypto project explainers.',
    'I produce crisp 3D motion graphics, NFT reveal animations, and high-retention crypto explainer videos tailored for global audiences.',
    'United Arab Emirates', 60, 'USDT', '0x49F21804E1E1B93A90209C8e14674F789C1aB134', 'Polygon', 'intermediate', 'available',
    JSON.stringify(['Video Editing', '3D Motion', 'After Effects', 'Cinema 4D', 'Crypto Explainers']),
    'B.A. Digital Arts, American University of Sharjah',
    JSON.stringify([{ role: 'Senior Motion Artist', company: 'ChainVisuals', period: '2021 – Present' }]),
    JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }, { language: 'Arabic', level: 'Native' }]),
    4.9, 156
  ).lastInsertRowid

  const emmaP = insertUser.run(
    'Emma Parker', 'emmap@skillrora.com', hash, 'freelancer', 'EP', '#dce4f5',
    'Web3 Growth & Technical SEO Strategist', 'Organic reach for DeFi protocols & crypto startups.',
    'Strategic organic growth, keyword architecture, and technical SEO campaigns designed to bring verified liquidity and community users to modern platforms.',
    'Australia', 60, 'USDC', '0x17A2089456208F35C19842aB6194b1509D80E46F', 'Polygon', 'expert', 'busy',
    JSON.stringify(['Digital Marketing', 'SEO', 'Web3 Growth', 'Content Strategy']),
    'M.B.A. Marketing, University of Melbourne',
    JSON.stringify([]), JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }]),
    5.0, 113
  ).lastInsertRowid

  const anna = insertUser.run(
    'Anna Kim', 'anna@skillrora.com', hash, 'freelancer', 'AK', '#e0eedb',
    'Autonomous AI & On-Chain Agent Engineer', 'Reliable AI agents executing on blockchain tasks.',
    'I build multi-agent AI workflows, custom LLMs, and on-chain automated trading/monitoring bots with enterprise resilience.',
    'Singapore', 90, 'USDT', '0x992B104F34A6190a6fB740E74b889021481977e2', 'Polygon', 'expert', 'available',
    JSON.stringify(['AI & Automation', 'Python', 'LangChain', 'Solidity', 'API Integration']),
    'M.S. Artificial Intelligence, NUS',
    JSON.stringify([]), JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }, { language: 'Korean', level: 'Fluent' }]),
    4.9, 104
  ).lastInsertRowid

  // 3. Clients
  const daniel = insertUser.run(
    'Daniel Wilson', 'daniel@skillrora.com', hash, 'client', 'DW', '#c9d6ea',
    'VP of Product, Horizon Labs', 'Building next-gen decentralized finance tools.',
    'Product leader hiring vetted Web3 designers, full-stack engineers, and crypto growth specialists on Skillrora.',
    'United States', 0, 'USDT', '0x15D34AAf54267DB7E7c367839AAf71A00a2C6A65', 'Polygon', 'expert', 'available',
    JSON.stringify(['Product Management', 'DeFi', 'Web3']),
    '', JSON.stringify([]), JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }]),
    5.0, 14
  ).lastInsertRowid

  const emmaT = insertUser.run(
    'Emma Taylor', 'emmat@skillrora.com', hash, 'client', 'ET', '#ecd3c6',
    'Founder, Luma Commerce', 'Scaling cross-border e-commerce with crypto payments.',
    'E-commerce and crypto founder looking for brand designers, smart contract developers, and motion video creators.',
    'United Kingdom', 0, 'USDC', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'Ethereum', 'intermediate', 'available',
    JSON.stringify(['E-commerce', 'Crypto Payments', 'Branding']),
    '', JSON.stringify([]), JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }]),
    4.9, 9
  ).lastInsertRowid

  // 4. Gigs with Cryptocurrency Pricing & Network Specifications
  const insertGig = db.prepare(`
    INSERT INTO gigs (slug, seller_id, title, category, subcategory, description, price, currency, crypto_network, delivery_days, revisions, packages_json, tags_json, cover_image, gallery_json, status, views, clicks, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const stdPackages = (base, curr) => JSON.stringify([
    { key: 'Basic', price: base, currency: curr, blurb: 'Starter deliverable with essential assets.', delivery: 3, revisions: 1, features: ['Core deliverable', 'Responsive layout', '1 revision', 'Source files'] },
    { key: 'Standard', price: Math.round(base * 2.2), currency: curr, blurb: 'Complete package with extended specifications.', delivery: 7, revisions: 3, features: ['Multi-screen deliverable', 'Source files & assets', '3 revisions', 'Priority support'] },
    { key: 'Premium', price: Math.round(base * 3.8), currency: curr, blurb: 'Comprehensive end-to-end design & code system.', delivery: 10, revisions: 5, features: ['Full component library', 'Developer handoff guide', 'Unlimited revisions', '14-day warranty'] }
  ])

  const g1 = insertGig.run(
    'modern-saas-website', sarah,
    'I will design a modern SaaS website and dashboard UI with Web3 support', 'Programming & Tech', 'Full-Stack Web',
    'Clean, conversion-focused interfaces and responsive dashboards engineered for SaaS and Web3 products. Fully modular component kits, responsive layouts, and production-ready handoff.',
    180, 'USDT', 'Polygon', 7, 3, stdPackages(180, 'USDT'),
    JSON.stringify(['SaaS', 'Web3', 'Dashboard', 'React', 'Figma']),
    unsplash('photo-1559028012-481c04fa702d', 800),
    JSON.stringify([
      { url: unsplash('photo-1559028012-481c04fa702d', 1200), alt: 'Dashboard overview' },
      { url: unsplash('photo-1551288049-bebda4e38f71', 1200), alt: 'Analytics view' }
    ]),
    'active', 4820, 326, 4.9, 128
  ).lastInsertRowid

  const g2 = insertGig.run(
    'brand-identity-system', alex,
    'I will create a memorable crypto brand identity and vector design system', 'Graphics & Design', 'Brand Identity',
    'Custom visual identity for modern protocols and tech startups: geometric logos, color system, typography hierarchy, token icons, and social media brand kits.',
    120, 'USDT', 'Polygon', 3, 2, stdPackages(120, 'USDT'),
    JSON.stringify(['Branding', 'Logo Design', 'Crypto', 'Style Guide']),
    unsplash('photo-1558655146-d09347e92766', 800),
    JSON.stringify([{ url: unsplash('photo-1558655146-d09347e92766', 1200), alt: 'Brand workspace' }]),
    'active', 3810, 254, 5.0, 92
  ).lastInsertRowid

  const g3 = insertGig.run(
    'responsive-web-development', david,
    'I will build a fast responsive React and Web3 DApp with crypto wallet integration', 'Programming & Tech', 'Web3 & DApps',
    'Full-stack Web3 application with MetaMask / WalletConnect integration, clean Tailwind/CSS layouts, and secure API endpoints.',
    250, 'USDC', 'Arbitrum', 7, 3, stdPackages(250, 'USDC'),
    JSON.stringify(['Web3', 'React', 'MetaMask', 'API', 'Arbitrum']),
    unsplash('photo-1542744094-3a31f272c490', 800),
    JSON.stringify([{ url: unsplash('photo-1542744094-3a31f272c490', 1200), alt: 'Web development' }]),
    'active', 4210, 284, 4.8, 74
  ).lastInsertRowid

  insertGig.run(
    'motion-graphics-launch-video', maya,
    'I will produce 3D motion graphics and explainer videos for crypto launches', 'Video & Animation', '3D Animation',
    'High-retention 3D animations, token release promos, and product walkthroughs rendered in 4K.',
    200, 'USDT', 'Polygon', 5, 2, stdPackages(200, 'USDT'),
    JSON.stringify(['3D Motion', 'Crypto Video', 'After Effects', 'Cinema 4D']),
    unsplash('photo-1492691527719-9d1e07e534b4', 800),
    JSON.stringify([]), 'active', 2940, 198, 4.9, 156
  )

  insertGig.run(
    'technical-seo-growth-audit', emmaP,
    'I will execute technical SEO and community growth for modern tech platforms', 'Digital Marketing', 'Search Engine Optimization',
    'Comprehensive technical indexing audit, keyword roadmap, and targeted conversion funnel optimization to drive verified organic users.',
    160, 'USDC', 'Polygon', 7, 2, stdPackages(160, 'USDC'),
    JSON.stringify(['SEO', 'Marketing', 'Analytics', 'Conversion']),
    unsplash('photo-1460925895917-afdab827c52f', 800),
    JSON.stringify([]), 'active', 2150, 145, 5.0, 113
  )

  insertGig.run(
    'ai-workflow-automation', anna,
    'I will build autonomous AI agents and on-chain workflow bots', 'AI Services', 'AI Agents & Automation',
    'Connect your Telegram, Discord, and Web3 smart contracts with intelligent LLM-driven autonomous bots and webhook pipelines.',
    220, 'USDT', 'Polygon', 4, 2, stdPackages(220, 'USDT'),
    JSON.stringify(['AI Agents', 'Automation', 'Python', 'Web3 Bots']),
    unsplash('photo-1518770660439-4636190af475', 800),
    JSON.stringify([]), 'active', 3120, 210, 4.9, 104
  )

  // 5. Projects (Jobs) with Cryptocurrency Budgets
  const insertProject = db.prepare(`
    INSERT INTO projects (client_id, title, category, subcategory, description, budget_min, budget_max, currency, crypto_network, remote_preference, deadline, experience_level, skills_json, status, hired_freelancer_id, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const p1 = insertProject.run(
    daniel, 'Redesign DeFi Analytics Dashboard in Figma & React', 'Programming & Tech', 'Web3 & DApps',
    'We require an experienced product designer and front-end developer to overhaul our multi-chain analytics dashboard, implement crypto wallet states, and deliver a modular component library.',
    1200, 2500, 'USDT', 'Polygon', 'worldwide', '2026-12-20', 'expert',
    JSON.stringify(['Figma', 'React', 'DeFi', 'Web3', 'Polygon']),
    'open', null, 0
  ).lastInsertRowid

  const p2 = insertProject.run(
    emmaT, 'Build High-Converting Storefront with Crypto Checkout', 'Programming & Tech', 'Full-Stack Web',
    'Looking for a full-stack engineer to build a high-speed storefront with crypto wallet escrow checkout (USDT/USDC/ETH).',
    1800, 3200, 'USDC', 'Ethereum', 'worldwide', '2026-12-28', 'expert',
    JSON.stringify(['React', 'Node.js', 'Crypto Payments', 'Smart Contracts']),
    'open', null, 0
  ).lastInsertRowid

  insertProject.run(
    daniel, 'AI Multi-Agent Workflow for Real-Time Community Support', 'AI Services', 'AI Agents & Automation',
    'Develop an autonomous AI agent to answer customer inquiries, verify on-chain transaction receipts, and route technical issues to engineering channels.',
    800, 1600, 'USDT', 'Polygon', 'worldwide', '2026-12-15', 'intermediate',
    JSON.stringify(['AI Agents', 'Python', 'Webhooks', 'Telegram API']),
    'open', null, 0
  )

  insertProject.run(
    emmaT, '3D Token Launch & Product Explainer Video (60s)', 'Video & Animation', '3D Animation',
    'Produce a premium 60-second 3D motion graphics launch video explaining our decentralized payment protocol.',
    600, 1100, 'USDT', 'Arbitrum', 'worldwide', '2026-12-12', 'intermediate',
    JSON.stringify(['3D Motion', 'After Effects', 'Crypto Explainers']),
    'open', null, 0
  )

  // 6. Applications (Proposals)
  const insertApp = db.prepare(`
    INSERT INTO applications (project_id, freelancer_id, cover_letter, proposed_budget, currency, delivery_days, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  insertApp.run(p1, alex, 'I have designed 12+ DeFi analytics dashboards with full token systems. Ready to begin immediately with verified escrow protection.', 1850, 'USDT', 10, 'shortlisted')
  insertApp.run(p1, sarah, 'Specializing in DeFi dashboards and Solidity interfaces. I can deliver clean information architecture in 9 days.', 2100, 'USDT', 9, 'pending')
  insertApp.run(p2, david, 'I recently delivered a React storefront supporting USDT & USDC wallet payments with sub-second response times.', 2400, 'USDC', 14, 'pending')

  // 7. Orders with Crypto Escrow State Machine
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_code, gig_id, client_id, freelancer_id, title, package_name, amount, currency, crypto_network, status, escrow_status, escrow_tx_hash, release_tx_hash, client_wallet, freelancer_wallet, due_date, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const o1 = insertOrder.run(
    'SK-1028', g2, daniel, alex, 'Brand identity & Web3 design system', 'Standard',
    360, 'USDT', 'Polygon', 'in_progress', 'in_escrow',
    '0x9a8f234bc56e172890a817456bcdef1234567890abcdef1234567890abcdef12', '',
    '0x15D34AAf54267DB7E7c367839AAf71A00a2C6A65', '0x71C8366420A8004b90BE6Ec2fC35B9B086c8f421',
    '2026-12-05', unsplash('photo-1542744094-3a31f272c490', 300)
  ).lastInsertRowid

  const o2 = insertOrder.run(
    'SK-1027', g1, emmaT, sarah, 'SaaS dashboard & Web3 checkout UI', 'Standard',
    540, 'USDC', 'Ethereum', 'in_progress', 'in_escrow',
    '0x41e89b142890471258ab0192456bc71829038471625349182736450192837465', '',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '0x32A4B3b791475A771AcDbFaC7702f30B6f4614A2',
    '2026-12-07', unsplash('photo-1551288049-bebda4e38f71', 300)
  ).lastInsertRowid

  const o3 = insertOrder.run(
    'SK-1026', g2, daniel, alex, 'Crypto token icon & style guide', 'Basic',
    285, 'USDT', 'Polygon', 'delivered', 'work_delivered',
    '0x17b8923450918273465901827346591029384756102938475610293847561029', '',
    '0x15D34AAf54267DB7E7c367839AAf71A00a2C6A65', '0x71C8366420A8004b90BE6Ec2fC35B9B086c8f421',
    '2026-11-30', unsplash('photo-1558655146-d09347e92766', 300)
  ).lastInsertRowid

  const o4 = insertOrder.run(
    'SK-1023', g2, emmaT, alex, 'Global e-commerce brand identity', 'Standard',
    420, 'USDT', 'Polygon', 'completed', 'approved_released',
    '0x7192837465019283746501928374650192837465019283746501928374650192',
    '0x8891273465019283746501928374650192837465019283746501928374650193',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '0x71C8366420A8004b90BE6Ec2fC35B9B086c8f421',
    '2026-11-23', unsplash('photo-1558655146-d09347e92766', 300)
  ).lastInsertRowid

  // 8. Conversations & Messages
  const c1 = db.prepare('INSERT INTO conversations (user1_id, user2_id, order_id) VALUES (?, ?, ?)').run(alex, daniel, o1).lastInsertRowid
  const c2 = db.prepare('INSERT INTO conversations (user1_id, user2_id, order_id) VALUES (?, ?, ?)').run(alex, emmaT, o4).lastInsertRowid

  const insertMsg = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?)')
  insertMsg.run(c1, daniel, 'Hi Alex! Just deposited 360 USDT into the smart contract escrow. Let me know when you start the wireframes.', 1, '2026-11-26 10:30:00')
  insertMsg.run(c1, alex, 'Confirmed, Daniel! Escrow deposit received on Polygon Amoy testnet. I have commenced the design phase.', 1, '2026-11-26 10:35:00')
  insertMsg.run(c1, daniel, 'Awesome! Excited to see the initial component preview.', 0, '2026-11-26 10:42:00')
  insertMsg.run(c2, emmaT, 'The final deliverables were reviewed and approved. 420 USDT has been released from escrow to your wallet.', 1, '2026-11-25 16:15:00')

  // 9. Notifications
  const insertNotif = db.prepare('INSERT INTO notifications (user_id, type, title, body, link, is_read) VALUES (?, ?, ?, ?, ?, ?)')
  insertNotif.run(alex, 'escrow', 'Escrow Deposit Confirmed', 'Daniel Wilson deposited 360 USDT into escrow on Polygon.', '/orders', 0)
  insertNotif.run(alex, 'application', 'Proposal Shortlisted!', 'Daniel Wilson shortlisted your proposal for Redesign DeFi Analytics Dashboard.', `/projects/${p1}`, 0)
  insertNotif.run(daniel, 'application', 'New Proposal Received', 'Sarah Mitchell applied to Redesign DeFi Analytics Dashboard.', `/projects/${p1}`, 0)

  // 10. Reviews
  const insertReview = db.prepare('INSERT INTO reviews (order_id, gig_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)')
  insertReview.run(o4, g2, emmaT, alex, 5, 'Alex delivered flawless brand guidelines and vector assets. Smooth crypto escrow release!')
  insertReview.run(o2, g1, daniel, sarah, 5, 'Sarah delivered a clean, intuitive Web3 design. Verified on-chain escrow made payment seamless.')

  // 11. Payments & Blockchain Ledger
  const insertPay = db.prepare(`
    INSERT INTO payments (order_id, payer_id, payee_id, amount, platform_fee, net_amount, currency, crypto_currency, crypto_network, gateway_provider, tx_hash, block_number, explorer_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertPay.run(
    o4, emmaT, alex, 420, 42, 378, 'USDT', 'USDT', 'Polygon', 'crypto_escrow',
    '0x7192837465019283746501928374650192837465019283746501928374650192',
    12849102, 'https://amoy.polygonscan.com/tx/0x7192837465019283746501928374650192837465019283746501928374650192',
    'verified_paid'
  )
  insertPay.run(
    o1, daniel, alex, 360, 36, 324, 'USDT', 'USDT', 'Polygon', 'crypto_escrow',
    '0x9a8f234bc56e172890a817456bcdef1234567890abcdef1234567890abcdef12',
    12850419, 'https://amoy.polygonscan.com/tx/0x9a8f234bc56e172890a817456bcdef1234567890abcdef1234567890abcdef12',
    'in_escrow'
  )
}
