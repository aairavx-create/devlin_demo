/**
 * Public website home page, laid out like devlinwholesale.co.uk, with the chat widget.
 * Copy lives in ./content.ts; styles in ./home.css (all classes start with hp-).
 */
import { useEffect, useState } from 'react';
import { ChatWidget, openChat } from '../chatbot';
import { AGENT_URL } from '../api';
import SideMenu from '../components/SideMenu';
import { ABOUT, BRAND, BRANDS, FAQS, NAV, PRODUCTS, PROJECTS, SERVICES, SLIDES, STATS, STORES, TESTIMONIALS, type Service } from './content';
import './home.css';

const BRAND_COLOR = '#2f5d50';
const tel = (n: string) => `tel:${n.replace(/\s/g, '')}`;
const wa = (n: string) => `https://wa.me/44${n.replace(/\D/g, '').replace(/^0/, '')}`;
const maps = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    advice: 'M12 3a7 7 0 0 0-4 12.7V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 3zm-2 18h4',
    measure: 'M3 17 17 3l4 4L7 21H3v-4zm4-4 2 2m1-5 2 2m1-5 2 2',
    prep: 'M4 20h16M6 16l6-12 6 12M9 10h6',
    plan: 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h3',
    fitters: 'M14 7l3-3 3 3-3 3M4 20l9-9m-5-6 3 3-5 5-3-3z',
    care: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
    pin: 'M12 22s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2',
  };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.advice} />
    </svg>
  );
}

