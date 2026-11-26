import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, ShieldCheck, Coins, CheckCircle, Clock, AlertTriangle, Wallet } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useWallet, NETWORKS } from '../context/WalletContext.jsx'
import { api } from '../lib/api.js'

export default function Payments() {
  const { user } = useAuth()
  const { account, isConnected, connectWeb3 } = useWallet()
  const [data, setData] = useState({ items: [], gatewayConfigured: true, provider: 'smart_contract_escrow' })
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ type: '', text: '' })
  const [currencyFilter, setCurrencyFilter] = useState('ALL')

  const load = useCallback(() => {
    setLoading(true)
    api('/api/payments')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filteredItems = (data.items || []).filter((p) => {
    if (currencyFilter === 'ALL') return true
    return (p.crypto_currency || 'USDT').toUpperCase() === currencyFilter.toUpperCase()
  })

  // Calculate totals by currency
  const currencyTotals = (data.items || []).reduce((acc, p) => {
    const c = (p.crypto_currency || 'USDT').toUpperCase()
    acc[c] = (acc[c] || 0) + Number(p.amount || 0)
    return acc
  }, {})

  return (
    <div className="page">
      <Header active="payments" />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span className="sk-badge blue">BLOCKCHAIN SETTLEMENT</span>
              <span className="sk-escrow-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} /> Zero Chargeback
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Crypto Payments &amp; Escrow Ledger</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/orders" className="sk-btn sk-btn-primary">
              <ShieldCheck size={16} /> Manage Escrow Orders
            </Link>
          </div>
        </div>

        {/* Multi-Chain Escrow Status Banner */}
        <div className="sk-card" style={{ background: 'var(--sk-surface-2)', border: '1px solid var(--sk-border)', marginBottom: 24, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Coins size={28} color="var(--sk-primary)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 16, display: 'block' }}>Decentralized Multi-Chain Settlement Active</strong>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--sk-muted)' }}>
                  All platform payments are settled exclusively in <strong>USDT, USDC, ETH, or BTC</strong>. No USD or fiat custody.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {isConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'var(--sk-surface)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--sk-border)' }}>
                  <Wallet size={14} color="var(--sk-success)" />
                  <span>Connected: <strong>{account.slice(0, 6)}...{account.slice(-4)}</strong></span>
                </div>
              ) : (
                <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={connectWeb3}>
                  <Wallet size={14} /> Connect Web3 Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Currency Volume Breakdown Cards */}
        <div className="sk-grid-4" style={{ marginBottom: 24 }}>
          {['USDT', 'USDC', 'ETH', 'BTC'].map((curr) => (
            <div key={curr} className="sk-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>{curr} Volume</span>
                <span className={`sk-crypto-badge ${curr.toLowerCase()}`}>{curr}</span>
              </div>
              <strong style={{ fontSize: 24, display: 'block' }}>
                {Number(currencyTotals[curr] || 0).toLocaleString()} {curr}
              </strong>
            </div>
          ))}
        </div>

        {alert.text && <div className={`sk-alert ${alert.type}`}>{alert.text}</div>}

        {/* Currency Filter Bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sk-muted)' }}>Filter by Currency:</span>
          {['ALL', 'USDT', 'USDC', 'ETH', 'BTC'].map((c) => (
            <button
              key={c}
              type="button"
              className={`sk-btn sk-btn-sm ${currencyFilter === c ? 'sk-btn-primary' : 'sk-btn-outline'}`}
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setCurrencyFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="sk-skeleton sk-skeleton-card" />
        ) : filteredItems.length === 0 ? (
          <div className="sk-empty">
            <h3>No crypto payment records found</h3>
            <p>On-chain records are generated automatically when orders are deposited into smart contract escrow.</p>
            <Link to="/orders" className="sk-btn sk-btn-primary">View Escrow Orders</Link>
          </div>
        ) : (
          <div className="sk-card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--sk-border)', color: 'var(--sk-muted)', background: 'var(--sk-surface-2)' }}>
                  <th style={{ padding: '12px 14px' }}>Order / Brief</th>
                  <th style={{ padding: '12px 14px' }}>Asset &amp; Network</th>
                  <th style={{ padding: '12px 14px' }}>Counterparty</th>
                  <th style={{ padding: '12px 14px' }}>Gross</th>
                  <th style={{ padding: '12px 14px' }}>Fee (10%)</th>
                  <th style={{ padding: '12px 14px' }}>Net Payout</th>
                  <th style={{ padding: '12px 14px' }}>Escrow Status</th>
                  <th style={{ padding: '12px 14px' }}>On-Chain Proof</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((p) => {
                  const curr = p.crypto_currency || 'USDT'
                  const net = p.crypto_network || 'Polygon'
                  const netConfig = NETWORKS.find((n) => n.id.toLowerCase() === net.toLowerCase()) || NETWORKS[0]
                  const explorerLink = p.explorer_url || (p.tx_hash ? `${netConfig.explorer}/tx/${p.tx_hash}` : null)

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--sk-border)' }}>
                      <td style={{ padding: '14px' }}>
                        <Link to="/orders" style={{ fontWeight: 700, color: 'var(--sk-primary)' }}>
                          #{p.order_code || p.id}
                        </Link>
                        <div style={{ fontSize: 12, color: 'var(--sk-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.order_title || 'Direct Escrow'}
                        </div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`sk-crypto-badge ${curr.toLowerCase()}`}>{curr}</span>
                          <span className="sk-badge gray" style={{ fontSize: 11 }}>{net}</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 600 }}>{user?.id === p.payer_id ? p.payee_name : p.payer_name}</div>
                        {(p.payer_wallet || p.payee_wallet) && (
                          <div style={{ fontSize: 11, color: 'var(--sk-muted)', fontFamily: 'monospace' }}>
                            {((user?.id === p.payer_id ? p.payee_wallet : p.payer_wallet) || '').slice(0, 8)}...
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px', fontWeight: 600 }}>
                        {p.amount} {curr}
                      </td>

                      <td style={{ padding: '14px', color: 'var(--sk-muted)' }}>
                        {p.platform_fee} {curr}
                      </td>

                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--sk-success)' }}>
                        {p.net_amount} {curr}
                      </td>

                      <td style={{ padding: '14px' }}>
                        <span className={`sk-badge ${['verified_paid', 'released_to_seller'].includes(p.status) ? 'green' : p.status === 'in_escrow' ? 'blue' : p.status === 'disputed' ? 'red' : 'amber'}`}>
                          {p.status === 'released_to_seller' ? 'Released to Seller' : p.status === 'in_escrow' ? 'Locked in Escrow' : p.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td style={{ padding: '14px' }}>
                        {explorerLink ? (
                          <a
                            href={explorerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="sk-btn sk-btn-outline sk-btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                          >
                            <ExternalLink size={12} /> View TX Proof
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>Pending TX</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
