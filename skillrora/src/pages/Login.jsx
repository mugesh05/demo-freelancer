import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import useToast from '../components/useToast.jsx'
import { IMG } from '../data/services.js'

export default function Login() {
  const [visible, setVisible] = useState(false)
  const [notify, toast] = useToast()

  return (
    <div className="page page-login">
      <Header />
      <main className="login-layout">
        <section className="login-promo">
          <span className="eyebrow">YOUR NEXT GREAT PROJECT STARTS HERE</span>
          <h1>Big ideas.<br />Great connections.</h1>
          <p>Find your people, build your business, and bring your next big idea to life.</p>
          <div className="promo-image"><img src={IMG.hero} alt="Freelancer smiling in a bright office" /></div>
          <div className="promo-caption"><h2>A world of talent. A world of possibilities.</h2><p>Good people. Great outcomes.</p></div>
        </section>

        <section className="login-panel">
          <form className="login-card" onSubmit={(e) => { e.preventDefault(); notify('Welcome back') }}>
            <h2>Welcome back</h2>
            <p>Log in to keep great work moving.</p>
            <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" placeholder="you@example.com" required /></div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input id="password" type={visible ? 'text' : 'password'} placeholder="Enter your password" required />
                <button type="button" onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <div className="form-options"><label className="remember"><input type="checkbox" /> Remember me</label><a href="#forgot">Forgot password?</a></div>
            <button className="submit-button" type="submit">Log in</button>
            <p className="signup-link">New to Skillrora? <a href="#signup">Sign up</a></p>
            <a className="help-link" href="#support">Need help logging in? <span>Contact support</span></a>
          </form>
        </section>
      </main>
      <footer className="footer-bar">
        <span>© 2025 Skillrora. All rights reserved.</span>
        <div className="footer-links"><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></div>
      </footer>
      {toast}
    </div>
  )
}
