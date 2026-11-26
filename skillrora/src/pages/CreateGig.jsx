import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useToast from '../components/useToast.jsx'
import { IMG, img } from '../data/services.js'

const SUBCATS = {
  'Graphics & Design': ['Logo Design', 'Brand Style Guides', 'Illustration', 'Packaging Design'],
  'Programming & Tech': ['Website Development', 'Mobile Apps', 'API Integration'],
  'Digital Marketing': ['SEO', 'Social Media', 'Email Marketing'],
  'Video & Animation': ['Video Editing', 'Motion Graphics', 'Explainers'],
}
const DEFAULT_INCLUDED = ['2 original logo concepts', 'High-resolution PNG & JPG', 'Editable vector source files', 'Commercial use']

function Section({ n, title, sub, children }) {
  return (
    <section className="gig-card">
      <h2><span>{n}</span>{title}</h2>
      <p className="gig-sub">{sub}</p>
      {children}
    </section>
  )
}

export default function CreateGig() {
  const [notify, toast] = useToast()
  const [title, setTitle] = useState('I will design a modern minimalist logo for your brand')
  const [category, setCategory] = useState('Graphics & Design')
  const [subcategory, setSubcategory] = useState('Logo Design')
  const [tags, setTags] = useState(['Logo design', 'Minimalist', 'Brand identity'])
  const [tagInput, setTagInput] = useState('')
  const [description, setDescription] = useState(
    'Give your brand a memorable first impression. I create clean, thoughtful logos that capture your story and work beautifully across print and digital.\n\nYou\u2019ll receive five original concepts, collaborative revisions, and production-ready files. Every design is made from scratch for your business.'
  )
    const [pkgName, setPkgName] = useState('Brand essentials')
  const [price, setPrice] = useState('85')
  const [delivery, setDelivery] = useState('3 days')
  const [revisions, setRevisions] = useState('2 revisions')
  const [included, setIncluded] = useState(DEFAULT_INCLUDED)
  const [cover, setCover] = useState(img(IMG.logo, 600))
  const [coverName, setCoverName] = useState('brand-identity-cover.jpg')
  const [question, setQuestion] = useState('What is your business name, who is your audience, and what style do you have in mind? Please share any brand colors or references.')
  const [required, setRequired] = useState(true)
  const [extraQs, setExtraQs] = useState([])
  const [confirmed, setConfirmed] = useState(true)

  const addTag = (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const t = tagInput.trim()
    if (t && tags.length < 5 && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }
  const onCover = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCover(URL.createObjectURL(f))
    setCoverName(f.name)
  }

  const checklist = useMemo(() => [
    ['Clear title & category', title.trim().length >= 15 && !!category && !!subcategory],
    ['Description of your service', description.trim().length >= 80],
    ['Price & delivery time', Number(price) > 0 && !!delivery],
    ['At least one work sample', !!cover],
    ['Buyer requirements', question.trim().length > 0],
  ], [title, category, subcategory, description, price, delivery, cover, question])
  const done = checklist.filter(([, ok]) => ok).length

  const publish = () => {
    if (!confirmed) return notify('Please confirm the Community Standards first')
    if (done < checklist.length) return notify('Complete every checklist item before publishing')
    notify('Your gig is published')
  }

  return (
    <div className="page page-gig">
      <header className="gig-header">
        <Link className="brand" to="/" aria-label="Skillrora home"><i />skillrora</Link>
        <nav className="gig-nav" aria-label="Seller navigation">
          <Link className="active" to="/my-profile">Selling</Link>
          <Link to="/my-gigs">My gigs</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/messages">Messages</Link>
        </nav>
        <div className="gig-account">
          <a className="switch" href="#buying">Switch to buying</a>
          <a href="#help">Help</a>
          <button type="button" className="account-btn">Account</button>
        </div>
      </header>

      <main className="gig-main">
        <div className="gig-crumbs"><Link to="/my-gigs">My gigs</Link> <span>›</span> <b>Create a gig</b></div>
        <div className="gig-top">
          <div>
            <h1>Create a gig</h1>
            <p className="lead">Turn your skills into your next opportunity.</p>
            <p className="draft"><b>DRAFT</b> · Only you can see this gig until you publish.</p>
          </div>
          <button type="button" className="ghost-btn" onClick={() => notify('Draft saved')}>Save draft</button>
        </div>

        <div className="gig-layout">
          <div className="gig-forms">
            <Section n="01" title="The essentials" sub="Give buyers a clear first impression.">
              <label className="lbl" htmlFor="gtitle">Gig title</label>
              <input id="gtitle" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
              <div className="hint-row"><span>Start with &ldquo;I will&rdquo; and describe the result you deliver.</span><span>{title.length} / 80</span></div>
              <div className="two-col">
                <div>
                  <label className="lbl" htmlFor="gcat">Category</label>
                  <select id="gcat" value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(SUBCATS[e.target.value][0]) }}>
                    {Object.keys(SUBCATS).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="gsub">Subcategory</label>
                  <select id="gsub" value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                    {SUBCATS[category].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <label className="lbl" htmlFor="gtags">Search tags</label>
              <div className="tag-box">
                {tags.map((t) => (
                  <span className="tag" key={t}>{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>×</button></span>
                ))}
                {tags.length < 5 && <input id="gtags" className="tag-input" placeholder="Add a tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} />}
              </div>
              <div className="hint-row"><span>{tags.length} of 5 tags added. Use words buyers would search for.</span></div>
            </Section>

            <Section n="02" title="Describe your service" sub="Show buyers what makes your work the right fit.">
              <label className="lbl" htmlFor="gdesc">Gig description</label>
              <textarea id="gdesc" className="desc" maxLength={1200} value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="hint-row"><span>Explain your process, what is included, and what buyers can expect.</span><span>{description.length} / 1,200</span></div>
            </Section>

            <Section n="03" title="Scope & pricing" sub="Set a clear offer with a price that reflects your work.">
              <div className="mode-tabs">
                <button type="button" className="on">Single package</button>
                <button type="button" onClick={() => notify('3-package pricing is coming soon')}>3 packages</button>
              </div>
              <label className="lbl" htmlFor="gpkg">Package name</label>
              <input id="gpkg" value={pkgName} onChange={(e) => setPkgName(e.target.value)} />
              <div className="three-col">
                <div>
                  <label className="lbl" htmlFor="gprice">Price (USD)</label>
                  <div className="money"><span>$</span><input id="gprice" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} /></div>
                </div>
                <div>
                  <label className="lbl" htmlFor="gdel">Delivery time</label>
                  <select id="gdel" value={delivery} onChange={(e) => setDelivery(e.target.value)}>
                    {['1 day', '2 days', '3 days', '5 days', '7 days', '14 days'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="grev">Revisions</label>
                  <select id="grev" value={revisions} onChange={(e) => setRevisions(e.target.value)}>
                    {['1 revision', '2 revisions', '3 revisions', 'Unlimited'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="lbl">What&rsquo;s included</div>
              <ul className="included">
                {included.map((x) => (
                  <li key={x}><i>✓</i>{x}<button type="button" aria-label={`Remove ${x}`} onClick={() => setIncluded(included.filter((i) => i !== x))}>×</button></li>
                ))}
              </ul>
              <div className="hint-row"><span>Buyers see ${Number(price) || 0} as your starting price. All prices are in USD.</span></div>
            </Section>

            <Section n="04" title="Showcase your work" sub="Make your gig stand out with examples buyers can trust.">
              <div className="showcase">
                <div className="cover-box">
                  <img src={cover} alt="Gig cover" />
                  <span className="cover-tag">COVER IMAGE</span>
                  <div className="cover-name">{coverName}</div>
                  <div className="cover-actions">
                    <label>Replace<input type="file" accept="image/png,image/jpeg" hidden onChange={onCover} /></label>
                    <button type="button" onClick={() => { setCover(''); setCoverName('') }}>Remove</button>
                  </div>
                </div>
                <div className="upload-box">
                  <h3>Add more examples</h3>
                  <p>Drag images here, or browse your device.</p>
                  <label className="upload-btn">Upload images<input type="file" accept="image/png,image/jpeg" multiple hidden onChange={(e) => notify(`${e.target.files.length} image(s) added`)} /></label>
                  <small>JPG or PNG · Up to 10 MB each<br />1 of 3 images added</small>
                </div>
              </div>
              <div className="hint-row"><span>Use only work you own or have permission to share. Recommended size: 1280 × 769 px.</span></div>
            </Section>

            <Section n="05" title="Buyer requirements" sub="Collect everything you need before the project begins.">
              <label className="lbl" htmlFor="gq">Question for your buyer</label>
              <textarea id="gq" className="q" value={question} onChange={(e) => setQuestion(e.target.value)} />
              <label className="check"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> Response required before work starts</label>
              {extraQs.map((q, i) => (
                <input key={i} className="extra-q" placeholder="Another question for your buyer" value={q} onChange={(e) => setExtraQs(extraQs.map((v, j) => (j === i ? e.target.value : v)))} />
              ))}
              <button type="button" className="ghost-btn add-q" onClick={() => setExtraQs([...extraQs, ''])}>+ Add another question</button>
            </Section>

            <section className="gig-card ready">
              <h2>Ready for your next client?</h2>
              <p className="gig-sub">Preview your gig, then publish it for buyers to discover. You can edit or pause it at any time.</p>
              <label className="check"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> I confirm this gig follows Skillrora Community Standards and that I have the right to share this work.</label>
              <div className="ready-actions">
                <button type="button" className="ghost-btn" onClick={() => notify('Preview opened')}>Preview gig</button>
                <button type="button" className="primary-btn" onClick={publish}>Publish gig</button>
              </div>
            </section>
          </div>

          <aside className="gig-side">
            <div className="gig-card side-card">
              <h3>Your gig checklist</h3>
              <p className="gig-sub">A little detail goes a long way.</p>
              <ul className="checklist">
                {checklist.map(([label, ok]) => <li key={label} className={ok ? 'ok' : ''}><i>{ok ? '✓' : ''}</i>{label}</li>)}
              </ul>
              <div className="progress"><span style={{ width: `${(done / checklist.length) * 100}%` }} /></div>
              <small>{done} of {checklist.length} sections complete</small>
            </div>
            <div className="gig-card side-card tips">
              <h3>A great gig starts with clarity.</h3>
              <p>Be specific about your outcome, not just your skills. Clear expectations help the right buyers find you.</p>
              <p>Keep your cover image simple.<br />Set a realistic delivery time.<br />Make your first question count.</p>
              <a href="#guide">Read the seller guide</a>
            </div>
          </aside>
        </div>
      </main>

      <footer className="gig-footer">
        <span>© 2025 Skillrora. All rights reserved.</span>
        <span>Privacy Policy&nbsp;&nbsp;&nbsp;Terms of Service</span>
      </footer>
      {toast}
    </div>
  )
}
