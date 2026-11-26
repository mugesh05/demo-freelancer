import { Link } from 'react-router-dom'

export default function Header({ active }) {
  const cls = (name) => (active === name ? 'active' : undefined)
  return (
    <header className="header">
      <Link className="brand" to="/" aria-label="Skillrora home"><i />skillrora</Link>
      <nav className="nav-main" aria-label="Main navigation">
        <Link className={cls('home')} to="/">Home</Link>
        <Link className={cls('explore')} to="/explore">Explore Services</Link>
        <Link to="/#categories">Categories</Link>
        <Link to="/#how">How It Works</Link>
      </nav>
      <nav className="nav-account" aria-label="Account navigation">
        <Link to="/create-gig">Become a freelancer</Link>
        <Link to="/login">Log in</Link>
        <a className="signup" href="#signup">Sign up</a>
      </nav>
    </header>
  )
}
