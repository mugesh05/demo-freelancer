import { Link } from 'react-router-dom'
import SellerHeader, { SellerFooter, Avatar } from '../components/SellerHeader.jsx'
import useToast from '../components/useToast.jsx'
import { profile } from '../data/seller.js'

export default function MyProfile() {
  const [notify, toast] = useToast()
  const soon = (t) => (e) => { e.preventDefault(); notify(t) }
  return (
    <div className="page page-seller">
      <SellerHeader active="dashboard" />
      <main className="s-main">
        <div className="s-top">
          <div>
            <span className="eyebrow">LET YOUR WORK TELL YOUR STORY</span>
            <h1>My profile</h1>
            <p>Make a great first impression. Build lasting connections.</p>
          </div>
          <Link className="s-ghost" to="/explore">View public profile ↗</Link>
        </div>

        <div className="profile-layout">
          <aside className="p-card p-side">
            <div className="p-photo"><Avatar ini="AM" tint="#e6d5c8" size={96} /><i className="online" /></div>
            <h2>Alex Morgan</h2>
            <p className="role">UI / UX &amp; Brand Designer</p>
            <span className="avail">Available for work</span>
            <div className="rating"><span>★ 5.0</span> <small>(18 reviews)</small></div>
            <button type="button" className="s-primary full" onClick={() => notify('Profile editing is coming soon')}>Edit profile</button>
            <dl>
              <div><dt>From</dt><dd>United States</dd></div>
              <div><dt>Member since</dt><dd>January 2024</dd></div>
              <div><dt>Avg. response time</dt><dd>1 hour</dd></div>
              <div><dt>Completed orders</dt><dd>20</dd></div>
            </dl>
            <h4>Languages</h4>
            <dl className="langs">
              <div><dt>English</dt><dd>Native / Bilingual</dd></div>
              <div><dt>Spanish</dt><dd>Conversational</dd></div>
            </dl>
            <small className="local">Local time: 10:45 AM</small>
          </aside>

          <div className="p-col">
            <section className="p-card">
              <div className="p-head"><h3>About me</h3><a href="#edit" onClick={soon('Editing is coming soon')}>Edit</a></div>
              <b className="tagline">Thoughtful design. Meaningful experiences.</b>
              <p className="about">Hi, I&rsquo;m Alex &mdash; a UI/UX and brand designer helping ambitious businesses turn big ideas into intuitive digital experiences. From your first wireframe to your final brand touchpoint, I bring clarity, care, and a collaborative spirit to every project.</p>
            </section>

            <section className="p-card">
              <div className="p-head"><h3>Selected work</h3><Link to="/my-gigs">Manage portfolio →</Link></div>
              <div className="work-row">
                {profile.work.map((w) => (
                  <figure key={w.title}><img src={w.img} alt={w.title} /><figcaption><b>{w.title}</b><small>{w.cat}</small></figcaption></figure>
                ))}
              </div>
            </section>

            <section className="p-card skills">
              <h3>Skills &amp; expertise</h3>
              <div className="skill-row">{profile.skills.map((s) => <span key={s}>{s}</span>)}</div>
            </section>

            <section className="p-card review">
              <div className="rev-head">
                <span className="who"><Avatar ini="DW" tint="#c9d6ea" size={40} /><span><b>Daniel Wilson</b><em>★★★★★</em></span></span>
                <span><small className="count">18 reviews</small> · <a href="#reviews" onClick={soon('All reviews are coming soon')}>See all →</a></span>
              </div>
              <p>Alex made the whole process effortless. Beautiful work, clear communication, and real attention to detail.</p>
            </section>
          </div>
        </div>
      </main>
      <SellerFooter />
      {toast}
    </div>
  )
}
