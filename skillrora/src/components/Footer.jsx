import { Link } from 'react-router-dom'

const home = [
  ['Explore', ['Categories', 'Top Talent', 'Projects']],
  ['Company', ['About', 'Careers', 'Press']],
  ['Support', ['Help Center', 'Trust & Safety']],
]
const full = [
  ['Explore', ['Development & Tech', 'Design & Creative', 'Digital Marketing', 'Writing & Translation']],
  ['For clients', ['How It Works', 'Success Stories', 'Talent Solutions']],
  ['For freelancers', ['Become a Freelancer', 'Community', 'Resources']],
  ['Company', ['About Us', 'Careers', 'Contact']],
]

export default function Footer({ variant = 'full', social = false }) {
  const cols = variant === 'home' ? home : full
  return (
    <>
      <footer className="site-footer">
        <div className="footer-brand">
          <Link className="brand" to="/"><i />skillrora</Link>
          <p>
            {variant === 'home'
              ? <>Where great ideas meet<br />great talent.</>
              : <>A world of talent.<br />Ready for your next big idea.</>}
          </p>
          {social && <div className="social"><span>in</span><span>◎</span><span>𝕏</span></div>}
        </div>
        {cols.map(([title, links]) => (
          <div className="footer-col" key={title}>
            <b>{title}</b>
            {links.map((l) => <a href="#" key={l}>{l}</a>)}
          </div>
        ))}
      </footer>
      {variant === 'full' && (
        <div className="bottom-bar">
          <span>© 2025 Skillrora. All rights reserved.</span>
          <span>Privacy Policy&nbsp;&nbsp; Terms of Service&nbsp;&nbsp; Cookies{social && <>&nbsp;&nbsp; English ▾</>}</span>
        </div>
      )}
    </>
  )
}
