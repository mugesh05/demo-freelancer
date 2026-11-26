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

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'freelancer')),
      avatar_url TEXT DEFAULT '',
      initials TEXT NOT NULL,
      tint TEXT DEFAULT '#e6d5c8',
      title TEXT DEFAULT '',
      tagline TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      location TEXT DEFAULT 'United States',
      hourly_rate INTEGER DEFAULT 45,
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
      description TEXT NOT NULL,
      budget_min INTEGER NOT NULL,
      budget_max INTEGER NOT NULL,
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
      status TEXT NOT NULL DEFAULT 'requirements' CHECK(status IN ('requirements', 'in_progress', 'in_revision', 'delivered', 'completed', 'cancelled')),
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
      currency TEXT DEFAULT 'USD',
      gateway_provider TEXT DEFAULT 'stripe_unconfigured',
      gateway_reference TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_gateway' CHECK(status IN ('pending_gateway', 'requires_action', 'verified_paid', 'failed', 'refunded')),
      failure_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, gig_id)
    );
  `)

  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM users').get()
  if (countRow.cnt === 0) {
    seedDatabase()
  }
}

const unsplash = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`

function seedDatabase() {
  const hash = bcrypt.hashSync('Skillrora123!', 10)

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, initials, tint, title, tagline, bio, location, hourly_rate, experience_level, availability, skills_json, education, experience_json, portfolio_json, languages_json, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Freelancers (1-6) & Clients (7-8)
  const alex = insertUser.run(
    'Alex Morgan', 'alex@skillrora.com', hash, 'freelancer', 'AM', '#e6d5c8',
    'UI / UX & Brand Designer', 'Thoughtful design. Meaningful experiences.',
    'Hi, I am Alex — a UI/UX and brand designer helping ambitious businesses turn big ideas into intuitive digital experiences. From wireframes to production design systems, I bring clarity and craft to every project.',
    'United States', 65, 'expert', 'available',
    JSON.stringify(['UI/UX Design', 'Figma', 'Web Design', 'Brand Identity', 'Design Systems', 'Prototyping']),
    'B.F.A. in Interaction Design, Rhode Island School of Design',
    JSON.stringify([
      { role: 'Lead Product Designer', company: 'Northstar Studio', period: '2022 – Present' },
      { role: 'Senior UI Designer', company: 'Verve Digital', period: '2019 – 2022' }
    ]),
    JSON.stringify([
      { title: 'Aura — E-commerce Website', category: 'Web Design', image: unsplash('photo-1542744094-3a31f272c490', 700) },
      { title: 'Metric — Analytics Dashboard', category: 'UI/UX Design', image: unsplash('photo-1551288049-bebda4e38f71', 700) },
      { title: 'Form — Brand Identity', category: 'Branding', image: unsplash('photo-1558655146-d09347e92766', 700) }
    ]),
    JSON.stringify([{ language: 'English', level: 'Native / Bilingual' }, { language: 'Spanish', level: 'Conversational' }]),
    4.9, 86
  ).lastInsertRowid

  const sarah = insertUser.run(
    'Sarah Mitchell', 'sarah@skillrora.com', hash, 'freelancer', 'SM', '#d9e2ee',
    'Senior SaaS & Product Designer', 'Conversion-focused SaaS interfaces built to scale.',
    'I design clean, high-converting SaaS websites, dashboards, and design systems for funded startups and B2B teams.',
    'United States', 75, 'expert', 'available',
    JSON.stringify(['UI/UX Design', 'SaaS', 'Figma', 'React', 'Design Systems']),
    'B.S. Human-Computer Interaction, Carnegie Mellon',
    JSON.stringify([{ role: 'Principal SaaS Designer', company: 'Freelance', period: '2021 – Present' }]),
    JSON.stringify([{ title: 'Pulse CRM', category: 'UI/UX Design', image: unsplash('photo-1559028012-481c04fa702d', 700) }]),
    JSON.stringify([{ language: 'English', level: 'Native' }]),
    4.9, 128
  ).lastInsertRowid

  const david = insertUser.run(
    'David Chen', 'david@skillrora.com', hash, 'freelancer', 'DC', '#d7ece2',
    'Full-Stack Web Developer', 'Fast, accessible, production-grade web apps.',
    'Full-stack React, Node.js, and TypeScript engineer specializing in responsive web applications and API integrations.',
    'Canada', 80, 'expert', 'available',
    JSON.stringify(['React', 'Node.js', 'TypeScript', 'Web Development', 'PostgreSQL']),
    'B.Sc. Computer Science, University of Waterloo',
    JSON.stringify([{ role: 'Senior Full-Stack Engineer', company: 'CloudScale', period: '2020 – Present' }]),
    JSON.stringify([{ title: 'FinTrack Portal', category: 'Web Development', image: unsplash('photo-1551650975-87deedd944c3', 700) }]),
    JSON.stringify([{ language: 'English', level: 'Native' }, { language: 'Mandarin', level: 'Fluent' }]),
    4.8, 74
  ).lastInsertRowid

  const maya = insertUser.run(
    'Maya Nelson', 'maya@skillrora.com', hash, 'freelancer', 'MN', '#f4d9e1',
    'Motion Designer & Video Editor', 'Stories in motion that capture attention.',
    'Motion graphics, product launch videos, and social media reels engineered for retention.',
    'United Kingdom', 55, 'intermediate', 'available',
    JSON.stringify(['Video Editing', 'Motion Graphics', 'After Effects', 'Premiere Pro']),
    'B.A. Digital Media, University of the Arts London',
    JSON.stringify([{ role: 'Motion Designer', company: 'Studio Frame', period: '2021 – Present' }]),
    JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }]),
    4.9, 156
  ).lastInsertRowid

  const emmaP = insertUser.run(
    'Emma Parker', 'emmap@skillrora.com', hash, 'freelancer', 'EP', '#dce4f5',
    'Growth & Technical SEO Strategist', 'Measurable organic growth for modern brands.',
    'Technical SEO audits, keyword architecture, and conversion optimization.',
    'Australia', 60, 'expert', 'busy',
    JSON.stringify(['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics']),
    'M.B.A. Marketing, University of Melbourne',
    JSON.stringify([]),
    JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }]),
    5.0, 113
  ).lastInsertRowid

  const anna = insertUser.run(
    'Anna Kim', 'anna@skillrora.com', hash, 'freelancer', 'AK', '#e0eedb',
    'AI & Workflow Automation Engineer', 'Automate repetitive work with reliable AI agents.',
    'Custom LLM workflows, API orchestration, and business process automation.',
    'United States', 90, 'expert', 'available',
    JSON.stringify(['AI & Automation', 'Python', 'Node.js', 'API Integration']),
    'M.S. Machine Learning, Georgia Tech',
    JSON.stringify([]),
    JSON.stringify([]),
    JSON.stringify([{ language: 'English', level: 'Native' }, { language: 'Korean', level: 'Fluent' }]),
    4.9, 104
  ).lastInsertRowid

  const daniel = insertUser.run(
    'Daniel Wilson', 'daniel@skillrora.com', hash, 'client', 'DW', '#c9d6ea',
    'VP of Product, Horizon Labs', 'Building next-gen B2B SaaS tools.',
    'Product leader hiring vetted designers, engineers, and growth specialists on Skillrora.',
    'United States', 0, 'expert', 'available',
    JSON.stringify(['Product Management', 'SaaS', 'B2B']),
    '', JSON.stringify([]), JSON.stringify([]), JSON.stringify([{ language: 'English', level: 'Native' }]),
    5.0, 14
  ).lastInsertRowid

  const emmaT = insertUser.run(
    'Emma Taylor', 'emmat@skillrora.com', hash, 'client', 'ET', '#ecd3c6',
    'Founder, Luma Commerce', 'Scaling consumer brands with great talent.',
    'E-commerce founder looking for brand designers, Shopify/React developers, and video editors.',
    'United Kingdom', 0, 'intermediate', 'available',
    JSON.stringify(['E-commerce', 'Branding']),
    '', JSON.stringify([]), JSON.stringify([]), JSON.stringify([{ language: 'English', level: 'Native' }]),
    4.9, 9
  ).lastInsertRowid

  const insertGig = db.prepare(`
    INSERT INTO gigs (slug, seller_id, title, category, subcategory, description, price, delivery_days, revisions, packages_json, tags_json, cover_image, gallery_json, status, views, clicks, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const stdPackages = (base) => JSON.stringify([
    { key: 'Basic', price: base, blurb: 'Essential starter deliverable.', delivery: 3, revisions: 1, features: ['Core deliverable', 'Responsive layout', '1 revision'] },
    { key: 'Standard', price: Math.round(base * 2.2), blurb: 'Complete package for growing teams.', delivery: 7, revisions: 2, features: ['Multi-screen deliverable', 'Source files included', '2 revisions'] },
    { key: 'Premium', price: Math.round(base * 3.8), blurb: 'End-to-end system with priority support.', delivery: 10, revisions: 4, features: ['Full design & handoff system', 'Component library', '4 revisions'] }
  ])

  const g1 = insertGig.run(
    'modern-saas-website', sarah,
    'I will design a modern SaaS website and dashboard UI', 'UI/UX Design', 'SaaS & Web Apps',
    'I create clean, conversion-focused websites and dashboards that help growing businesses stand out. Your project includes a polished visual system, responsive layouts, and developer-ready handoff.',
    120, 7, 2, stdPackages(120),
    JSON.stringify(['SaaS', 'Dashboard', 'Figma', 'UI/UX']),
    unsplash('photo-1559028012-481c04fa702d', 800),
    JSON.stringify([
      { url: unsplash('photo-1559028012-481c04fa702d', 1200), alt: 'Dashboard overview' },
      { url: unsplash('photo-1551288049-bebda4e38f71', 1200), alt: 'Analytics view' },
      { url: unsplash('photo-1460925895917-afdab827c52f', 1200), alt: 'Business interface' },
      { url: unsplash('photo-1558655146-d09347e92766', 1200), alt: 'Design workspace' }
    ]),
    'active', 4820, 326, 4.9, 128
  ).lastInsertRowid

  const g2 = insertGig.run(
    'brand-identity-system', alex,
    'I will create a memorable brand identity for your business', 'Graphic Design', 'Brand Identity',
    'Build a cohesive brand identity including custom logo concepts, typography system, color palette, and brand usage guidelines.',
    95, 3, 2, stdPackages(95),
    JSON.stringify(['Branding', 'Logo Design', 'Style Guide']),
    unsplash('photo-1558655146-d09347e92766', 800),
    JSON.stringify([{ url: unsplash('photo-1558655146-d09347e92766', 1200), alt: 'Brand workspace' }]),
    'active', 3810, 254, 5.0, 92
  ).lastInsertRowid

  const g3 = insertGig.run(
    'responsive-web-development', david,
    'I will build a fast responsive React and Node.js website', 'Web Development', 'Full-Stack Web',
    'Production-grade responsive web application built with React, modern CSS, and clean REST APIs.',
    180, 7, 2, stdPackages(180),
    JSON.stringify(['React', 'Node.js', 'Responsive', 'API']),
    unsplash('photo-1542744094-3a31f272c490', 800),
    JSON.stringify([{ url: unsplash('photo-1542744094-3a31f272c490', 1200), alt: 'Web development' }]),
    'active', 4210, 284, 4.8, 74
  ).lastInsertRowid

  insertGig.run(
    'motion-graphics-launch-video', maya,
    'I will create engaging motion graphics for social and product launches', 'Video Editing', 'Motion Graphics',
    'High-retention motion graphics, UI animations, and product explainers tailored for SaaS and consumer brands.',
    150, 3, 2, stdPackages(150),
    JSON.stringify(['Motion', 'Video', 'After Effects']),
    unsplash('photo-1492691527719-9d1e07e534b4', 800),
    JSON.stringify([{ url: unsplash('photo-1492691527719-9d1e07e534b4', 1200), alt: 'Motion video' }]),
    'active', 2940, 198, 4.9, 156
  )

  insertGig.run(
    'technical-seo-growth-audit', emmaP,
    'I will grow your business with a complete technical SEO strategy', 'Digital Marketing', 'SEO',
    'Comprehensive technical audit, keyword roadmap, and on-page optimization to drive qualified organic traffic.',
    140, 7, 2, stdPackages(140),
    JSON.stringify(['SEO', 'Marketing', 'Analytics']),
    unsplash('photo-1460925895917-afdab827c52f', 800),
    JSON.stringify([{ url: unsplash('photo-1460925895917-afdab827c52f', 1200), alt: 'SEO analytics' }]),
    'active', 2150, 145, 5.0, 113
  )

  insertGig.run(
    'ai-workflow-automation', anna,
    'I will build custom AI automation and API integrations for your team', 'AI & Automation', 'Workflow Automation',
    'Connect your CRM, support inbox, and internal tools with reliable AI-powered workflows and webhooks.',
    175, 3, 2, stdPackages(175),
    JSON.stringify(['AI', 'Automation', 'API', 'LLM']),
    unsplash('photo-1518770660439-4636190af475', 800),
    JSON.stringify([{ url: unsplash('photo-1518770660439-4636190af475', 1200), alt: 'AI automation' }]),
    'active', 3120, 210, 4.9, 104
  )

  insertGig.run(
    'clean-saas-dashboard-ui', alex,
    'I will create a clean SaaS dashboard UI and component kit', 'UI/UX Design', 'Dashboards',
    'Interactive Figma dashboard layouts with light/dark tokens and developer handoff specs.',
    180, 5, 2, stdPackages(180),
    JSON.stringify(['SaaS', 'Dashboard', 'Design System']),
    unsplash('photo-1551288049-bebda4e38f71', 800),
    JSON.stringify([{ url: unsplash('photo-1551288049-bebda4e38f71', 1200), alt: 'SaaS Dashboard' }]),
    'active', 4210, 284, 4.9, 67
  )

  insertGig.run(
    'minimalist-logo-draft', alex,
    'I will design a modern minimalist logo and icon set', 'Graphic Design', 'Logo Design',
    'Clean geometric logos and scalable vector marks for startups.',
    85, 3, 2, stdPackages(85),
    JSON.stringify(['Logo', 'Minimalist']),
    unsplash('photo-1561070791-2526d30994b5', 800),
    JSON.stringify([]),
    'pending', 0, 0, 5.0, 0
  )

  // Seed open & active projects
  const insertProject = db.prepare(`
    INSERT INTO projects (client_id, title, category, description, budget_min, budget_max, deadline, experience_level, skills_json, status, hired_freelancer_id, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const p1 = insertProject.run(
    daniel, 'Redesign B2B Analytics Dashboard in Figma & React', 'UI/UX Design',
    'We need an experienced product designer to overhaul our multi-tenant analytics dashboard, improve data visualization hierarchy, and deliver a reusable Figma component library.',
    1200, 2500, '2026-12-20', 'expert',
    JSON.stringify(['Figma', 'UI/UX Design', 'Design Systems', 'SaaS']),
    'open', null, 0
  ).lastInsertRowid

  const p2 = insertProject.run(
    emmaT, 'Build High-Converting E-Commerce Storefront', 'Web Development',
    'Looking for a full-stack React developer to build a fast, mobile-first storefront with cart, filtering, and checkout integration.',
    1800, 3500, '2026-12-28', 'expert',
    JSON.stringify(['React', 'Node.js', 'Web Development', 'API Integration']),
    'open', null, 0
  ).lastInsertRowid

  insertProject.run(
    daniel, 'AI Support Ticket Triage & Slack Automation', 'AI & Automation',
    'Automate incoming customer support classification and route urgent tickets to engineering channels with summary context.',
    800, 1500, '2026-12-15', 'intermediate',
    JSON.stringify(['AI & Automation', 'Python', 'API Integration']),
    'open', null, 0
  )

  insertProject.run(
    emmaT, 'Product Launch Explainer Video (60s)', 'Video Editing',
    'Create a crisp 60-second motion graphics launch video showcasing our new mobile app features.',
    500, 900, '2026-12-12', 'intermediate',
    JSON.stringify(['Motion Graphics', 'Video Editing', 'After Effects']),
    'open', null, 0
  )

  // Seed applications
  const insertApp = db.prepare(`
    INSERT INTO applications (project_id, freelancer_id, cover_letter, proposed_budget, delivery_days, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertApp.run(p1, alex, 'I have designed 12+ B2B SaaS analytics dashboards with full Figma token systems. Happy to share a prototype within 48 hours.', 1850, 10, 'shortlisted')
  insertApp.run(p1, sarah, 'Specializing in SaaS dashboards—I can deliver clean information architecture and responsive specs in 9 days.', 2100, 9, 'pending')
  insertApp.run(p2, david, 'I recently shipped a React + Node storefront with sub-second page loads and full accessibility.', 2400, 14, 'pending')

  // Seed orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_code, gig_id, client_id, freelancer_id, title, package_name, amount, status, due_date, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const o1 = insertOrder.run('SK-1028', g2, daniel, alex, 'Responsive website & brand identity', 'Standard', 360, 'in_progress', '2026-12-05', unsplash('photo-1542744094-3a31f272c490', 300)).lastInsertRowid
  const o2 = insertOrder.run('SK-1027', g1, emmaT, sarah, 'SaaS dashboard UI design', 'Standard', 540, 'in_progress', '2026-12-07', unsplash('photo-1551288049-bebda4e38f71', 300)).lastInsertRowid
  const o3 = insertOrder.run('SK-1026', g2, daniel, alex, 'Brand identity package', 'Basic', 285, 'delivered', '2026-11-30', unsplash('photo-1558655146-d09347e92766', 300)).lastInsertRowid
  const o4 = insertOrder.run('SK-1023', g2, emmaT, alex, 'Skincare brand identity', 'Standard', 420, 'completed', '2026-11-23', unsplash('photo-1558655146-d09347e92766', 300)).lastInsertRowid

  // Seed conversations & messages
  const c1 = db.prepare('INSERT INTO conversations (user1_id, user2_id, order_id) VALUES (?, ?, ?)').run(alex, daniel, o1).lastInsertRowid
  const c2 = db.prepare('INSERT INTO conversations (user1_id, user2_id, order_id) VALUES (?, ?, ?)').run(alex, emmaT, o4).lastInsertRowid

  const insertMsg = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?)')
  insertMsg.run(c1, daniel, 'Hi Alex! Just checking in on the homepage design. Were you able to try the softer color palette?', 1, '2026-11-26 10:30:00')
  insertMsg.run(c1, alex, 'Hi Daniel! Absolutely. I have refined the colors and updated the hero section for review.', 1, '2026-11-26 10:35:00')
  insertMsg.run(c1, daniel, 'Thanks, Alex! These look great. Love this direction.', 0, '2026-11-26 10:42:00')
  insertMsg.run(c2, emmaT, 'Thank you for the final brand guidelines PDF! Everything looks crisp.', 1, '2026-11-25 16:15:00')

  // Seed notifications
  const insertNotif = db.prepare('INSERT INTO notifications (user_id, type, title, body, link, is_read) VALUES (?, ?, ?, ?, ?, ?)')
  insertNotif.run(alex, 'message', 'New message from Daniel Wilson', 'Thanks, Alex! These look great. Love this direction.', '/messages', 0)
  insertNotif.run(alex, 'application', 'You were shortlisted!', 'Daniel Wilson shortlisted your proposal for Redesign B2B Analytics Dashboard.', `/projects/${p1}`, 0)
  insertNotif.run(daniel, 'application', 'New proposal received', 'Sarah Mitchell applied to Redesign B2B Analytics Dashboard.', `/projects/${p1}`, 0)

  // Seed reviews
  const insertReview = db.prepare('INSERT INTO reviews (order_id, gig_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)')
  insertReview.run(o4, g2, emmaT, alex, 5, 'Alex made the whole process effortless. Beautiful work, clear communication, and real attention to detail.')
  insertReview.run(o2, g1, daniel, sarah, 5, 'Sarah delivered a clean, intuitive SaaS design ahead of schedule.')

  // Seed payments
  const insertPay = db.prepare(`
    INSERT INTO payments (order_id, payer_id, payee_id, amount, platform_fee, net_amount, gateway_provider, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertPay.run(o4, emmaT, alex, 420, 42, 378, 'stripe_connect', 'verified_paid')
  insertPay.run(o1, daniel, alex, 360, 36, 324, 'stripe_unconfigured', 'pending_gateway')
}
