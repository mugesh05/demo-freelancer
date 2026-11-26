import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Shield, Users, Wallet } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [disputes, setDisputes] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('disputes')
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      api('/api/admin/stats').catch(() => null),
      api('/api/admin/disputes').catch(() => ({ items: [] })),
      api('/api/admin/orders').catch(() => ({ items: [] })),
      api('/api/admin/users').catch(() => ({ items: [] })),
      api('/api/admin/transactions').catch(() => ({ items: [] })),
    ])
      .then(([st, disp, ord, usr, tx]) => {
        if (st) setStats(st)
        setDisputes(disp.items || [])
        setOrders(ord.items || [])
        setUsers(usr.items || [])
        setTransactions(tx.items || [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const resolveDispute = async (id, resolution) => {
    setMsg({ type: '', text: '' })
    try {
      await api(`/api/admin/disputes/${id}/resolve`, {
        method: 'PUT',
        body: { resolution, admin_notes: adminNote },
      })
      setMsg({ type: 'success', text: `Dispute resolved successfully (${resolution.replace(/_/g, ' ')}).` })
      setResolvingId(null)
      setAdminNote('')
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const changeUserRole = async (userId, newRole) => {
    try {
      await api(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: { role: newRole },
      })
      setMsg({ type: 'success', text: 'User role updated.' })
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="page">
      <Header active="admin" />
      <main className="sk-container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="sk-badge red" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <Shield size={13} /> {t('adminPanel')}
              </span>
              <span className="sk-badge blue">TESTNET ARBITRATION</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Platform Governance &amp; Escrow Mediation</h1>
          </div>
          <button type="button" className="sk-btn sk-btn-outline" onClick={loadData}>
            <RefreshCw size={15} /> Refresh Console
          </button>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        {/* Global Crypto Metrics */}
        {stats && (
          <div className="sk-grid-4" style={{ marginBottom: 28 }}>
            <div className="sk-card">
              <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Registered Users</span>
              <strong style={{ display: 'block', fontSize: 26, marginTop: 4 }}>{stats.totalUsers}</strong>
              <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{stats.totalFreelancers} Freelancers · {stats.totalClients} Clients</span>
            </div>
            <div className="sk-card">
              <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Active Disputes</span>
              <strong style={{ display: 'block', fontSize: 26, marginTop: 4, color: stats.activeDisputes > 0 ? '#dc2626' : 'var(--sk-ink)' }}>
                {stats.activeDisputes}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>Requires admin arbitration</span>
            </div>
            <div className="sk-card">
              <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Escrow Orders</span>
              <strong style={{ display: 'block', fontSize: 26, marginTop: 4 }}>{stats.inEscrowOrders} active</strong>
              <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{stats.totalOrders} total platform orders</span>
            </div>
            <div className="sk-card">
              <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Crypto Volume in Escrow</span>
              <div style={{ marginTop: 4 }}>
                {(stats.escrowVolume || []).length === 0 ? (
                  <strong style={{ fontSize: 24 }}>0 USDT</strong>
                ) : (
                  stats.escrowVolume.map((v) => (
                    <strong key={v.currency} style={{ display: 'block', fontSize: 18 }}>
                      {v.total} {v.currency}
                    </strong>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Management Tabs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            type="button"
            className={`sk-btn sk-btn-sm ${activeTab === 'disputes' ? 'sk-btn-primary' : 'sk-btn-outline'}`}
            onClick={() => setActiveTab('disputes')}
          >
            Disputes &amp; Mediation ({disputes.filter((d) => d.status === 'open').length})
          </button>
          <button
            type="button"
            className={`sk-btn sk-btn-sm ${activeTab === 'orders' ? 'sk-btn-primary' : 'sk-btn-outline'}`}
            onClick={() => setActiveTab('orders')}
          >
            Escrow Orders ({orders.length})
          </button>
          <button
            type="button"
            className={`sk-btn sk-btn-sm ${activeTab === 'users' ? 'sk-btn-primary' : 'sk-btn-outline'}`}
            onClick={() => setActiveTab('users')}
          >
            User Management ({users.length})
          </button>
          <button
            type="button"
            className={`sk-btn sk-btn-sm ${activeTab === 'transactions' ? 'sk-btn-primary' : 'sk-btn-outline'}`}
            onClick={() => setActiveTab('transactions')}
          >
            Blockchain Ledger ({transactions.length})
          </button>
        </div>

        {/* Tab 1: Disputes */}
        {activeTab === 'disputes' && (
          <section className="sk-card">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Escrow Dispute Arbitration</h2>
            {disputes.length === 0 ? (
              <div className="sk-empty" style={{ padding: '32px 0' }}>
                <CheckCircle size={36} color="var(--sk-success)" style={{ marginBottom: 8 }} />
                <h3>No active disputes</h3>
                <p>All escrow contracts are operating smoothly with zero client-freelancer conflicts.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {disputes.map((d) => (
                  <div key={d.id} style={{ border: '1px solid var(--sk-border)', borderRadius: 12, padding: 18, background: 'var(--sk-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                      <div>
                        <strong style={{ fontSize: 16 }}>Order #{d.order_code}: {d.order_title}</strong>
                        <div style={{ fontSize: 13, color: 'var(--sk-muted)', marginTop: 2 }}>
                          Filed by: <strong>{d.initiator_name}</strong> · Locked: <strong>{d.amount} {d.currency}</strong> on {d.crypto_network}
                        </div>
                      </div>
                      <span className={`sk-escrow-badge ${d.status === 'open' ? 'disputed' : 'approved_released'}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div style={{ padding: 12, background: 'var(--sk-surface)', borderRadius: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sk-muted)', display: 'block', marginBottom: 4 }}>REASON / CLAIM:</span>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{d.reason}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 13 }}>
                      <div>
                        Client: <strong>{d.client_name}</strong> (<code>{d.client_wallet ? `${d.client_wallet.slice(0, 8)}...` : 'No wallet'}</code>) | 
                        Freelancer: <strong>{d.freelancer_name}</strong> (<code>{d.freelancer_wallet ? `${d.freelancer_wallet.slice(0, 8)}...` : 'No wallet'}</code>)
                      </div>

                      {d.status === 'open' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="sk-btn sk-btn-primary sk-btn-sm"
                            onClick={() => resolveDispute(d.id, 'release_to_freelancer')}
                          >
                            Release Escrow to Freelancer
                          </button>
                          <button
                            type="button"
                            className="sk-btn sk-btn-outline sk-btn-sm"
                            onClick={() => resolveDispute(d.id, 'refund_to_client')}
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            Refund Client
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <section className="sk-card">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>All Marketplace Escrow Orders</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--sk-border)', color: 'var(--sk-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>Order Code</th>
                    <th style={{ padding: '10px 8px' }}>Deliverable</th>
                    <th style={{ padding: '10px 8px' }}>Parties</th>
                    <th style={{ padding: '10px 8px' }}>Amount</th>
                    <th style={{ padding: '10px 8px' }}>Escrow Status</th>
                    <th style={{ padding: '10px 8px' }}>TX Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--sk-border)' }}>
                      <td style={{ padding: '12px 8px' }}><strong>#{o.order_code}</strong></td>
                      <td style={{ padding: '12px 8px' }}>{o.title}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div>Client: <strong>{o.client_name}</strong></div>
                        <div style={{ fontSize: 12, color: 'var(--sk-muted)' }}>Freelancer: {o.freelancer_name}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`sk-crypto-badge ${o.currency.toLowerCase()}`}>
                          {o.amount} {o.currency}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`sk-escrow-badge ${o.escrow_status}`}>
                          {o.escrow_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {o.escrow_tx_hash ? (
                          <span style={{ fontSize: 12, fontFamily: 'monospace' }}>
                            {o.escrow_tx_hash.slice(0, 10)}...
                          </span>
                        ) : (
                          <span style={{ color: 'var(--sk-muted)', fontSize: 12 }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 3: Users */}
        {activeTab === 'users' && (
          <section className="sk-card">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>User Role &amp; Wallet Management</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--sk-border)', color: 'var(--sk-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>User</th>
                    <th style={{ padding: '10px 8px' }}>Email</th>
                    <th style={{ padding: '10px 8px' }}>Current Role</th>
                    <th style={{ padding: '10px 8px' }}>Wallet Address</th>
                    <th style={{ padding: '10px 8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--sk-border)' }}>
                      <td style={{ padding: '12px 8px' }}><strong>{u.name}</strong></td>
                      <td style={{ padding: '12px 8px' }}>{u.email}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`sk-badge ${u.role === 'admin' ? 'red' : u.role === 'freelancer' ? 'blue' : 'gray'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {u.wallet_address ? (
                          <code style={{ fontSize: 12 }}>{u.wallet_address.slice(0, 8)}...{u.wallet_address.slice(-6)}</code>
                        ) : (
                          <span style={{ color: 'var(--sk-muted)', fontSize: 12 }}>Not set</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <select
                          className="sk-select"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          value={u.role}
                          onChange={(e) => changeUserRole(u.id, e.target.value)}
                        >
                          <option value="client">Client</option>
                          <option value="freelancer">Freelancer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 4: Blockchain Ledger */}
        {activeTab === 'transactions' && (
          <section className="sk-card">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>On-Chain Transaction Receipts</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--sk-border)', color: 'var(--sk-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>Order</th>
                    <th style={{ padding: '10px 8px' }}>Counterparty</th>
                    <th style={{ padding: '10px 8px' }}>Crypto Amount</th>
                    <th style={{ padding: '10px 8px' }}>Fee (10%)</th>
                    <th style={{ padding: '10px 8px' }}>Net</th>
                    <th style={{ padding: '10px 8px' }}>Network</th>
                    <th style={{ padding: '10px 8px' }}>Blockchain Explorer</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--sk-border)' }}>
                      <td style={{ padding: '12px 8px' }}><strong>#{t.order_code || t.id}</strong></td>
                      <td style={{ padding: '12px 8px' }}>{t.payer_name} → {t.payee_name}</td>
                      <td style={{ padding: '12px 8px' }}><strong>{t.amount} {t.crypto_currency}</strong></td>
                      <td style={{ padding: '12px 8px' }}>{t.platform_fee} {t.crypto_currency}</td>
                      <td style={{ padding: '12px 8px' }}><strong>{t.net_amount} {t.crypto_currency}</strong></td>
                      <td style={{ padding: '12px 8px' }}><span className="sk-badge gray">{t.crypto_network}</span></td>
                      <td style={{ padding: '12px 8px' }}>
                        {t.explorer_url ? (
                          <a
                            href={t.explorer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sk-btn sk-btn-outline sk-btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            TX Proof <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--sk-muted)', fontSize: 12 }}>Pending TX</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
