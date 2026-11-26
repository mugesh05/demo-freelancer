import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Heart from '../components/Heart.jsx'
import { img, gallery, packages, ratingBars, related } from '../data/services.js'

export default function ServiceDetail() {
  const [shot, setShot] = useState(0)
  const [pkgIndex, setPkgIndex] = useState(1)
  const pkg = packages[pkgIndex]

  return (
    <div className="page page-detail">
      <Header active="explore" />
      <main className="detail">
        <div className="crumbs"><Link to="/">Home</Link><span>›</span><Link to="/explore">Web Development</Link><span>›</span><span>Modern SaaS website</span></div>
        <div className="layout">
          <article>
            <h1 className="title">I will design and develop a modern SaaS website UI</h1>
            <div className="seller-head">
              <span className="avatar">SM</span><b>Sarah Mitchell</b><span className="top">Top Rated</span>
              <span className="review"><span className="stars">★</span> 4.9 <span>(128 reviews)</span></span>
            </div>
            <div className="gallery-main"><img src={img(gallery[shot][0], 1400)} alt={gallery[shot][1]} /></div>
            <div className="gallery-thumbs">
              {gallery.map(([id, alt], i) => (
                <button type="button" key={id} className={i === shot ? 'active-thumb' : undefined} onClick={() => setShot(i)} aria-label={`Show ${alt}`}>
                  <img src={img(id, 500)} alt={alt} />
                </button>
              ))}
            </div>
            <section className="section">
              <h2>About this service</h2>
              <p>I create clean, conversion-focused websites that help growing businesses stand out. Your project will include a polished visual system, responsive layouts, and a smooth handoff ready for development.</p>
              <h3>What you will receive:</h3>
              <ul>
                <li>Unique, responsive website design</li><li>Desktop and mobile layouts</li>
                <li>Clean and organized design files</li><li>Two rounds of revisions</li>
              </ul>
            </section>
            <section className="section">
              <h2>Meet the seller</h2>
              <div className="seller-profile">
                <span className="avatar">SM</span>
                <div><h3>Sarah Mitchell</h3><p>Brand &amp; UI/UX Designer</p><button type="button">Contact me</button></div>
              </div>
              <div className="seller-stats">
                <span><small>From</small><strong>United States</strong></span>
                <span><small>Member since</small><strong>April 2021</strong></span>
                <span><small>Avg. response</small><strong>1 hour</strong></span>
              </div>
            </section>
          </article>

          <aside className="package">
            <div className="package-tabs">
              {packages.map((p, i) => (
                <button type="button" key={p.key} className={i === pkgIndex ? 'active-package' : undefined} onClick={() => setPkgIndex(i)}>{p.key}</button>
              ))}
            </div>
            <div className="package-body">
              <div className="package-price"><strong>{pkg.key} package</strong><b>${pkg.price}</b></div>
              <p>{pkg.blurb}</p>
              <div className="package-meta"><span>◷ {pkg.delivery} days delivery</span><span>↻ {pkg.revisions} {pkg.revisions === 1 ? 'revision' : 'revisions'}</span></div>
              <ul>{pkg.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <button type="button" className="continue">Continue <span>→</span></button>
              <button type="button" className="contact">Contact seller</button>
            </div>
          </aside>
        </div>

        <section className="packages">
          <h2>Choose a package</h2>
          <div className="package-grid">
            {packages.map((p, i) => (
              <article className={'mini-package' + (i === pkgIndex ? ' selected' : '')} key={p.key}>
                <h3>{p.key}</h3><b>${p.price}</b><p>{p.blurb}</p>
                <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <button type="button" onClick={() => setPkgIndex(i)}>Select {p.key}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="reviews">
          <div className="reviews-head">
            <h2>Trusted by happy clients</h2>
            <div className="score">
              <span className="score-main">4.9<br /><span className="stars-large">★★★★★</span></span>
              <div className="bars">
                {ratingBars.map(([n, w]) => (
                  <div className="bar-row" key={n}><span>{n}</span><i><b style={{ width: `${w}%` }} /></i></div>
                ))}
              </div>
            </div>
          </div>
          <article className="review-card">
            <p>Sarah delivered a beautiful, easy-to-use website that exceeded our expectations. The process was clear, collaborative, and completed ahead of schedule.</p>
            <b>Michael Brown</b><small>United States • 2 days ago</small>
          </article>
        </section>

        <section className="related">
          <div className="related-head"><h2>More talent. More possibilities.</h2><Link to="/explore">View all services →</Link></div>
          <div className="related-grid">
            {related.map(([id, alt, ini, av, name, title, r, price]) => (
              <article className="related-card" key={title}>
                <div className="related-card-image"><img src={img(id)} alt={alt} /><Heart /></div>
                <div className="related-card-body">
                  <div className="seller-line"><span className={`avatar ${av}`}>{ini}</span><p><b>{name}</b></p></div>
                  <h3>{title}</h3>
                  <footer><span>★ {r}</span><strong>From ${price}</strong></footer>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
