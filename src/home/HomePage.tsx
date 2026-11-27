/**
 * Public website home page for Devlin Carpets & Flooring, with the chat widget.
 * Copy lives in ./content.ts; styles in ./home.css (all classes start with hp-).
 */
import { useEffect, useState } from 'react';
import { ChatWidget, openChat } from '../chatbot';
import { AGENT_URL } from '../api';
import SideMenu from '../components/SideMenu';
import RoomPlan from './RoomPlan';
import { ABOUT, BRAND, BRANDS, FAQS, NAV, PRODUCTS, PROJECTS, SERVICES, STATS, STORES, TESTIMONIALS, type Service, type Store } from './content';
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

function Wordmark({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`hp-wordmark${footer ? ' hp-wordmark-footer' : ''}`}>
      <strong>{BRAND.name}</strong>
      <small>{BRAND.tagline}</small>
    </span>
  );
}

/** "Open today until 6pm", "Closed today", based on the visitor's clock. */
function todayHours(store: Store): { open: boolean; text: string } {
  const day = new Date().getDay(); // 0 = Sunday
  const key = day === 0 ? 'Sunday' : day === 6 ? 'Saturday' : 'Mon to Fri';
  const hours = store.hours.find(([d]) => d === key)?.[1] ?? 'Closed';
  if (/closed/i.test(hours)) return { open: false, text: 'Closed today' };
  const until = hours.split(' to ')[1];
  return { open: true, text: until ? `Open today until ${until}` : `Open today ${hours}` };
}

function Hero() {
  return (
    <section className="hp-hero" aria-labelledby="hp-hero-title">
      <div className="hp-wrap hp-hero-inner">
        <div className="hp-hero-copy">
          <h1 id="hp-hero-title">Wholesale floors, measured for your room</h1>
          <p className="hp-hero-text">
            Carpet, LVT, wood and laminate from leading brands, sold direct to the public from four Midlands showrooms. Book a free measuring visit and we&apos;ll tell you exactly
            what to order.
          </p>
          <div className="hp-hero-actions">
            <button type="button" className="hp-btn hp-btn-tape" onClick={() => openChat('measure')}>
              Book a free measure
            </button>
            <a className="hp-btn hp-btn-outline" href="#stores">
              Find a showroom
            </a>
          </div>
          <p className="hp-hero-note">
            Or call <a href={tel(BRAND.mainPhone)}>{BRAND.mainPhone}</a>, open 7 days.
          </p>
        </div>
        <RoomPlan />
      </div>
    </section>
  );
}

