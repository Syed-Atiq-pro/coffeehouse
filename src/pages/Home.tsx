import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import hero from '@/assets/hero.png'

const quotes = [
  'Coffee is a language in itself.',
  'A little warmth can change the whole morning.',
  'Good coffee. Slow moments. Better days.',
  'Every cup carries a journey.',
]

const origins = [
  { name: 'Ethiopia', note: 'Birthplace of coffee culture', x: 57, y: 48 },
  { name: 'Brazil', note: 'The world’s largest coffee origin', x: 35, y: 67 },
  { name: 'Colombia', note: 'High-altitude Arabica country', x: 27, y: 55 },
  { name: 'India', note: 'Monsoon-grown specialty coffee', x: 69, y: 53 },
]

const products = [
  ['classic-espresso.jpg', 'Espresso', 'Intense · Short · Silky'],
  ['caffe-latte.jpg', 'Caffè Latte', 'Velvety · Balanced · Warm'],
  ['cappuccino.jpg', 'Cappuccino', 'Bold · Foamy · Classic'],
  ['iced-cold-coffee.jpg', 'Cold Coffee', 'Chilled · Creamy · Bright'],
]

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.14 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`coffee-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

function CoffeeCupArt() {
  return (
    <div className="cup-stage" aria-hidden="true">
      <div className="steam steam-one" />
      <div className="steam steam-two" />
      <div className="steam steam-three" />
      <div className="cup-shadow" />
      <div className="cup">
        <div className="coffee-surface">
          <span className="crema-ring" />
          <span className="crema-dot dot-a" />
          <span className="crema-dot dot-b" />
        </div>
        <div className="cup-body" />
        <div className="cup-handle" />
      </div>
      <div className="bean bean-a" />
      <div className="bean bean-b" />
      <div className="bean bean-c" />
    </div>
  )
}

export default function Home() {
  const [intro, setIntro] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem('coffee-house-intro-seen') !== '1'
  })
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [typedQuote, setTypedQuote] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    if (!intro) return
    const timer = window.setTimeout(() => {
      window.localStorage.setItem('coffee-house-intro-seen', '1')
      setIntro(false)
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [intro])

  useEffect(() => {
    const text = quotes[quoteIndex]
    let position = 0
    setTypedQuote('')
    const timer = window.setInterval(() => {
      position += 1
      setTypedQuote(text.slice(0, position))
      if (position >= text.length) window.clearInterval(timer)
    }, 38)
    return () => window.clearInterval(timer)
  }, [quoteIndex])

  useEffect(() => {
    const timer = window.setInterval(() => setQuoteIndex((index) => (index + 1) % quotes.length), 5200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <main className="coffee-home">
      {intro && (
        <div className="coffee-intro" role="status" aria-label="Coffee House introduction">
          <div className="intro-grain" />
          <div className="intro-mark">
            <span className="intro-bean" />
            <span className="intro-word">COFFEE HOUSE</span>
          </div>
          <div className="intro-line" />
          <p>FROM BEAN · TO MOMENT · TO MEMORY</p>
          <button
            className="intro-skip"
            onClick={() => {
              window.localStorage.setItem('coffee-house-intro-seen', '1')
              setIntro(false)
            }}
          >
            Skip intro <span>→</span>
          </button>
        </div>
      )}

      <nav className="coffee-nav">
        <Link to="/" className="coffee-brand" aria-label="Coffee House home">
          <span className="brand-bean" />
          <span>COFFEE<br /><em>HOUSE</em></span>
        </Link>

        <div className={`coffee-nav-links ${mobileNav ? 'open' : ''}`}>
          <a href="#story" onClick={() => setMobileNav(false)}>Story</a>
          <a href="#origins" onClick={() => setMobileNav(false)}>Origins</a>
          <a href="#craft" onClick={() => setMobileNav(false)}>Craft</a>
          <Link to="/menu">Menu</Link>
          <a href="#contact" onClick={() => setMobileNav(false)}>Contact</a>
        </div>

        <div className="coffee-auth">
          <Link to="/login" className="coffee-signin">Sign in</Link>
          <Link to="/signup" className="coffee-signup">Sign up <span>↗</span></Link>
        </div>
        <button className="coffee-menu-toggle" onClick={() => setMobileNav((open) => !open)} aria-label="Toggle navigation">
          <span /><span />
        </button>
      </nav>

      <section className="coffee-hero" id="top">
        <div className="hero-noise" />
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />
        <div className="hero-copy">
          <p className="eyebrow">SPECIALTY COFFEE · EST. 2026</p>
          <h1>Every cup<br /><i>has a story.</i></h1>
          <p className="hero-lede">Follow coffee from misty mountains and hand-picked cherries to the final pour. A digital coffee house built around the ritual, not just the drink.</p>
          <div className="hero-actions">
            <Link to="/barista" className="coffee-primary">Ask the AI Barista <span>☕</span></Link>
            <Link to="/menu" className="coffee-secondary">Explore the menu <span>↗</span></Link>
            <a href="#story" className="coffee-secondary">Enter the story <span>↓</span></a>
          </div>
        </div>

        <div className="hero-quote">
          <span className="quote-label">A THOUGHT FOR YOUR CUP</span>
          <p>{typedQuote}<span className="type-cursor">|</span></p>
        </div>

        <div className="hero-cup-wrap">
          <CoffeeCupArt />
          <div className="hero-stamp">SLOW<br />ROASTED<br /><small>WITH INTENT</small></div>
        </div>

        <div className="hero-bottom-note">
          <span>SCROLL TO DISCOVER</span>
          <span className="scroll-line" />
          <span>01 / 06</span>
        </div>
      </section>

      <section className="statement-section" id="story">
        <Reveal className="statement-inner">
          <div className="section-kicker">01 — THE RITUAL</div>
          <h2>We believe coffee<br /><em>deserves a moment.</em></h2>
          <p>Before it becomes your morning latte, coffee is a fruit, a harvest, a landscape and thousands of careful decisions. We bring that journey closer to the cup.</p>
          <div className="statement-rule"><span /> <b>BEAN → CUP</b> <span /></div>
        </Reveal>
      </section>

      <section className="origins-section" id="origins">
        <Reveal className="origin-heading">
          <div className="section-kicker">02 — ORIGINS</div>
          <h2>It starts<br /><em>somewhere real.</em></h2>
          <p>Great coffee has a sense of place. Explore the regions that shape the character in your cup.</p>
        </Reveal>
        <Reveal className="origin-map-wrap" delay={120}>
          <div className="origin-map">
            <div className="map-glow" />
            <svg viewBox="0 0 900 480" className="map-lines" aria-hidden="true">
              <path d="M160 305 C280 220 390 275 510 215 S710 190 780 260" />
              <path d="M290 365 C410 315 500 340 610 290 S710 250 790 305" />
              <path d="M460 130 C500 190 540 240 575 330" />
            </svg>
            {origins.map((origin) => (
              <div key={origin.name} className="origin-point" style={{ left: `${origin.x}%`, top: `${origin.y}%` }}>
                <span className="origin-pulse" />
                <div><b>{origin.name}</b><small>{origin.note}</small></div>
              </div>
            ))}
            <span className="map-label label-north">COFFEE BELT</span>
            <span className="map-label label-east">+ MORE ORIGINS</span>
          </div>
        </Reveal>
      </section>

      <section className="craft-section" id="craft">
        <div className="craft-sticky">
          <Reveal>
            <div className="section-kicker">03 — THE CRAFT</div>
            <h2>From bean<br /><em>to ritual.</em></h2>
            <p>Harvested. Roasted. Ground. Brewed. Four stages, one obsession: making the next cup worth remembering.</p>
          </Reveal>
        </div>
        <div className="craft-steps">
          {[
            ['01', 'HARVEST', 'Coffee begins as a cherry, picked at exactly the right moment.', 'americano.jpg'],
            ['02', 'ROAST', 'Heat transforms green beans into aroma, sweetness and character.', 'classic-espresso.jpg'],
            ['03', 'GRIND', 'The right grind creates the balance between body and brightness.', 'mocha.jpg'],
            ['04', 'BREW', 'Water meets coffee. Time slows down. The ritual becomes yours.', 'caffe-latte.jpg'],
          ].map(([number, title, text, image], index) => (
            <Reveal key={number} className="craft-card" delay={index * 70}>
              <div className="craft-image-wrap">
                <img src={`/images/products/${image}`} alt="" loading="lazy" />
                <span>{number}</span>
              </div>
              <div className="craft-card-copy">
                <p>{number}</p>
                <h3>{title}</h3>
                <span>{text}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="cinema-section">
        <Reveal className="cinema-intro">
          <div className="section-kicker">04 — COFFEE IN MOTION</div>
          <h2>Watch the ritual<br /><em>come alive.</em></h2>
        </Reveal>
        <div className="cinema-grid">
          <Reveal className="cinema-frame frame-tall">
            <img src="/images/products/cappuccino.jpg" alt="Cappuccino" loading="lazy" />
            <div className="frame-overlay"><span>THE POUR</span><b>Crema settling into silence.</b></div>
          </Reveal>
          <Reveal className="cinema-frame frame-wide" delay={100}>
            <div className="animated-coffee-loop" aria-hidden="true">
              <div className="loop-beans" />
              <div className="loop-stream" />
              <div className="loop-cup" />
              <div className="loop-steam" />
            </div>
            <div className="frame-overlay"><span>THE MOMENT</span><b>Heat. Aroma. Anticipation.</b></div>
          </Reveal>
          <Reveal className="cinema-frame frame-small" delay={160}>
            <img src="/images/products/butter-croissant.jpg" alt="Fresh croissant" loading="lazy" />
            <div className="frame-overlay"><span>THE PAIRING</span><b>Something warm on the side.</b></div>
          </Reveal>
        </div>
      </section>

      <section className="collection-section" id="menu-preview">
        <Reveal className="collection-heading">
          <div>
            <div className="section-kicker">05 — YOUR CUP</div>
            <h2>Find your<br /><em>favourite.</em></h2>
          </div>
          <Link to="/menu" className="text-link">View full menu <span>↗</span></Link>
        </Reveal>
        <div className="coffee-product-rail">
          {products.map(([image, name, note], index) => (
            <Reveal key={name} className="coffee-product" delay={index * 60}>
              <Link to="/menu">
                <div className="product-image"><img src={`/images/products/${image}`} alt={name} loading="lazy" /><span>0{index + 1}</span></div>
                <div className="product-meta"><h3>{name}</h3><p>{note}</p><span className="product-arrow">↗</span></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="experience-section">
        <div className="section-kicker">06 — THE HOUSE, REIMAGINED</div>
        <h2>More than a menu.<br /><em>Make coffee yours.</em></h2>
        <div className="experience-grid">
          <Link to="/barista"><span>01</span><b>AI BARISTA</b><small>Tell us the craving. We find the cup.</small><i>↗</i></Link>
          <Link to="/lab"><span>02</span><b>COFFEE LAB</b><small>Build a drink and experiment with the recipe.</small><i>↗</i></Link>
          <Link to="/dna"><span>03</span><b>COFFEE DNA</b><small>Discover what your order history says about your taste.</small><i>↗</i></Link>
          <Link to="/community"><span>04</span><b>COFFEE MOMENTS</b><small>Share the rituals happening around the House.</small><i>↗</i></Link>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-mark">“</div>
        <Reveal>
          <p className="giant-quote">The best part of coffee<br />is <em>the pause it creates.</em></p>
          <div className="quote-author">— COFFEE HOUSE JOURNAL / 01</div>
        </Reveal>
      </section>

      <section className="visit-section" id="contact">
        <Reveal className="visit-card">
          <div>
            <div className="section-kicker">06 — COME BY</div>
            <h2>Stay for<br /><em>another cup.</em></h2>
            <p>Whether you are here for five minutes or the whole afternoon, there is always room at the table.</p>
          </div>
          <div className="visit-details">
            <div><span>VISIT</span><b>15 Coffee Lane<br />Vijayawada, India</b></div>
            <div><span>HOURS</span><b>Mon–Sun<br />07:00 — 22:00</b></div>
            <div><span>CONTACT</span><b>hello@coffeehouse.local<br />+91 00000 00000</b></div>
            <Link to="/signup" className="coffee-primary">Become a regular <span>↗</span></Link>
          </div>
        </Reveal>
      </section>

      <footer className="coffee-footer">
        <div className="creator-block">
          <div className="section-kicker">CREATED WITH INTENT</div>
          <h2>COFFEE<br /><em>HOUSE.</em></h2>
          <p>A digital coffee experience designed & developed by <strong>Syed Atiq</strong>.</p>
          <div className="creator-links">
            <a href="https://github.com/Syed-Atiq-pro" target="_blank" rel="noreferrer">GitHub ↗</a>
            <a href="mailto:hello@coffeehouse.local">Email ↗</a>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 COFFEE HOUSE</span>
          <span>GOOD COFFEE. GOOD MOMENTS.</span>
          <span>MADE FOR REGULARS.</span>
        </div>
      </footer>
    </main>
  )
}
