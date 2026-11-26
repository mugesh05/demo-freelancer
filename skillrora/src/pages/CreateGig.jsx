import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'

const CATEGORIES = ['Web Development', 'UI/UX Design', 'Graphic Design', 'Video Editing', 'Digital Marketing', 'AI & Automation']

export default function CreateGig() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0],
    subcategory: '',
    description: '',
    price: '120',
    delivery_days: '3',
    revisions: '2',
    tagsText: '',
    cover_image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=800&q=85',
  })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    api(`/api/gigs/${id}`).then((d) => {
      const g = d.gig
      if (!g) return
      setForm({
        title: g.title,
        category: g.category,
        subcategory: g.subcategory || '',
        description: g.description,
        price: String(g.price),
        delivery_days: String(g.delivery_days),
        revisions: String(g.revisions),
        tagsText: (g.tags || []).join(', '),
        cover_image: g.cover_image,
      })
    }).catch(() => {})
  }, [id])

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
      const payload = {
        ...form,
        price: Number(form.price),
        delivery_days: Number(form.delivery_days),
        revisions: Number(form.revisions),
        tags,
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
      <main className="sk-container" style={{ maxWidth: 820 }}>
        <div style={{ marginBottom: 18 }}>
          <Link to="/my-gigs" style={{ fontSize: 13, color: 'var(--sk-primary)', fontWeight: 700 }}>← Back to My Gigs</Link>
          <h1 style={{ margin: '8px 0 4px', fontSize: 28 }}>{id ? 'Edit Service Gig' : 'Create a New Service Gig'}</h1>
          <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Define clear deliverables, pricing, and timeline.</p>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        <div className="sk-card">
          <div className="sk-field">
            <label htmlFor="gig-title">Gig title</label>
            <input id="gig-title" className="sk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="I will design a modern SaaS website..." required />
          </div>

          <div className="sk-grid-2">
            <div className="sk-field">
              <label htmlFor="gig-cat">Category</label>
              <select id="gig-cat" className="sk-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="sk-field">
              <label htmlFor="gig-sub">Subcategory</label>
              <input id="gig-sub" className="sk-input" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} placeholder="e.g. Landing Pages, React Apps" />
            </div>
          </div>

          <div className="sk-grid-3">
            <div className="sk-field"><label>Starting Price ($)</label><input className="sk-input" type="number" min="5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="sk-field"><label>Delivery (days)</label><input className="sk-input" type="number" min="1" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} /></div>
            <div className="sk-field"><label>Revisions</label><input className="sk-input" type="number" min="0" value={form.revisions} onChange={(e) => setForm({ ...form, revisions: e.target.value })} /></div>
          </div>

          <div className="sk-field">
            <label>Tags (comma separated)</label>
            <input className="sk-input" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} placeholder="React, UI/UX, SaaS" />
          </div>

          <div className="sk-field">
            <label>Description</label>
            <textarea className="sk-textarea" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what buyers receive, your workflow, and requirements..." />
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
              {saving ? 'Saving...' : 'Publish Gig'}
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
