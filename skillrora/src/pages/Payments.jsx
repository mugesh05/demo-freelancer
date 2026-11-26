import { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function Payments() {
  const { user } = useAuth()
  const [data, setData] = useState({ items: [], gatewayConfigured: false, provider: 'stripe_unconfigured' })
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ type: '', text: '' })

  const load = useCallback(() => {
    setLoading(true)
    api('/api/payments')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const initiate = async (id) => {
    setAlert({ type: '', text: '' })
    try {
      const res = await api(`/api/payments/${id}/initiate`, { method: 'POST' })
      setAlert({ type: 'info', text: res.message || 'Payment initiated.' })
      load()
    } catch (err) {
      setAlert({ type: 'warning', text: err.message })
      load()
    }
  }

  return (
    <div className="page">
      <Header />
      <main className="sk-container">
        <span className="sk-badge blue" style={{ marginBottom: 6 }}>PAYMENTS &amp; LEDGER</span>
        <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Payments &amp; Transaction History</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--sk-muted)' }}>Track order payments, platform fees, and verified payouts.</p>

        {!data.gatewayConfigured && (
          <div className="sk-alert warning">
            Payment gateway status: <strong>{data.provider}</strong>. Live card settlements require <code>STRIPE_SECRET_KEY</code> to be configured on the server; no simulated payments are marked as paid without gateway verification.
          </div>
        )}

        {alert.text && <div className={`sk-alert ${alert.type}`}>{alert.text}</div>}

        {loading ? (
          <div className="sk-skeleton sk-skeleton-card" />
        ) : data.items.length === 0 ? (
          <div className="sk-empty">
            <h3>No payment records yet</h3>
            <p>Payment records are created automatically when orders or project hires begin.</p>
          </div>
        ) : (
          <div className="sk-card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--sk-border)', color: 'var(--sk-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Order</th>
                  <th style={{ padding: '10px 8px' }}>Counterparty</th>
                  <th style={{ padding: '10px 8px' }}>Gross</th>
                  <th style={{ padding: '10px 8px' }}>Fee (10%)</th>
                  <th style={{ padding: '10px 8px' }}>Net</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--sk-border)' }}>
                    <td style={{ padding: '12px 8px' }}><strong>#{p.order_code || p.id}</strong><div style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{p.order_title || 'Project'}</div></td>
                    <td style={{ padding: '12px 8px' }}>{user?.id === p.payer_id ? p.payee_name : p.payer_name}</td>
                    <td style={{ padding: '12px 8px' }}>${p.amount}</td>
                    <td style={{ padding: '12px 8px' }}>${p.platform_fee}</td>
                    <td style={{ padding: '12px 8px' }}><strong>${p.net_amount}</strong></td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`sk-badge ${p.status === 'verified_paid' ? 'green' : p.status === 'failed' ? 'red' : 'amber'}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {user?.id === p.payer_id && p.status !== 'verified_paid' && (
                        <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => initiate(p.id)}>
                          Pay via Gateway
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
