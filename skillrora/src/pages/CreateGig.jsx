import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Upload, Coins, Network, ShieldCheck } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { CATEGORIES } from '../data/categories.js'
import { api } from '../lib/api.js'

const CRYPTO_CURRENCIES = ['USDT', 'USDC', 'ETH', 'BTC']
const CRYPTO_NETWORKS = ['Polygon', 'Ethereum', 'Arbitrum', 'Bitcoin']

export default function CreateGig() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0].id,
    subcategory: CATEGORIES[0].subcategories[0] || '',
    currency: 'USDT',
    crypto_network: 'Polygon',
    description: '',
    price: '120',
    delivery_days: '3',
    revisions: '2',
    tagsText: '',
    cover_image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=800&q=85',
  })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  // Current category object for subcategory choices
  const currentCatObj = CATEGORIES.find((c) => c.id === form.category) || CATEGORIES[0]

  useEffect(() => {
    if (!id) return
    api(`/api/gigs/${id}`).then((d) => {
      const g = d.gig
      if (!g) return
      setForm({
        title: g.title,
        category: g.category,
        subcategory: g.subcategory || '',
        currency: g.currency || 'USDT',
        crypto_network: g.crypto_network || 'Polygon',
        description: g.description,
        price: String(g.price),
        delivery_days: String(g.delivery_days),
        revisions: String(g.revisions),
        tagsText: (g.tags || []).join(', '),
        cover_image: g.cover_image,
      })
    }).catch(() => {})
  }, [id])

  const onCategoryChange = (e) => {
    const newCat = e.target.value
    const catObj = CATEGORIES.find((c) => c.id === newCat) || CATEGORIES[0]
    setForm((f) => ({
      ...f,
      category: newCat,
      subcategory: catObj.subcategories[0] || '',
    }))
  }

  const uploadCover = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res = await api('/api/uploads/image', { method: 'POST', body: fd })
      setForm((f) => ({ ...f, cover_image: res.url }))
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const submit = async (status) => {
    setMsg({ type: '', text: '' })
    setSaving(true)
    try {
      const tags = form.tagsText.split(',').map((t) => t.trim()).filter(Boolean)
      const basePrice = Number(form.price)
      const delivery = Number(form.delivery_days)
      const revisions = Number(form.revisions)

      const packages = [
        {
          key: 'Basic',
          price: Math.max(1, Math.round(basePrice * 0.7)),
          blurb: 'Essential starter package with core deliverable',
          delivery: Math.max(1, delivery - 1),
          revisions: 1,
          features: ['Core deliverable', 'Source files'],
        },
        {
          key: 'Standard',
          price: basePrice,
          blurb: 'Full production-ready service package',
          delivery,
          revisions,
          features: ['Complete deliverable', 'Source files included', 'Commercial use license'],
        },
        {
          key: 'Premium',
          price: Math.round(basePrice * 1.5),
          blurb: 'Comprehensive service with VIP priority and extended support',
          delivery: Math.max(1, delivery - 2),
          revisions: revisions + 2,
          features: ['Complete deliverable', 'Source files included', 'Commercial use license', 'Priority 24/7 support'],
        },
      ]

      const payload = {
        ...form,
        price: basePrice,
        delivery_days: delivery,
        revisions,
        tags,
        packages,
        status,
      }
      if (id) {
        await api(`/api/gigs/${id}`, { method: 'PUT', body: payload })
      } else {
        await api('/api/gigs', { method: 'POST', body: payload })
      }
      navigate('/my-gigs')
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <Header active="dashboard" />
      <main className="sk-container" style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 18 }}>
          <Link to="/my-gigs" style={{ fontSize: 13, color: 'var(--sk-primary)', fontWeight: 700 }}>← Back to My Gigs</Link>
          <h1 style={{ margin: '8px 0 4px', fontSize: 28 }}>{id ? 'Edit Crypto Service Gig' : 'Create a New Crypto Service Gig'}</h1>
          <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Publish your specialized freelance gig. Settle earnings directly into your Web3 wallet via smart contract escrow.</p>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        <div className="sk-card">
          <div className="sk-field">
            <label htmlFor="gig-title">Gig title</label>
            <input id="gig-title" className="sk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="I will design a Web3 DeFi application with Figma..." required />
          </div>

          <div className="sk-grid-2">
            <div className="sk-field">
              <label htmlFor="gig-cat">Marketplace Category (15 Domains)</label>
              <select id="gig-cat" className="sk-select" value={form.category} onChange={onCategoryChange}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="sk-field">
              <label htmlFor="gig-sub">Subcategory</label>
              <select id="gig-sub" className="sk-select" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>
                {(currentCatObj.subcategories || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Crypto Currency & Blockchain Network */}
          <div className="sk-card" style={{ background: 'var(--sk-surface-2)', padding: 16, marginBottom: 18, border: '1px solid var(--sk-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Coins size={18} color="var(--sk-primary)" />
              <strong style={{ fontSize: 15 }}>Cryptocurrency &amp; Settlement Network</strong>
            </div>
            <div className="sk-grid-2">
              <div className="sk-field">
                <label>Pricing Currency (Zero USD)</label>
                <select className="sk-select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {CRYPTO_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sk-field">
                <label>Settlement Network</label>
                <select className="sk-select" value={form.crypto_network} onChange={(e) => setForm({ ...form, crypto_network: e.target.value })}>
                  {CRYPTO_NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--sk-muted)' }}>
              Clients will fund smart contract escrow using <strong>{form.currency}</strong> on the <strong>{form.crypto_network}</strong> network.
            </p>
          </div>

          <div className="sk-grid-3">
            <div className="sk-field">
              <label>Standard Price ({form.currency})</label>
              <input className="sk-input" type="number" min="1" step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="sk-field">
              <label>Delivery (days)</label>
              <input className="sk-input" type="number" min="1" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} required />
            </div>
            <div className="sk-field">
              <label>Included Revisions</label>
              <input className="sk-input" type="number" min="0" value={form.revisions} onChange={(e) => setForm({ ...form, revisions: e.target.value })} required />
            </div>
          </div>

          <div className="sk-field">
            <label>Tags (comma separated)</label>
            <input className="sk-input" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} placeholder="Solidity, React, Smart Contract, DeFi" />
          </div>

          <div className="sk-field">
            <label>Description</label>
            <textarea className="sk-textarea" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what buyers receive, your technical stack, and milestone deliverables..." required />
          </div>

          <div className="sk-field">
            <label>Cover Image</label>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={form.cover_image} alt="Gig cover" style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--sk-border)' }} />
              <label className="sk-btn sk-btn-outline sk-btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Upload Cover Image
                <input type="file" accept="image/*" onChange={uploadCover} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button type="button" className="sk-btn sk-btn-primary" disabled={saving} onClick={() => submit('active')}>
              <ShieldCheck size={16} />
              {saving ? 'Publishing...' : 'Publish Crypto Gig'}
            </button>
            <button type="button" className="sk-btn sk-btn-outline" disabled={saving} onClick={() => submit('draft')}>
              Save as Draft
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
