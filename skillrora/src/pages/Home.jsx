import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import useToast from '../components/useToast.jsx'
import { IMG, img, homeCategories, homeWork, talent, steps, reviews } from '../data/services.js'

const searchCategories = [['All categories', ''], ['Web Development', 'Web Development'], ['UI/UX Design', 'UI/UX Design'], ['Logo Design', 'Graphic Design']]

export default function Home() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('')
  const [notify, toast] = useToast()
  const input = useRef()
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) { input.current.focus(); notify('Enter a service to search'); return }
    navigate(`/explore?q=${encodeURIComponent(q)}${cat ? `&cat=${encodeURIComponent(cat)}` : ''}`)
  }
  const pick = (value) => { setQuery(value); input.current.focus() }

  return (
    <div className="page page-home">
      <Header active="home" />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Turn Your Ideas Into<br />Reality With The Right<br />Talent.</h1>
            <p>Discover skilled freelancers and bring your projects to life.</p>
            <form className="search" onSubmit={submit}>
              <span className="search-icon">⌕</span>
              <input ref={input} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What service are you looking for?" aria-label="Search services" />
              <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
                {searchCategories.map(([label, value]) => <option key={label} value={value}>{label}</option>)}
              </select>
              <button type="submit">Search</button>
            </form>
            <div className="popular">
              <span>Popular:</span>
              <button type="button" onClick={() => pick('Web Development')}>Web Development</button>
              <button type="button" onClick={() => pick('Logo Design')}>Logo Design</button>
              <button type="button" onClick={() => pick('UI/UX Design')}>UI/UX</button>
            </div>
            <div className="rating"><span>★★★★★</span><small>4.9/5 from 12,000+ happy clients</small></div>
          </div>
          <div className="hero-art">
            <div className="back-photo"><img src={IMG.hero} alt="Professional freelancer" /></div>
            <div className="float-card project-card"><b>2,400+</b><span>Projects completed</span></div>
            <div className="float-card profile-card">
              <div className="mini-avatar">SM</div>
              <div><b>Sarah Mitchell</b><span>UI/UX Designer</span></div>
              <strong>★ 4.9</strong>
            </div>
          </div>
        </section>

        <section className="trusted">
          <span>Trusted by ambitious teams at</span>
          {['Google', 'Notion', 'stripe', 'Webflow', 'amazon'].map((n) => <b key={n}>{n}</b>)}
        </section>

        <section className="categories-section" id="categories">
          <div className="heading">
            <div><h2>Find your next big thing</h2><p>Explore services across every category</p></div>
            <Link to="/explore">View all categories →</Link>
          </div>
          <div className="category-grid">
            {homeCategories.map(([icon, name, n]) => (
              <button type="button" key={name} onClick={() => navigate(`/explore?q=${encodeURIComponent(name)}`)}>
                <span className="cat-icon">{icon}</span><b>{name}</b><small>{n} freelancers</small>
              </button>
            ))}
          </div>
        </section>

        <section className="work-section" id="explore">
          <div className="heading">
            <div><h2>Great work starts here</h2><p>Top talent delivering exceptional results</p></div>
            <Link to="/explore">Explore all services →</Link>
          </div>
          <div className="work-grid">
            {homeWork.map((w) => (
              <article className="work-card" key={w.title}>
                <div className={`work-image ${w.tint}`}><img src={img(w.img)} alt={w.alt} /></div>
                <div className="work-info">
                  <h3>{w.title}</h3>
                  <div className="seller">
                    <div className={`avatar ${w.av}`}>{w.ini}</div>
                    <p><b>{w.name}</b><small>{w.level}</small></p>
                  </div>
                  <footer><span>★ {w.rating} <small>({w.count})</small></span><b>From ${w.price}</b></footer>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="talent-section">
          <div className="heading">
            <div><h2>Meet your next dream team</h2><p>Build, with the right people in your corner</p></div>
            <Link to="/explore">Browse talent →</Link>
          </div>
          <div className="talent-grid">
            {talent.map(([cls, ini, name, role, r, n, rate]) => (
              <article key={name}>
                <div className={`talent-photo ${cls}`}>{ini}</div>
                <div><h3>{name}</h3><p>{role}</p><small>★ {r} · {n} projects</small> <strong>${rate}/hr</strong></div>
              </article>
            ))}
          </div>
        </section>

        <section className="steps" id="how">
          <h2>From idea to done. In three simple steps.</h2>
          <p>Everything you need to work with confidence.</p>
          <div className="step-grid">
            {steps.map(([title, text], i) => (
              <article key={title}><span>{String(i + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </section>

        <section className="testimonials">
          <div className="heading">
            <div><h2>Good people. Great outcomes.</h2><p>What our clients and freelancers have to say</p></div>
            <div className="arrows"><button type="button" aria-label="Previous">←</button><button type="button" aria-label="Next">→</button></div>
          </div>
          <div className="review-grid">
            {reviews.map(([text, who]) => (
              <article key={who}><div className="stars">★★★★★</div><p>“{text}”</p><b>{who}</b></article>
            ))}
          </div>
        </section>

        <section className="cta">
          <div><h2>Ready to turn your ideas into reality?</h2><p>Join thousands of people building amazing things.</p></div>
          <a href="#">Start Selling Your Skills Today</a>
        </section>
      </main>
      <Footer variant="home" />
      {toast}
    </div>
  )
}