function Social() {
  return (
    <div className="hp-social">
      <a href={BRAND.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
        f
      </a>
      <a href={BRAND.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
        ◎
      </a>
      <a href={BRAND.social.x} target="_blank" rel="noreferrer" aria-label="X">
        𝕏
      </a>
    </div>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  const s = SLIDES[i];
  return (
    <section className="hp-hero" aria-roledescription="carousel" aria-label="Highlights" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={`hp-hero-bg hp-hero-bg-${i}`} aria-hidden="true" />
      <div className="hp-wrap hp-hero-inner">
        <div key={i} className="hp-hero-copy" aria-live="polite">
          <p className="hp-kicker">{s.kicker}</p>
          <h1>{s.title}</h1>
          <p className="hp-hero-text">{s.text}</p>
          <div className="hp-hero-actions">
            <button type="button" className="hp-btn hp-btn-gold" onClick={() => openChat('measure')}>
              Request to Measure
            </button>
            <a className="hp-btn hp-btn-light" href="#stores">
              Contact us
            </a>
          </div>
        </div>
        <div className="hp-dots" role="tablist" aria-label="Choose slide">
          {SLIDES.map((sl, n) => (
            <button key={sl.title} type="button" role="tab" aria-selected={n === i} aria-label={`Slide ${n + 1}`} className={n === i ? 'on' : ''} onClick={() => setI(n)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const [tab, setTab] = useState(ABOUT.tabs[0].id);
  const current = ABOUT.tabs.find((t) => t.id === tab)!;
  return (
    <section className="hp-section" id="about">
      <div className="hp-wrap hp-about">
        <div className="hp-years">
          <span className="hp-years-num">{ABOUT.years}</span>
          <span className="hp-years-label">{ABOUT.heading}</span>
        </div>
        <div>
          <p className="hp-eyebrow">About Devlin</p>
          <h2>Premium flooring at wholesale prices</h2>
          <p className="hp-lead">{ABOUT.text}</p>
          <div className="hp-tabs" role="tablist" aria-label="About us">
            {ABOUT.tabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="hp-tab-panel" role="tabpanel">
            <h3>{current.title}</h3>
            <p>{current.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ s }: { s: Service }) {
  return (
    <article className="hp-service">
      <span className="hp-service-icon">
        <Icon name={s.key} />
      </span>
      <h3>{s.title}</h3>
      <p>{s.text}</p>
      {s.action && (
        <button type="button" className="hp-link" onClick={() => openChat(s.action === 'measure' ? 'measure' : undefined)}>
          {s.action === 'measure' ? 'Book a free measure →' : 'Ask our team →'}
        </button>
      )}
    </article>
  );
}

export default function HomePage() {
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    document.title = `${BRAND.fullName} | Carpets, Vinyl & Flooring`;
  }, []);

  return (
    <div className="hp">
      <div className="hp-topbar">
        <div className="hp-wrap hp-topbar-inner">
          <span>{BRAND.strapline} · 4 stores across the Midlands</span>
          <span className="hp-topbar-right">
            <a href={tel(BRAND.mainPhone)}>
              <Icon name="phone" /> {BRAND.mainPhone}
            </a>
            <Social />
          </span>
        </div>
      </div>

      <header className="hp-header">
        <div className="hp-wrap hp-header-inner">
          <div className="hp-header-left">
            <SideMenu />
            <a href="#top" className="hp-logo" aria-label={`${BRAND.fullName} home`}>
              <span className="hp-logo-mark">D</span>
              <span>
                <strong>{BRAND.name.toUpperCase()}</strong>
                <small>{BRAND.tagline}</small>
              </span>
            </a>
          </div>
          <button type="button" className="hp-menu-btn" aria-expanded={menu} aria-controls="hp-nav" onClick={() => setMenu((m) => !m)}>
            Menu
          </button>
          <nav id="hp-nav" className={`hp-nav${menu ? ' open' : ''}`} aria-label="Main">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenu(false)}>
                {n.label}
              </a>
            ))}
            <button type="button" className="hp-btn hp-btn-primary hp-nav-cta" onClick={() => openChat('measure')}>
              Request to Measure
            </button>
          </nav>
        </div>
      </header>

      <main id="top">
        <Hero />

        <section className="hp-measure" aria-label="Measurement service">
          <div className="hp-wrap hp-measure-inner">
            <div>
              <strong>Planning new flooring?</strong> <span>Book a free measurement visit online, or ask us a question first.</span>
            </div>
            <button type="button" className="hp-btn hp-btn-light" onClick={() => openChat('measure')}>
              Request to Measure
            </button>
          </div>
        </section>

        <section className="hp-section" id="products">
          <div className="hp-wrap">
            <div className="hp-head">
              <p className="hp-eyebrow">Our ranges</p>
              <h2>Products we offer</h2>
            </div>
            <div className="hp-products">
              {PRODUCTS.map((p, n) => (
                <article key={p.key} className="hp-product">
                  <div className={`hp-swatch hp-sw-${p.key}`} style={p.image ? { backgroundImage: `url(${p.image})` } : undefined} aria-hidden="true" />
                  <div className="hp-product-body">
                    <span className="hp-num">{String(n + 1).padStart(2, '0')}</span>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </article>
              ))}
              <article className="hp-product hp-product-cta">
                <h3>Not sure what suits your room?</h3>
                <p>Chat with our team or book a free measure, and we will help you choose.</p>
                <button type="button" className="hp-btn hp-btn-light" onClick={() => openChat()}>
                  Chat with us
                </button>
              </article>
            </div>
          </div>
        </section>

        <About />

        <section className="hp-brands" aria-label="Trusted brands we carry">
          <div className="hp-wrap">
            <p className="hp-eyebrow">Trusted brands we carry</p>
            <ul>
              {BRANDS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="hp-section hp-alt" id="services">
          <div className="hp-wrap">
            <div className="hp-head">
              <p className="hp-eyebrow">How we help</p>
              <h2>Services</h2>
            </div>
            <div className="hp-services">
              {SERVICES.map((s) => (
                <ServiceCard key={s.key} s={s} />
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section" id="projects">
          <div className="hp-wrap">
            <div className="hp-head">
              <p className="hp-eyebrow">Recent work</p>
              <h2>Latest projects</h2>
            </div>
            <div className="hp-projects">
              {PROJECTS.map((p) => (
                <figure key={p.key} className="hp-project">
                  <div className={`hp-swatch hp-sw-${p.key.replace(/\d$/, '')}`} aria-hidden="true" />
                  <figcaption>
                    <strong>{p.title}</strong>
                    <span>{p.place}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-stats" aria-label="Our facts">
          <div className="hp-wrap">
            <p className="hp-eyebrow">We are focused on results</p>
            <div className="hp-stats-grid">
              {STATS.map((s) => (
                <div key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section" aria-label="What our clients say">
          <div className="hp-wrap">
            <div className="hp-head">
              <p className="hp-eyebrow">Reviews</p>
              <h2>What our clients say</h2>
            </div>
            <div className="hp-quotes">
              {TESTIMONIALS.map((t) => (
                <blockquote key={t.role} className="hp-quote">
                  <p>“{t.quote}”</p>
                  <footer>
                    <strong>{t.name}</strong> · {t.role}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section hp-alt" id="stores">
          <div className="hp-wrap">
            <div className="hp-head">
              <p className="hp-eyebrow">Visit a showroom</p>
              <h2>Find our stores</h2>
              <p className="hp-lead">Four locations across the Midlands, each with full ranges on display and a team ready to help.</p>
            </div>
            <div className="hp-stores">
              {STORES.map((s) => (
                <article key={s.name} className="hp-store">
                  <h3>{s.name}</h3>
                  <p className="hp-store-line">
                    <Icon name="pin" /> {s.address}
                  </p>
                  <p className="hp-store-line">
                    <Icon name="phone" /> <a href={tel(s.phone)}>{s.phone}</a>
                  </p>
                  <dl className="hp-hours">
                    {s.hours.map(([d, h]) => (
                      <div key={d}>
                        <dt>{d}</dt>
                        <dd>{h}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="hp-store-actions">
                    <a className="hp-btn hp-btn-primary hp-btn-sm" href={wa(s.whatsapp)} target="_blank" rel="noreferrer">
                      Free measure: WhatsApp us
                    </a>
                    <a className="hp-btn hp-btn-outline hp-btn-sm" href={maps(`${s.address}, UK`)} target="_blank" rel="noreferrer">
                      Get directions
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section" id="faq">
          <div className="hp-wrap">
            <div className="hp-head">
              <p className="hp-eyebrow">Good to know</p>
              <h2>FAQs</h2>
            </div>
            <div className="hp-faq">
              {FAQS.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="hp-footer">
        <div className="hp-wrap hp-footer-grid">
          <div>
            <div className="hp-logo hp-logo-footer">
              <span className="hp-logo-mark">D</span>
              <span>
                <strong>{BRAND.name.toUpperCase()}</strong>
                <small>{BRAND.tagline}</small>
              </span>
            </div>
            <p>Providing trustworthy flooring products and solutions.</p>
            <Social />
          </div>
          <nav aria-label="Footer">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <div>
            <h4>Our stores</h4>
            {STORES.map((s) => (
              <p key={s.name}>
                {s.name}: <a href={tel(s.phone)}>{s.phone}</a>
              </p>
            ))}
          </div>
        </div>
        <div className="hp-wrap hp-legal">
          <span>© {new Date().getFullYear()} Devlin Wholesale</span>
          <span>Privacy policy · Cookie policy</span>
        </div>
      </footer>

      {/* The chat widget: one self-contained component from src/chatbot */}
      <ChatWidget apiBase={AGENT_URL} businessName={BRAND.fullName} accentColor={BRAND_COLOR} storageKey="devlin_chat" />
    </div>
  );
}
