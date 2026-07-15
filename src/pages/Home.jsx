import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout.jsx';

const HERO_BG = `${import.meta.env.BASE_URL}img/login/hero.jpg`;

function Icon({ name, size = 20 }) {
    const s = { width: size, height: size };
    const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (name) {
        case 'bolt':
            return <svg viewBox="0 0 24 24" {...s} {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>;
        case 'route':
            return <svg viewBox="0 0 24 24" {...s} {...common}><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/></svg>;
        case 'shield':
            return <svg viewBox="0 0 24 24" {...s} {...common}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
        case 'chip':
            return <svg viewBox="0 0 24 24" {...s} {...common}><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/></svg>;
        case 'chat':
            return <svg viewBox="0 0 24 24" {...s} {...common}><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 10h8M8 13h5"/></svg>;
        case 'signal':
            return <svg viewBox="0 0 24 24" {...s} {...common}><path d="M4 20V10M9 20V6M14 20v-9M19 20V4"/></svg>;
        case 'check':
            return <svg viewBox="0 0 24 24" {...s} {...common}><path d="m4 12 5 5 11-11"/></svg>;
        case 'arrow':
            return <svg viewBox="0 0 24 24" {...s} {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
        default:
            return null;
    }
}

const FEATURES = [
    {
        icon: 'chip',
        title: 'AI dispatch copilot',
        blurb: 'Every load is scored on rate, deadhead, HOS fit and equipment match. Dispatchers get a ranked shortlist in seconds, not spreadsheets.',
        stat: '4.2×',
        statLabel: 'faster load-to-driver assignment',
    },
    {
        icon: 'route',
        title: 'Live yard-to-delivery visibility',
        blurb: 'Trailer telemetry, driver HOS clock, and load ETAs on one map. When something slips, we tell you before the shipper does.',
        stat: '38%',
        statLabel: 'reduction in on-time-delivery misses',
    },
    {
        icon: 'chat',
        title: 'One-thread comms with drivers',
        blurb: 'Text, WhatsApp, email and voice — the AI keeps the thread clean, logs the POD, and escalates only what needs a human.',
        stat: '92%',
        statLabel: 'of check-in calls handled without dispatcher',
    },
    {
        icon: 'shield',
        title: 'Compliance that files itself',
        blurb: 'FMCSA-grade audit trail, IFTA-ready mileage, driver qualifications tracked automatically. Auditors get a link, not a shoebox.',
        stat: '0',
        statLabel: 'DOT audit findings across our carriers, 2024',
    },
];

const STEPS = [
    {
        n: '01',
        title: 'Connect your fleet in an afternoon',
        body: 'Bring your ELDs, TMS and load boards. We map your existing lanes, drivers and equipment on day one — no rip-and-replace.',
    },
    {
        n: '02',
        title: 'Let the copilot triage load offers',
        body: 'Broker emails, DAT alerts and shipper tenders all land in one queue. The AI drafts the accept/reject with margin math attached.',
    },
    {
        n: '03',
        title: 'Assign, track, deliver — hands off',
        body: 'Drivers get the load in their app. Check-calls, POD upload and detention timers run themselves. You step in only when it matters.',
    },
    {
        n: '04',
        title: 'Close the books before Monday',
        body: 'Invoicing, IFTA, driver settlements and factoring packets export straight from the same source of truth. No re-keying.',
    },
];

const LOGOS = [
    'MERIDIAN LOGISTICS',
    'ROADLINE FREIGHT',
    'BLUE HARBOR CARRIERS',
    'NORTHFORK TRANSPORT',
    'CASCADE HAUL CO.',
    'IRONWAY EXPRESS',
];

const METRICS = [
    { value: '3,412', label: 'active drivers on-platform', sub: 'across 41 US states' },
    { value: '$1.9B', label: 'freight moved in 2025', sub: '+62% YoY' },
    { value: '99.97%', label: 'dispatch uptime, trailing 90d', sub: 'SLA: 99.9%' },
    { value: '2.4 min', label: 'median load-accept time', sub: 'was 11 min pre-platform' },
];

const TESTIMONIALS = [
    {
        quote: 'We ran 48 trucks with three dispatchers on shift. After ninety days on DispatchOS we run 71 trucks with the same three — and they leave on time.',
        name: 'Marcus Odell',
        role: 'VP of Operations, Meridian Logistics',
        photo: 'marcus',
    },
    {
        quote: 'The AI does not replace my dispatchers. It makes them look like they have ten years of experience on their first day.',
        name: 'Priya Raman',
        role: 'CEO, Blue Harbor Carriers',
        photo: 'priya',
    },
];

const FLEET = ['u1', 'u3', 'u5', 'u7', 'u9', 'u11'];
const DRIVER_IMG = (n) => `${import.meta.env.BASE_URL}img/drivers/${n}.jpg`;
const TRAILER_IMG = (n) => `${import.meta.env.BASE_URL}img/trailers/${n}.jpg`;

export default function Home() {
    return (
        <MarketingLayout>
            {/* HERO */}
            <section className="mk-hero">
                <div className="mk-hero-bg" style={{ backgroundImage: `url(${HERO_BG})` }} aria-hidden="true" />
                <div className="mk-hero-scrim" aria-hidden="true" />
                <div className="mk-hero-inner">
                    <div className="mk-hero-eyebrow">
                        <span className="mk-eyebrow-dot" />
                        Now live in 41 states · Series B announced
                    </div>
                    <h1 className="mk-hero-title">
                        The <em>dispatch operating system</em><br/>
                        for modern trucking.
                    </h1>
                    <p className="mk-hero-sub">
                        DispatchOS unifies your load board, driver app, broker portal and compliance stack —
                        with an AI copilot that runs the boring parts of dispatch so your team can run the freight.
                    </p>
                    <div className="mk-hero-ctas">
                        <Link to="/login" className="mk-btn mk-btn--primary">
                            Sign in to dispatch
                            <Icon name="arrow" size={16} />
                        </Link>
                        <a href="#platform" className="mk-btn mk-btn--ghost">
                            See how it works
                        </a>
                    </div>
                    <div className="mk-hero-meta">
                        <span><Icon name="check" size={14} /> No credit card required</span>
                        <span><Icon name="check" size={14} /> Onboard in one afternoon</span>
                        <span><Icon name="check" size={14} /> SOC 2 Type II certified</span>
                    </div>
                </div>
            </section>

            {/* LOGO STRIP */}
            <section className="mk-logostrip" id="customers">
                <div className="mk-container">
                    <div className="mk-logostrip-label">Trusted by carriers and brokerages moving freight in North America</div>
                    <div className="mk-logostrip-row">
                        {LOGOS.map(l => <span key={l} className="mk-logo">{l}</span>)}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="mk-section" id="platform">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">The platform</div>
                        <h2 className="mk-section-title">
                            One screen for the entire load lifecycle.
                        </h2>
                        <p className="mk-section-sub">
                            Every tool your dispatchers, drivers and brokers already juggle — replaced by
                            a single workspace with an AI copilot in every seat.
                        </p>
                    </div>

                    <div className="mk-features">
                        {FEATURES.map(f => (
                            <article className="mk-feature" key={f.title}>
                                <div className="mk-feature-icon"><Icon name={f.icon} size={22} /></div>
                                <h3 className="mk-feature-title">{f.title}</h3>
                                <p className="mk-feature-body">{f.blurb}</p>
                                <div className="mk-feature-stat">
                                    <span className="mk-feature-stat-value">{f.stat}</span>
                                    <span className="mk-feature-stat-label">{f.statLabel}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRODUCT SHOT / SIDE-BY-SIDE */}
            <section className="mk-section mk-section--alt">
                <div className="mk-container mk-splitrow">
                    <div className="mk-split-copy">
                        <div className="mk-kicker">Live dispatch board</div>
                        <h2 className="mk-section-title">
                            Every load, every driver, every yard — in real time.
                        </h2>
                        <p className="mk-section-sub">
                            The board is the source of truth. Drag a load onto a driver and DispatchOS
                            re-checks HOS, deadhead, equipment fit, and lane profitability before you release it.
                            If a check fails, we tell you why — and suggest the next best driver.
                        </p>
                        <ul className="mk-checklist">
                            <li><Icon name="check" size={16} /> HOS-aware assignment (14/11/70)</li>
                            <li><Icon name="check" size={16} /> Deadhead + fuel-adjusted margin per load</li>
                            <li><Icon name="check" size={16} /> One-click POD, detention timer, factoring packet</li>
                            <li><Icon name="check" size={16} /> Broker portal with self-serve tracking links</li>
                        </ul>
                        <div className="mk-inline-ctas">
                            <Link to="/login" className="mk-btn mk-btn--primary">Open the dispatch board</Link>
                            <a href="#customers" className="mk-btn mk-btn--link">Read customer stories →</a>
                        </div>
                    </div>

                    <div className="mk-split-visual" aria-hidden="true">
                        <div className="mk-mock">
                            <div className="mk-mock-top">
                                <span className="mk-mock-dot" />
                                <span className="mk-mock-dot" />
                                <span className="mk-mock-dot" />
                                <span className="mk-mock-url">dispatchos.io / board</span>
                            </div>
                            <div className="mk-mock-body">
                                <div className="mk-mock-side">
                                    <div className="mk-mock-nav-item is-on"><Icon name="signal" size={14}/> Board</div>
                                    <div className="mk-mock-nav-item">Drivers</div>
                                    <div className="mk-mock-nav-item">Loads</div>
                                    <div className="mk-mock-nav-item">Orders</div>
                                    <div className="mk-mock-nav-item">Audit</div>
                                </div>
                                <div className="mk-mock-main">
                                    {[
                                        { id: 'L-2041', route: 'Dallas, TX → Atlanta, GA', rate: '$3,240', margin: '+18%', driver: 'M. Odell', state: 'ok' },
                                        { id: 'L-2039', route: 'Kansas City → Chicago', rate: '$1,180', margin: '+11%', driver: 'A. Nakamura', state: 'ok' },
                                        { id: 'L-2036', route: 'Phoenix → Salt Lake City', rate: '$2,610', margin: '+22%', driver: 'Unassigned', state: 'warn' },
                                        { id: 'L-2033', route: 'Newark → Charlotte', rate: '$2,050', margin: '+9%', driver: 'D. Ferrari', state: 'ok' },
                                        { id: 'L-2031', route: 'Portland → Reno', rate: '$1,940', margin: '+14%', driver: 'S. Ivanov', state: 'live' },
                                    ].map(l => (
                                        <div className={'mk-mock-row mk-mock-row--' + l.state} key={l.id}>
                                            <span className="mk-mock-id">{l.id}</span>
                                            <span className="mk-mock-route">{l.route}</span>
                                            <span className="mk-mock-rate">{l.rate}</span>
                                            <span className="mk-mock-margin">{l.margin}</span>
                                            <span className="mk-mock-driver">{l.driver}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS / STEPS */}
            <section className="mk-section" id="how">
                <div className="mk-container">
                    <div className="mk-section-head mk-section-head--center">
                        <div className="mk-kicker">How it works</div>
                        <h2 className="mk-section-title">From first login to fully-automated dispatch.</h2>
                        <p className="mk-section-sub">
                            Most fleets go live in under two weeks. The AI learns your lanes, drivers, and shipper
                            preferences from day one — so you get better answers every week.
                        </p>
                    </div>

                    <ol className="mk-steps">
                        {STEPS.map(s => (
                            <li className="mk-step" key={s.n}>
                                <div className="mk-step-n">{s.n}</div>
                                <h4 className="mk-step-title">{s.title}</h4>
                                <p className="mk-step-body">{s.body}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* METRICS BAND */}
            <section className="mk-metricband">
                <div className="mk-container">
                    <div className="mk-metrics">
                        {METRICS.map(m => (
                            <div className="mk-metric" key={m.label}>
                                <div className="mk-metric-value">{m.value}</div>
                                <div className="mk-metric-label">{m.label}</div>
                                <div className="mk-metric-sub">{m.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FLEET STRIP */}
            <section className="mk-section">
                <div className="mk-container">
                    <div className="mk-section-head mk-section-head--center">
                        <div className="mk-kicker">On the road</div>
                        <h2 className="mk-section-title">Real fleets. Real freight. Real time.</h2>
                        <p className="mk-section-sub">
                            From day-cabs to reefers, DispatchOS handles every equipment class our
                            carriers move — and hands the driver an app that actually respects their time.
                        </p>
                    </div>
                    <div className="mk-fleetstrip">
                        {FLEET.map((n, i) => (
                            <div className={'mk-fleetstrip-item mk-fleetstrip-item--' + (i % 3)} key={n}>
                                <img src={TRAILER_IMG(n)} alt="" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="mk-section mk-section--alt">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">In their words</div>
                        <h2 className="mk-section-title">Why operators pick DispatchOS.</h2>
                    </div>
                    <div className="mk-quotes">
                        {TESTIMONIALS.map(t => (
                            <figure className="mk-quote" key={t.name}>
                                <blockquote>
                                    <span className="mk-quote-mark" aria-hidden="true">“</span>
                                    {t.quote}
                                </blockquote>
                                <figcaption>
                                    <img className="mk-quote-avatar" src={DRIVER_IMG(t.photo)} alt={t.name} loading="lazy" />
                                    <div>
                                        <div className="mk-quote-name">{t.name}</div>
                                        <div className="mk-quote-role">{t.role}</div>
                                    </div>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mk-cta">
                <div className="mk-container mk-cta-inner">
                    <div>
                        <h2 className="mk-cta-title">Ready to give your dispatch team an unfair advantage?</h2>
                        <p className="mk-cta-sub">
                            Talk to a solutions engineer, or spin up a workspace with your own data.
                            No slide decks, no six-week POCs.
                        </p>
                    </div>
                    <div className="mk-cta-actions">
                        <Link to="/login" className="mk-btn mk-btn--primary">Get started</Link>
                        <a href="mailto:sales@dispatchos.io" className="mk-btn mk-btn--ghost">Talk to sales</a>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
