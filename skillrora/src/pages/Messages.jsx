import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function Messages() {
  const { user } = useAuth()
  const [convs, setConvs] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)

  const loadConvs = useCallback(async () => {
    try {
      const d = await api('/api/conversations')
      const items = d.items || []
      setConvs(items)
      setActiveId((prev) => prev || items[0]?.id || null)
    } catch { /* ignore */ }
  }, [])

  const loadMessages = useCallback(async (cid) => {
    if (!cid) return
    try {
      const d = await api(`/api/conversations/${cid}/messages`)
      setMessages(d.messages || [])
      setConvs((cs) => cs.map((c) => (c.id === cid ? { ...c, unread_count: 0 } : c)))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadConvs() }, [loadConvs])
  useEffect(() => { loadMessages(activeId) }, [activeId, loadMessages])

  useEffect(() => {
    if (!activeId) return
    const t = setInterval(() => loadMessages(activeId), 5000)
    return () => clearInterval(t)
  }, [activeId, loadMessages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages.length])

  const send = async (e) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !activeId) return
    setDraft('')
    try {
      await api(`/api/conversations/${activeId}/messages`, { method: 'POST', body: { content } })
      await loadMessages(activeId)
      await loadConvs()
    } catch { /* ignore */ }
  }

  const active = convs.find((c) => c.id === activeId)
  const shown = convs.filter((c) => (filter === 'all' || c.unread_count > 0) && c.peer_name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page">
      <Header />
      <main className="sk-container">
        <div style={{ marginBottom: 20 }}>
          <span className="sk-badge blue" style={{ marginBottom: 6 }}>INBOX</span>
          <h1 style={{ margin: 0, fontSize: 28 }}>Messages</h1>
        </div>

        <div className="sk-card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 540 }} id="sk-chat-grid">
          <aside style={{ borderRight: '1px solid var(--sk-border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="sk-input" placeholder="Search conversations..." value={q} onChange={(e) => setQ(e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={`sk-btn sk-btn-sm ${filter === 'all' ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setFilter('all')}>All</button>
              <button type="button" className={`sk-btn sk-btn-sm ${filter === 'unread' ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setFilter('unread')}>Unread</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {shown.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--sk-muted)' }}>No conversations found.</p>
              ) : (
                shown.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, border: 'none', textAlign: 'left', cursor: 'pointer',
                      background: c.id === activeId ? 'var(--sk-primary-soft)' : 'transparent',
                    }}
                  >
                    <span className="sk-avatar" style={{ width: 40, height: 40, background: c.peer_tint, fontSize: 13 }}>{c.peer_initials}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: 14 }}>{c.peer_name}</strong>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--sk-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.last_message || 'No messages yet'}
                      </span>
                    </div>
                    {c.unread_count > 0 && <span className="sk-badge blue">{c.unread_count}</span>}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section style={{ display: 'flex', flexDirection: 'column', height: 540 }}>
            {!active ? (
              <div className="sk-empty" style={{ margin: 'auto', border: 'none' }}>
                <h3>Select a conversation</h3>
                <p>Choose a thread on the left or message a freelancer from their profile.</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sk-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 16 }}>{active.peer_name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{active.peer_title}{active.order_code ? ` · Order #${active.order_code}` : ''}</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--sk-bg)' }}>
                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id
                    return (
                      <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: mine ? 'var(--sk-primary)' : 'var(--sk-surface)',
                          color: mine ? '#fff' : 'var(--sk-ink)',
                          border: mine ? 'none' : '1px solid var(--sk-border)',
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}>
                          {m.content}
                        </div>
                        <small style={{ display: 'block', fontSize: 11, color: 'var(--sk-muted)', marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                          {m.created_at}
                        </small>
                      </div>
                    )
                  })}
                  <div ref={endRef} />
                </div>

                <form onSubmit={send} style={{ padding: 14, borderTop: '1px solid var(--sk-border)', display: 'flex', gap: 10, background: 'var(--sk-surface)' }}>
                  <input className="sk-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message..." />
                  <button type="submit" className="sk-btn sk-btn-primary" aria-label="Send message"><Send size={16} /> Send</button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <style>{`@media (max-width: 768px) { #sk-chat-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