function About() {
  const [tab, setTab] = useState(ABOUT.tabs[0].id);
  const current = ABOUT.tabs.find((t) => t.id === tab)!;
  return (
    <section className="hp-section hp-about-section" id="about" aria-labelledby="hp-about-title">
      <div className="hp-wrap hp-about">
        <div className="hp-years" aria-hidden="true">
          <span className="hp-years-num">{ABOUT.years}</span>
          <span className="hp-years-label">years selling floors</span>
        </div>
        <div className="hp-about-copy">
          <h2 id="hp-about-title">A family business that buys in bulk, so you don&apos;t pay retail</h2>
          <p className="hp-lead">{ABOUT.text}</p>
          <div className="hp-tabs" role="tablist" aria-label="About Devlin">
            {ABOUT.tabs.map((t) => (
              <button
                key={t.id}
                id={`hp-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls="hp-tab-panel"
                className={tab === t.id ? 'on' : ''}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="hp-tab-panel" id="hp-tab-panel" role="tabpanel" aria-labelledby={`hp-tab-${tab}`}>
            <h3>{current.title}</h3>
            <p>{current.text}</p>
          </div>
          <dl className="hp-stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Step({ s, n }: { s: Service; n: number }) {
  return (
    <li className="hp-step">
      <span className="hp-step-num" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3>
          <Icon name={s.key} />
          {s.title}
        </h3>
        <p>{s.text}</p>
        {s.action && (
          <button type="button" className="hp-link" onClick={() => openChat(s.action === 'measure' ? 'measure' : undefined)}>
            {s.action === 'measure' ? 'Book a free measure' : 'Ask our team'}
          </button>
        )}
      </div>
    </li>
  );
}

function StoreCard({ s }: { s: Store }) {
  const today = todayHours(s);
  return (
    <article className="hp-store">
      <header>
        <h3>{s.name}</h3>
        <span className={`hp-today${today.open ? '' : ' closed'}`}>{today.text}</span>
      </header>
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
        <a className="hp-btn hp-btn-green hp-btn-sm" href={wa(s.whatsapp)} target="_blank" rel="noreferrer">
          WhatsApp this store
        </a>
        <a className="hp-btn hp-btn-outline hp-btn-sm" href={maps(`${s.address}, UK`)} target="_blank" rel="noreferrer">
          Get directions
        </a>
      </div>
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
      <a className="hp-skip" href="#top">
        Skip to content
      </a>
      <div className="hp-topbar">
        <div className="hp-wrap hp-topbar-inner">
          <span>{BRAND.strapline}, from four showrooms across the Midlands</span>
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
              <Wordmark />
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
            <button type="button" className="hp-btn hp-btn-tape hp-btn-sm hp-nav-cta" onClick={() => openChat('measure')}>
              Book a free measure
            </button>
          </nav>
        </div>
      </header>

      <main id="top">
        <Hero />

        <section className="hp-brands" aria-label="Brands we stock">
          <div className="hp-wrap hp-brands-inner">
            <p>Ranges from</p>
            <ul>
              {BRANDS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="hp-section" id="products" aria-labelledby="hp-products-title">
          <div className="hp-wrap">
            <div className="hp-head">
              <h2 id="hp-products-title">Choose your floor</h2>
              <p className="hp-lead">Every range is on display in all four showrooms. Take samples home to see them in your own light.</p>
            </div>
            <ul className="hp-samples">
              {PRODUCTS.map((p) => (
                <li key={p.key} className="hp-sample">
                  <div className={`hp-swatch hp-sw-${p.key}`} style={p.image ? { backgroundImage: `url(${p.image})` } : undefined} aria-hidden="true" />
                  <div className="hp-sample-ticket">
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </li>
              ))}
              <li className="hp-sample hp-sample-help">
                <h3>Not sure what suits your room?</h3>
                <p>Tell us about the room and how it&apos;s used, and we&apos;ll suggest floors to look at.</p>
                <button type="button" className="hp-btn hp-btn-tape hp-btn-sm" onClick={() => openChat()}>
                  Chat with our team
                </button>
              </li>
            </ul>
          </div>
        </section>

        <section className="hp-section hp-services-section" id="services" aria-labelledby="hp-services-title">
          <div className="hp-wrap hp-services">
            <div className="hp-services-head">
              <h2 id="hp-services-title">From first question to finished floor</h2>
              <p className="hp-lead">Measuring, planning and quotes are free. Fitting is done by independent fitters we can put you in touch with.</p>
              <button type="button" className="hp-btn hp-btn-tape" onClick={() => openChat('measure')}>
                Book a free measure
              </button>
            </div>
            <ol className="hp-steps">
              {SERVICES.map((s, i) => (
                <Step key={s.key} s={s} n={i + 1} />
              ))}
            </ol>
          </div>
        </section>

        <section className="hp-section" id="projects" aria-labelledby="hp-projects-title">
          <div className="hp-wrap">
            <div className="hp-head">
              <h2 id="hp-projects-title">Recent floors</h2>
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

        <About />

        <section className="hp-section" aria-labelledby="hp-reviews-title">
          <div className="hp-wrap">
            <div className="hp-head">
              <h2 id="hp-reviews-title">What customers say</h2>
            </div>
            <div className="hp-quotes">
              {TESTIMONIALS.map((t) => (
                <blockquote key={t.role} className="hp-quote">
                  <p>{t.quote}</p>
                  <footer>
                    <strong>{t.name}</strong>, {t.role}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section hp-stores-section" id="stores" aria-labelledby="hp-stores-title">
          <div className="hp-wrap">
            <div className="hp-head">
              <h2 id="hp-stores-title">Visit a showroom</h2>
              <p className="hp-lead">Full ranges on display and a team who can answer anything about flooring. No appointment needed.</p>
            </div>
            <div className="hp-stores">
              {STORES.map((s) => (
                <StoreCard key={s.name} s={s} />
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section" id="faq" aria-labelledby="hp-faq-title">
          <div className="hp-wrap hp-faq-wrap">
            <div className="hp-faq-head">
              <h2 id="hp-faq-title">Questions we&apos;re often asked</h2>
              <p className="hp-lead">Can&apos;t find yours? Ask in the chat or call any store.</p>
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
            <Wordmark footer />
            <p>{BRAND.strapline}.</p>
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
            <h4>Call a store</h4>
            {STORES.map((s) => (
              <p key={s.name}>
                {s.name} <a href={tel(s.phone)}>{s.phone}</a>
              </p>
            ))}
          </div>
        </div>
        <div className="hp-wrap hp-legal">
          <span>© {new Date().getFullYear()} Devlin Wholesale</span>
          <span>
            <a href="#top">Privacy policy</a>
            <a href="#top">Cookie policy</a>
          </span>
        </div>
      </footer>

      {/* The chat widget: one self-contained component from src/chatbot */}
      <ChatWidget apiBase={AGENT_URL} businessName={BRAND.fullName} accentColor={BRAND_COLOR} storageKey="devlin_chat" theme="light" />
    </div>
  );
}
