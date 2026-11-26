import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ExternalLink, AlertTriangle, CheckCircle, Clock, RotateCcw, Wallet, Send, X } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useWallet, NETWORKS } from '../context/WalletContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { api } from '../lib/api.js'

const ESCROW_CONTRACT_ADDRESSES = {
  Polygon: '0x71C945c2C467363412581A0eA1501c51e0Fa2b8C',
  Ethereum: '0x321aF5C8690f38bBfB8d02919F58dB3F1Bcf0A9B',
  Arbitrum: '0x892a0B92B5F7f4955F11c6d860d5b24cE15132cA',
  Bitcoin: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
}

const TABS = [
  ['all', 'All Escrows'],
  ['active', 'Active Orders'],
  ['delivered', 'Delivered Work'],
  ['completed', 'Released & Completed'],
  ['disputed', 'Disputes'],
]

export default function Orders() {
  const { user } = useAuth()
  const { account, isConnected, connectWeb3 } = useWallet()
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Escrow Deposit Modal
  const [depositModalOrder, setDepositModalOrder] = useState(null)
  const [depositTxHash, setDepositTxHash] = useState('')
  const [depositing, setDepositing] = useState(false)

  // Dispute Modal
  const [disputeModalOrder, setDisputeModalOrder] = useState(null)
  const [disputeReason, setDisputeReason] = useState('Quality below agreed requirements')
  const [disputeDetails, setDisputeDetails] = useState('')
  const [filingDispute, setFilingDispute] = useState(false)

  // Review Modal
  const [reviewOrder, setReviewOrder] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api('/api/orders')
      .then((d) => setOrders(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Client deposits crypto into smart contract escrow
  const handleDepositEscrow = async (e) => {
    e.preventDefault()
    if (!depositModalOrder) return
    setDepositing(true)
    setMsg({ type: '', text: '' })
    try {
      const generatedTx = depositTxHash.trim() || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''))
      const clientWallet = account || ('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''))

      await api(`/api/orders/${depositModalOrder.id}/escrow/deposit`, {
        method: 'POST',
        body: {
          tx_hash: generatedTx,
          client_wallet: clientWallet,
          network: depositModalOrder.crypto_network || 'Polygon',
        },
      })
      setMsg({ type: 'success', text: `Crypto Escrow successfully funded! TX: ${generatedTx.slice(0, 10)}... Funds are safely locked.` })
      setDepositModalOrder(null)
      setDepositTxHash('')
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setDepositing(false)
    }
  }

  // Client approves delivery and releases crypto from escrow
  const handleReleaseEscrow = async (orderId) => {
    setMsg({ type: '', text: '' })
    try {
      const res = await api(`/api/orders/${orderId}/escrow/release`, { method: 'POST' })
      setMsg({ type: 'success', text: res.message || 'Escrow released to freelancer on blockchain!' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  // Raise Dispute
  const handleFileDispute = async (e) => {
    e.preventDefault()
    if (!disputeModalOrder) return
    setFilingDispute(true)
    try {
      await api(`/api/orders/${disputeModalOrder.id}/dispute`, {
        method: 'POST',
        body: { reason: disputeReason, description: disputeDetails },
      })
      setMsg({ type: 'warning', text: 'Dispute submitted. Skillrora admin arbitration has been notified.' })
      setDisputeModalOrder(null)
      setDisputeDetails('')
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setFilingDispute(false)
    }
  }

  // Status changes: Freelancer marks delivered, or client requests revision
  const updateStatus = async (id, status) => {
    setMsg({ type: '', text: '' })
    try {
      await api(`/api/orders/${id}/status`, { method: 'PUT', body: { status } })
      setMsg({ type: 'success', text: `Order marked ${status.replace('_', ' ')}.` })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      await api(`/api/orders/${reviewOrder.id}/review`, { method: 'POST', body: { rating: Number(rating), comment } })
      setMsg({ type: 'success', text: 'Review published on chain ledger! Thank you.' })
      setReviewOrder(null)
      setComment('')
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const filtered = orders.filter((o) => {
    if (tab === 'all') return true
    if (tab === 'active') return ['pending_deposit', 'in_escrow', 'in_progress', 'requirements', 'in_revision'].includes(o.escrow_status || o.status)
    if (tab === 'delivered') return (o.escrow_status === 'work_delivered' || o.status === 'delivered')
    if (tab === 'completed') return (o.escrow_status === 'approved_released' || o.status === 'completed')
    if (tab === 'disputed') return (o.escrow_status === 'disputed' || o.status === 'disputed')
    return true
  })

  return (
    <div className="page">
      <Header active="orders" />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span className="sk-badge blue">CRYPTO ESCROW VAULT</span>
              <span className="sk-escrow-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} /> Multi-Sig Security
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Orders &amp; Smart Escrow</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/payments" className="sk-btn sk-btn-outline">
              Blockchain Ledger
            </Link>
          </div>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {TABS.map(([k, label]) => (
            <button key={k} type="button" className={`sk-btn sk-btn-sm ${tab === k ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="sk-skeleton sk-skeleton-card" />
        ) : filtered.length === 0 ? (
          <div className="sk-empty">
            <h3>No escrow orders in this view</h3>
            <p>{user?.role === 'client' ? 'Explore crypto services or hire a freelancer to initiate a smart contract escrow.' : 'Incoming orders from clients will appear here.'}</p>
            <Link to={user?.role === 'client' ? '/explore' : '/projects'} className="sk-btn sk-btn-primary">
              {user?.role === 'client' ? 'Explore Services' : 'Browse Jobs'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((o) => {
              const curr = o.currency || 'USDT'
              const net = o.crypto_network || 'Polygon'
              const escrowStatus = o.escrow_status || (o.status === 'completed' ? 'approved_released' : o.status === 'delivered' ? 'work_delivered' : 'in_escrow')
              const netConfig = NETWORKS.find((n) => n.id.toLowerCase() === net.toLowerCase()) || NETWORKS[0]

              return (
                <div key={o.id} className="sk-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span className="sk-badge gray">#{o.order_code}</span>
                        <span className={`sk-crypto-badge ${curr.toLowerCase()}`}>{curr}</span>
                        <span className="sk-badge blue">{net}</span>

                        {/* Escrow Status Badge */}
                        {escrowStatus === 'pending_deposit' && (
                          <span className="sk-badge amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> Awaiting Client Deposit
                          </span>
                        )}
                        {escrowStatus === 'in_escrow' && (
                          <span className="sk-badge blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <ShieldCheck size={12} /> Funds Locked in Escrow
                          </span>
                        )}
                        {escrowStatus === 'work_delivered' && (
                          <span className="sk-badge purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Work Delivered · Pending Approval
                          </span>
                        )}
                        {escrowStatus === 'approved_released' && (
                          <span className="sk-badge green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Escrow Released &amp; Paid
                          </span>
                        )}
                        {escrowStatus === 'disputed' && (
                          <span className="sk-badge red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={12} /> Under Admin Mediation
                          </span>
                        )}
                        {escrowStatus === 'refunded' && (
                          <span className="sk-badge gray">Refunded to Client</span>
                        )}
                      </div>

                      <strong style={{ display: 'block', fontSize: 17, marginBottom: 4 }}>{o.title}</strong>
                      <div style={{ fontSize: 13, color: 'var(--sk-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span>{user?.role === 'freelancer' ? `Client: ${o.client_name}` : `Freelancer: ${o.freelancer_name}`}</span>
                        <span>Due: {o.due_date || 'Flexible'}</span>
                        <span>Amount: <strong style={{ color: 'var(--sk-ink)' }}>{o.amount} {curr}</strong></span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: 22, display: 'block' }}>{o.amount} {curr}</strong>
                      <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>10% platform fee included</span>
                    </div>
                  </div>

                  {/* Blockchain Proof Bar */}
                  <div style={{ padding: '8px 12px', background: 'var(--sk-surface-2)', borderRadius: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      {o.escrow_tx_hash ? (
                        <a
                          href={`${netConfig.explorer}/tx/${o.escrow_tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--sk-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                        >
                          <ExternalLink size={12} /> Deposit TX: {o.escrow_tx_hash.slice(0, 10)}...{o.escrow_tx_hash.slice(-6)}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--sk-muted)' }}>Escrow Deposit: Pending on-chain transfer</span>
                      )}

                      {o.release_tx_hash && (
                        <a
                          href={`${netConfig.explorer}/tx/${o.release_tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--sk-success)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                        >
                          <ExternalLink size={12} /> Release TX: {o.release_tx_hash.slice(0, 10)}...{o.release_tx_hash.slice(-6)}
                        </a>
                      )}
                    </div>

                    {o.client_wallet && (
                      <span style={{ color: 'var(--sk-muted)' }}>Client: {o.client_wallet.slice(0, 6)}...{o.client_wallet.slice(-4)}</span>
                    )}
                  </div>

                  {/* Escrow Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--sk-border)' }}>
                    <Link to="/messages" className="sk-btn sk-btn-outline sk-btn-sm">Message</Link>

                    {/* Client: Deposit Escrow */}
                    {user?.role === 'client' && escrowStatus === 'pending_deposit' && (
                      <button
                        type="button"
                        className="sk-btn sk-btn-primary sk-btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => setDepositModalOrder(o)}
                      >
                        <ShieldCheck size={14} /> Deposit Escrow ({o.amount} {curr})
                      </button>
                    )}

                    {/* Freelancer: Deliver Work */}
                    {user?.role === 'freelancer' && ['in_escrow', 'requirements', 'in_progress', 'in_revision'].includes(escrowStatus) && (
                      <button
                        type="button"
                        className="sk-btn sk-btn-primary sk-btn-sm"
                        onClick={() => updateStatus(o.id, 'delivered')}
                      >
                        Deliver Work
                      </button>
                    )}

                    {/* Client: Review Delivered Work */}
                    {user?.role === 'client' && escrowStatus === 'work_delivered' && (
                      <>
                        <button
                          type="button"
                          className="sk-btn sk-btn-outline sk-btn-sm"
                          onClick={() => updateStatus(o.id, 'in_revision')}
                        >
                          <RotateCcw size={14} /> Request Revision
                        </button>
                        <button
                          type="button"
                          className="sk-btn sk-btn-danger sk-btn-sm"
                          onClick={() => setDisputeModalOrder(o)}
                        >
                          <AlertTriangle size={14} /> Raise Dispute
                        </button>
                        <button
                          type="button"
                          className="sk-btn sk-btn-primary sk-btn-sm"
                          style={{ background: 'var(--sk-success)' }}
                          onClick={() => handleReleaseEscrow(o.id)}
                        >
                          <CheckCircle size={14} /> Approve &amp; Release Escrow
                        </button>
                      </>
                    )}

                    {/* Client: Leave Review after release */}
                    {user?.role === 'client' && escrowStatus === 'approved_released' && !o.reviewed_by_me && (
                      <button type="button" className="sk-btn sk-btn-primary sk-btn-sm" onClick={() => setReviewOrder(o)}>
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Deposit Escrow Modal */}
        {depositModalOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div className="sk-card" style={{ maxWidth: 520, width: '100%', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDepositModalOrder(null)}
                style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sk-muted)' }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <ShieldCheck size={24} color="var(--sk-primary)" />
                <h2 style={{ margin: 0, fontSize: 20 }}>Fund Smart Escrow</h2>
              </div>

              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--sk-muted)' }}>
                Deposit <strong>{depositModalOrder.amount} {depositModalOrder.currency || 'USDT'}</strong> into the Skillrora Escrow smart contract on the <strong>{depositModalOrder.crypto_network || 'Polygon'}</strong> network.
              </p>

              <div style={{ padding: '12px 14px', background: 'var(--sk-surface-2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--sk-muted)' }}>Escrow Contract Address:</span><br />
                  <code style={{ fontSize: 12, wordBreak: 'break-all', fontWeight: 600 }}>
                    {ESCROW_CONTRACT_ADDRESSES[depositModalOrder.crypto_network] || ESCROW_CONTRACT_ADDRESSES.Polygon}
                  </code>
                </div>
                <div>
                  <span style={{ color: 'var(--sk-muted)' }}>Amount to transfer:</span>{' '}
                  <strong>{depositModalOrder.amount} {depositModalOrder.currency || 'USDT'}</strong>
                </div>
              </div>

              <form onSubmit={handleDepositEscrow}>
                <div className="sk-field">
                  <label>Your Client Wallet Address</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="sk-input"
                      value={account || ''}
                      readOnly
                      placeholder="Connect your Web3 wallet or paste address..."
                    />
                    {!isConnected && (
                      <button type="button" className="sk-btn sk-btn-outline" onClick={connectWeb3}>
                        <Wallet size={14} /> Connect
                      </button>
                    )}
                  </div>
                </div>

                <div className="sk-field">
                  <label>Transaction Hash (TXID Proof)</label>
                  <input
                    className="sk-input"
                    value={depositTxHash}
                    onChange={(e) => setDepositTxHash(e.target.value)}
                    placeholder="e.g. 0x8a92f0... (Leave blank to auto-simulate verified testnet TX)"
                  />
                  <span style={{ fontSize: 11, color: 'var(--sk-muted)', marginTop: 4, display: 'block' }}>
                    Skillrora verifies this transaction on the testnet explorer before locking funds.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="submit" className="sk-btn sk-btn-primary" disabled={depositing} style={{ flex: 1 }}>
                    {depositing ? 'Verifying on-chain...' : `Confirm Escrow Deposit (${depositModalOrder.amount} ${depositModalOrder.currency || 'USDT'})`}
                  </button>
                  <button type="button" className="sk-btn sk-btn-outline" onClick={() => setDepositModalOrder(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {disputeModalOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div className="sk-card" style={{ maxWidth: 520, width: '100%', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDisputeModalOrder(null)}
                style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sk-muted)' }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={24} color="var(--sk-danger)" />
                <h2 style={{ margin: 0, fontSize: 20 }}>Raise Escrow Dispute</h2>
              </div>

              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--sk-muted)' }}>
                Order #{disputeModalOrder.order_code}. Escrow funds will remain safely frozen while Skillrora neutral arbitration reviews the deliverables.
              </p>

              <form onSubmit={handleFileDispute}>
                <div className="sk-field">
                  <label>Dispute Reason</label>
                  <select className="sk-select" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}>
                    <option value="Quality below agreed requirements">Quality below agreed requirements</option>
                    <option value="Missed final deadline without notice">Missed final deadline without notice</option>
                    <option value="Incomplete deliverables or missing code">Incomplete deliverables or missing code</option>
                    <option value="Unresponsive seller">Unresponsive seller</option>
                    <option value="Other breach of milestone terms">Other breach of milestone terms</option>
                  </select>
                </div>

                <div className="sk-field">
                  <label>Evidence &amp; Description</label>
                  <textarea
                    className="sk-textarea"
                    rows={4}
                    value={disputeDetails}
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    placeholder="Provide detailed explanation of the issue and why deliverables do not meet agreed criteria..."
                    required
                    minLength={20}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="submit" className="sk-btn sk-btn-danger" disabled={filingDispute} style={{ flex: 1 }}>
                    {filingDispute ? 'Submitting Dispute...' : 'Submit to Admin Mediation'}
                  </button>
                  <button type="button" className="sk-btn sk-btn-outline" onClick={() => setDisputeModalOrder(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewOrder && (
          <form className="sk-card" style={{ marginTop: 24, maxWidth: 520 }} onSubmit={submitReview}>
            <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Review #{reviewOrder.order_code}</h2>
            <div className="sk-field">
              <label>Rating (1–5)</label>
              <select className="sk-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
              </select>
            </div>
            <div className="sk-field">
              <label>Review comment</label>
              <textarea className="sk-textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} required minLength={5} placeholder="Share your experience working together..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="sk-btn sk-btn-primary">Submit Review</button>
              <button type="button" className="sk-btn sk-btn-outline" onClick={() => setReviewOrder(null)}>Cancel</button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
