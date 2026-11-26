const img = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`

export const IMG = {
  hero: img('photo-1551836022-d5d88e9218df', 900),
  saas: 'photo-1559028012-481c04fa702d',
  brand: 'photo-1558655146-d09347e92766',
  web: 'photo-1542744094-3a31f272c490',
  video: 'photo-1492691527719-9d1e07e534b4',
  seo: 'photo-1460925895917-afdab827c52f',
  dash: 'photo-1551288049-bebda4e38f71',
  logo: 'photo-1561070791-2526d30994b5',
  ai: 'photo-1518770660439-4636190af475',
  app: 'photo-1551650975-87deedd944c3',
}
export { img }

export const homeCategories = [
  ['</>', 'Development', '1,280'], ['◈', 'Logo Design', '340'], ['▦', 'UI/UX Design', '520'],
  ['✦', 'Motion Animation', '210'], ['◎', 'Digital Marketing', '460'], ['▰', 'AI & Automation', '180'],
]

export const homeWork = [
  { tint: 'lavender', img: IMG.saas, alt: 'Web project', title: 'I will create a modern SaaS dashboard', ini: 'SM', av: '', name: 'Sarah M.', level: 'Level 2 Seller', rating: '4.9', count: 128, price: 350 },
  { tint: 'yellow', img: IMG.brand, alt: 'Brand project', title: 'I will design a memorable brand identity', ini: 'JD', av: 'gold', name: 'James D.', level: 'Top Rated', rating: '5.0', count: 92, price: 220 },
  { tint: 'cream', img: IMG.web, alt: 'Mobile project', title: 'I will build your high-converting website', ini: 'AK', av: 'green', name: 'Anna K.', level: 'Level 2 Seller', rating: '4.8', count: 74, price: 180 },
  { tint: 'blue', img: IMG.video, alt: 'Video project', title: 'I will edit engaging videos for your brand', ini: 'ML', av: 'pink', name: 'Michael L.', level: 'Top Rated', rating: '4.9', count: 156, price: 150 },
]

export const talent = [
  ['person-one', 'AM', 'Alex Morgan', 'Full-stack Developer', '4.9', 86, 45],
  ['person-two', 'SW', 'Sophia Williams', 'Brand & UI/UX Designer', '5.0', 64, 40],
  ['person-three', 'DC', 'David Chen', 'Motion Designer', '4.8', 52, 38],
  ['person-four', 'MN', 'Maya Nelson', 'Marketing Strategist', '4.9', 71, 42],
]

export const steps = [
  ['Share what you need', 'Post a project in minutes and describe your goals.'],
  ['Choose the perfect match', 'Compare experts and find the right person.'],
  ['Bring your vision to life', 'Collaborate securely and track progress.'],
]

export const reviews = [
  ['The process felt incredibly smooth from start to finish. We found the right expert quickly.', 'Sarah L.'],
  ['The right talent transformed our idea into something better than we imagined.', 'Marcus W.'],
  ['Clear communication, excellent quality, and a brilliant result.', 'Rachel Kim'],
]

// Explore page. cat = tab name, days = delivery time in days
export const services = [
  { id: 'modern-saas-website', to: '/services/modern-saas-website', img: IMG.saas, alt: 'SaaS website', ini: 'SM', av: '', name: 'Sarah Mitchell', title: 'I will design a modern SaaS website and dashboard UI', rating: 4.9, count: 128, price: 120, cat: 'UI/UX Design', days: 7 },
  { id: 'brand', img: IMG.brand, alt: 'Brand identity', ini: 'AM', av: 'gold', name: 'Alex Morgan', title: 'I will create a memorable brand identity for your business', rating: 5.0, count: 92, price: 85, cat: 'Graphic Design', days: 3 },
  { id: 'web', img: IMG.web, alt: 'Website', ini: 'DC', av: 'green', name: 'David Chen', title: 'I will build a responsive website that converts', rating: 4.8, count: 74, price: 180, cat: 'Web Development', days: 7 },
  { id: 'motion', img: IMG.video, alt: 'Motion graphics', ini: 'MN', av: 'pink', name: 'Maya Nelson', title: 'I will create engaging motion graphics for social media', rating: 4.9, count: 156, price: 150, cat: 'Video Editing', days: 3 },
  { id: 'seo', img: IMG.seo, alt: 'SEO', ini: 'EP', av: '', name: 'Emma Parker', title: 'I will grow your business with a complete SEO strategy', rating: 5.0, count: 113, price: 140, cat: 'Digital Marketing', days: 7 },
  { id: 'dashboard', img: IMG.dash, alt: 'Dashboard', ini: 'RL', av: 'gold', name: 'Ryan Lewis', title: 'I will develop an analytics dashboard for your business', rating: 4.9, count: 67, price: 220, cat: 'Web Development', days: 7 },
  { id: 'logo', img: IMG.logo, alt: 'Logo', ini: 'JD', av: '', name: 'James Davis', title: 'I will design a premium logo and complete brand kit', rating: 4.8, count: 89, price: 95, cat: 'Graphic Design', days: 1 },
  { id: 'ai', img: IMG.ai, alt: 'AI', ini: 'AK', av: 'green', name: 'Anna Kim', title: 'I will connect your business with AI automation', rating: 4.9, count: 104, price: 175, cat: 'AI & Automation', days: 3 },
  { id: 'webapp', img: IMG.app, alt: 'Web app', ini: 'SW', av: 'pink', name: 'Sofia Wang', title: 'I will build a fast and modern responsive web app', rating: 4.9, count: 71, price: 200, cat: 'Web Development', days: 7 },
]

export const tabs = ['All Services', 'Web Development', 'Graphic Design', 'UI/UX Design', 'Video Editing', 'Digital Marketing', 'AI & Automation']

export const sidebarGroups = [
  ['Development & Tech', ['Web Development', 'AI & Automation']],
  ['Graphic Design', ['Graphic Design']],
  ['Digital Marketing', ['Digital Marketing']],
  ['UI/UX & Design', ['UI/UX Design']],
  ['Video & Animation', ['Video Editing']],
]

export const topSelect = [
  ['All categories', []],
  ['Development & Tech', ['Web Development', 'AI & Automation']],
  ['Design & Creative', ['Graphic Design', 'UI/UX Design', 'Video Editing']],
  ['Digital Marketing', ['Digital Marketing']],
]

// Service detail page
export const gallery = [
  [IMG.saas, 'Dashboard overview'], [IMG.dash, 'Analytics view'],
  [IMG.seo, 'Business interface'], [IMG.brand, 'Design workspace'],
]

export const packages = [
  { key: 'Basic', price: 120, blurb: 'Perfect for a simple landing page.', delivery: 3, revisions: 1, features: ['One-page design', 'Mobile responsive', 'One revision'] },
  { key: 'Standard', price: 280, blurb: 'Complete website for growing brands.', delivery: 7, revisions: 2, features: ['Five-page design', 'Desktop and mobile', 'Two revisions'] },
  { key: 'Premium', price: 480, blurb: 'Full design system and website.', delivery: 10, revisions: 3, features: ['Ten-page design', 'Complete design system', 'Three revisions'] },
]

export const ratingBars = [[5, 92], [4, 18], [3, 7], [2, 3], [1, 1]]

export const related = [
  [IMG.saas, 'Dashboard', 'SM', '', 'Sarah Mitchell', 'I will create a modern SaaS dashboard', '4.9', 350],
  [IMG.brand, 'Brand', 'AM', '', 'Alex Morgan', 'I will design your brand identity', '5.0', 220],
  [IMG.web, 'Website', 'DC', '', 'David Chen', 'I will build a responsive website', '4.8', 180],
  [IMG.video, 'Video', 'MN', '', 'Maya Nelson', 'I will edit engaging brand videos', '4.9', 150],
]
