import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="sk-footer">
      <div className="sk-footer-inner">
        <div>
          <Link className="sk-brand" to="/"><span className="sk-brand-mark">S</span><span>Skillrora</span></Link>
          <p>The modern freelance marketplace connecting ambitious teams with vetted independent talent worldwide.</p>
        </div>
        <div>
          <h4>Categories</h4>
          <Link to="/explore?cat=Web%20Development">Web Development</Link>
          <Link to="/explore?cat=UI%2FUX%20Design">UI/UX Design</Link>
          <Link to="/explore?cat=Graphic%20Design">Brand &amp; Graphic Design</Link>
          <Link to="/explore?cat=AI%20%26%20Automation">AI &amp; Automation</Link>
        </div>
        <div>
          <h4>For Clients</h4>
          <Link to="/projects">Post &amp; Browse Projects</Link>
          <Link to="/talent">Find Freelancers</Link>
          <Link to="/client-dashboard">Client Dashboard</Link>
          <Link to="/payments">Payments &amp; Escrow</Link>
        </div>
        <div>
          <h4>For Freelancers</h4>
          <Link to="/signup?role=freelancer">Become a Freelancer</Link>
          <Link to="/create-gig">Create a Service Gig</Link>
          <Link to="/dashboard">Freelancer Dashboard</Link>
          <Link to="/my-gigs">Manage Gigs</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Create Account</Link>
          <Link to="/forgot-password">Reset Password</Link>
          <Link to="/messages">Messages</Link>
        </div>
      </div>
      <div className="sk-footer-bottom">
        <span>© {new Date().getFullYear()} Skillrora. All rights reserved.</span>
        <span>Built for transparent, secure freelance collaboration.</span>
      </div>
    </footer>
  )
}
