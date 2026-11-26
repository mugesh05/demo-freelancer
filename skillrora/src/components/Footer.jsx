import { Link } from 'react-router-dom'
import { Shield, Coins } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { CATEGORIES } from '../data/categories.js'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="sk-footer">
      <div className="sk-footer-inner" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr' }}>
        <div>
          <Link className="sk-brand" to="/">
            <span className="sk-brand-mark">S</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff' }}>Skillrora</span>
              <span style={{ fontSize: 10, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                {t('brandTag')}
              </span>
            </div>
          </Link>
          <p style={{ marginTop: 12, lineHeight: 1.6 }}>
            {t('heroSubtitle')}
          </p>

          <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="sk-crypto-badge usdt">USDT</span>
            <span className="sk-crypto-badge usdc">USDC</span>
            <span className="sk-crypto-badge eth">ETH</span>
            <span className="sk-crypto-badge btc">BTC</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
            Polygon · Ethereum · Arbitrum · Bitcoin
          </div>
        </div>

        <div>
          <h4>{t('popularCategoriesTitle')}</h4>
          {CATEGORIES.slice(0, 6).map((c) => (
            <Link key={c.id} to={`/explore?cat=${encodeURIComponent(c.name)}`}>
              {t(c.transKey)}
            </Link>
          ))}
          <Link to="/explore" style={{ color: '#38bdf8', fontWeight: 600 }}>{t('viewAllCategories')}</Link>
        </div>

        <div>
          <h4>For Clients</h4>
          <Link to="/projects">{t('browseProjects')}</Link>
          <Link to="/talent">{t('findTalent')}</Link>
          <Link to="/client-dashboard">{t('dashboard')}</Link>
          <Link to="/payments">{t('payments')}</Link>
          <Link to="/orders">{t('orders')}</Link>
        </div>

        <div>
          <h4>For Freelancers</h4>
          <Link to="/signup?role=freelancer">{t('startFreelancingBtn')}</Link>
          <Link to="/create-gig">{t('createService')}</Link>
          <Link to="/dashboard">{t('dashboard')}</Link>
          <Link to="/my-gigs">Manage Services</Link>
          <Link to="/my-profile">{t('myProfile')}</Link>
        </div>

        <div>
          <h4>Governance &amp; Trust</h4>
          <Link to="/orders">Smart Escrow</Link>
          <Link to="/payments">Transaction Proofs</Link>
          <Link to="/messages">{t('messages')}</Link>
          <Link to="/admin" style={{ color: '#f87171' }}>{t('adminPanel')}</Link>
          <Link to="/login">{t('login')}</Link>
          <Link to="/signup">{t('signup')}</Link>
        </div>
      </div>

      <div className="sk-footer-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="#22c55e" />
          <span>© {new Date().getFullYear()} Skillrora. Non-Custodial Smart Contract Escrow Marketplace.</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>No USD Platform Fees</span>
          <span>Zero Chargeback Risk</span>
          <span>100% On-Chain Milestone Settlement</span>
        </div>
      </div>
    </footer>
  )
}
