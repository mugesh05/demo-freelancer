import { IMG, img } from './services.js'

export const gigs = [
  { id: 1, status: 'active', cat: 'WEB DESIGN', title: 'I will design a modern, responsive website', price: 120, views: '4,820', clicks: 326, orders: 12, img: img(IMG.web, 700) },
  { id: 2, status: 'active', cat: 'UI / UX DESIGN', title: 'I will create a clean SaaS dashboard UI', price: 180, views: '4,210', clicks: 284, orders: 8, img: img(IMG.dash, 700) },
  { id: 3, status: 'active', cat: 'BRAND IDENTITY', title: 'I will craft a memorable brand identity', price: 95, views: '3,810', clicks: 254, orders: 6, img: img(IMG.brand, 700) },
  { id: 4, status: 'pending', cat: 'LOGO DESIGN', title: 'I will design a modern minimalist logo', price: 85, views: '0', clicks: 0, orders: 0, img: img(IMG.logo, 700) },
  { id: 5, status: 'drafts', cat: 'DIGITAL MARKETING', title: 'I will plan your SEO growth strategy', price: 150, views: '0', clicks: 0, orders: 0, img: img(IMG.seo, 700) },
  { id: 6, status: 'drafts', cat: 'MOBILE APPS', title: 'I will design your mobile app screens', price: 220, views: '0', clicks: 0, orders: 0, img: img(IMG.app, 700) },
]

export const orders = [
  { id: 'SK-1028', title: 'Responsive website design', client: 'Daniel Wilson', due: 'Nov 28, 2026', total: 360, status: 'In progress', img: img(IMG.web, 200) },
  { id: 'SK-1027', title: 'SaaS dashboard UI design', client: 'Emma Taylor', due: 'Nov 29, 2026', total: 540, status: 'In progress', img: img(IMG.dash, 200) },
  { id: 'SK-1026', title: 'Brand identity package', client: 'Daniel Wilson', due: 'Nov 30, 2026', total: 285, status: 'In revision', img: img(IMG.brand, 200) },
  { id: 'SK-1025', title: 'E-commerce website design', client: 'Emma Taylor', due: 'Dec 02, 2026', total: 480, status: 'Requirements', img: img(IMG.web, 200) },
  { id: 'SK-1024', title: 'Analytics dashboard design', client: 'Daniel Wilson', due: 'Nov 25, 2026', total: 360, status: 'Delivered', img: img(IMG.dash, 200) },
  { id: 'SK-1023', title: 'Skincare brand identity', client: 'Emma Taylor', due: 'Nov 23, 2026', total: 190, status: 'Completed', img: img(IMG.brand, 200) },
  { id: 'SK-1022', title: 'Landing page redesign', client: 'Daniel Wilson', due: 'Nov 20, 2026', total: 320, status: 'Completed', img: img(IMG.web, 200) },
  { id: 'SK-1021', title: 'Mobile app UI kit', client: 'Emma Taylor', due: 'Nov 18, 2026', total: 410, status: 'Completed', img: img(IMG.app, 200) },
  { id: 'SK-1020', title: 'Logo & style guide', client: 'Daniel Wilson', due: 'Nov 16, 2026', total: 150, status: 'Completed', img: img(IMG.logo, 200) },
  { id: 'SK-1019', title: 'Admin dashboard UI', client: 'Emma Taylor', due: 'Nov 12, 2026', total: 520, status: 'Completed', img: img(IMG.dash, 200) },
  { id: 'SK-1018', title: 'Packaging design', client: 'Daniel Wilson', due: 'Nov 10, 2026', total: 240, status: 'Completed', img: img(IMG.brand, 200) },
  { id: 'SK-1017', title: 'Portfolio website', client: 'Emma Taylor', due: 'Nov 06, 2026', total: 300, status: 'Completed', img: img(IMG.web, 200) },
]

export const conversations = [
  {
    id: 'daniel', name: 'Daniel Wilson', ini: 'DW', tint: '#c9d6ea', time: '10:42 AM', unread: 2,
    preview: 'Thanks, Alex! These look great.', sub: 'Website design · #SK-1028', status: 'Online · Usually replies in 1 hour',
    order: { title: 'Responsive website design', meta: 'Order #SK-1028 · Due Nov 28 · $360' },
    thread: [
      { from: 'them', text: 'Hi Alex! Just checking in on the homepage design. Were you able to try the softer color palette?', time: '10:30 AM' },
      { from: 'me', text: 'Hi Daniel! Absolutely. I\u2019ve refined the colors and updated the hero section. Here\u2019s a preview of the new direction.' },
      { from: 'file', name: 'Homepage_v2.pdf', size: '2.4 MB · Click to download', time: '10:38 AM · Seen' },
      { from: 'them', text: 'Thanks, Alex! These look great. Love this direction.', time: '10:42 AM' },
    ],
  },
  {
    id: 'emma', name: 'Emma Taylor', ini: 'ET', tint: '#ecd3c6', time: 'Yesterday', unread: 0,
    preview: 'You: I\u2019ll share the first draft soon.', sub: 'Dashboard UI · #SK-1027', status: 'Offline · Usually replies in 3 hours',
    order: { title: 'SaaS dashboard UI design', meta: 'Order #SK-1027 · Due Nov 29 · $540' },
    thread: [
      { from: 'them', text: 'Hi Alex, how is the dashboard coming along?', time: 'Yesterday' },
      { from: 'me', text: 'Going well! I\u2019ll share the first draft soon.' },
    ],
  },
  {
    id: 'team', name: 'Skillrora team', ini: 'S', tint: '#3b6cf0', time: 'Nov 24', unread: 0, team: true,
    preview: 'Welcome to your next chapter!', sub: 'Tips, updates & a little inspiration', status: 'Official account',
    thread: [{ from: 'them', text: 'Welcome to your next chapter! We\u2019ll share tips, updates and a little inspiration here.', time: 'Nov 24' }],
  },
]

export const profile = {
  work: [
    { title: 'Aura \u2014 E-commerce website', cat: 'Web design', img: img(IMG.web, 600) },
    { title: 'Metric \u2014 Analytics dashboard', cat: 'UI / UX design', img: img(IMG.dash, 600) },
    { title: 'Form \u2014 Brand identity', cat: 'Branding', img: img(IMG.brand, 600) },
  ],
  skills: ['UI / UX design', 'Figma', 'Web design', 'Brand identity', 'Prototyping', 'Design systems'],
}
