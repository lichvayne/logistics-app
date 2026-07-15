import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout.jsx';

const DRIVER = (name) => `${import.meta.env.BASE_URL}img/drivers/${name}.jpg`;
const TRAILER = (name) => `${import.meta.env.BASE_URL}img/trailers/${name}.jpg`;
const HERO_BG = `${import.meta.env.BASE_URL}img/login/hero.jpg`;

const VALUES = [
    {
        title: 'Drivers first, always.',
        body: 'The person in the cab is the customer we can never afford to disappoint. Every feature earns its keep on their screen first.',
    },
    {
        title: 'Ship boring software.',
        body: 'Dispatch runs 24/7. We optimize for the 3am rollout, not the demo. Fewer surprises, better sleep.',
    },
    {
        title: 'Automate the paperwork.',
        body: 'AI is not the product — the freed-up hour is. If a feature does not remove a spreadsheet, it does not ship.',
    },
    {
        title: 'Own the outcome.',
        body: 'When something breaks in a customer\'s yard, it is our problem until it is not. We do not hand off, we solve.',
    },
];

const TIMELINE = [
    { year: '2021', title: 'The idea, on I-40', body: 'Marcus takes a 900-mile drive to renegotiate a shipper contract by hand. Sketches the first DispatchOS wireframe on a truck-stop napkin.' },
    { year: '2022', title: 'First 100 loads', body: 'Founding team of six ships v1 to three friendly carriers in Texas. First automated POD upload lands from a driver near Amarillo.' },
    { year: '2023', title: 'Series A · $18M', body: 'Led by Redpoint Ventures with participation from Ryder Ventures. Team grows to 34 across Austin and Warsaw.' },
    { year: '2024', title: 'AI copilot goes live', body: 'The dispatch copilot moves from beta to default. Median load-accept time drops from 11 minutes to 2.4 minutes across the customer base.' },
    { year: '2025', title: 'Series B · $60M', body: 'Led by Andreessen Horowitz. DispatchOS now moves $1.9B of freight annually across 41 US states.' },
    { year: '2026', title: 'Cross-border launch', body: 'Live in Canada and Mexico with FAST/C-TPAT customs integration. 3,400+ drivers on-platform.' },
];

const OFFICES = [
    { city: 'Austin, TX', role: 'HQ · Product & Go-to-market', address: '1400 East 6th Street, Austin, TX 78702' },
    { city: 'Warsaw, PL', role: 'Engineering hub', address: 'Aleje Jerozolimskie 100, 00-807 Warszawa' },
    { city: 'Guadalajara, MX', role: 'Driver operations', address: 'Av. de las Américas 1545, Providencia, 44630' },
];

const PRESS = [
    'FreightWaves · "The startup convincing dispatchers to trust an AI copilot"',
    'The Wall Street Journal · "Trucking\'s software problem finally has a real answer"',
    'TechCrunch · "DispatchOS raises $60M to rewire freight operations"',
    'Transport Topics · "How a former trucker is rebuilding the TMS from scratch"',
];

export default function About() {
    return (
        <MarketingLayout>
            {/* PAGE HERO */}
            <section className="mk-pagehero mk-pagehero--split">
                <div className="mk-container mk-pagehero-grid">
                    <div>
                        <div className="mk-kicker">About DispatchOS</div>
                        <h1 className="mk-pagehero-title">
                            We are building the software layer<br/>
                            that <em>American freight</em> deserves.
                        </h1>
                        <p className="mk-pagehero-sub">
                            Trucking moves 72% of the freight in the United States on a stack of email,
                            spreadsheets and phone calls. We are here to change that — without
                            pretending the driver, the dispatcher, or the broker is going away.
                        </p>
                    </div>
                    <div className="mk-pagehero-visual" aria-hidden="true">
                        <img className="mk-pagehero-img mk-pagehero-img--main" src={HERO_BG} alt="" loading="eager" />
                        <img className="mk-pagehero-img mk-pagehero-img--corner" src={TRAILER('u5')} alt="" loading="lazy" />
                        <img className="mk-pagehero-img mk-pagehero-img--pin" src={DRIVER('marcus')} alt="" loading="lazy" />
                    </div>
                </div>
            </section>

            {/* MISSION / STORY */}
            <section className="mk-section mk-section--alt">
                <div className="mk-container mk-splitrow">
                    <div className="mk-split-copy">
                        <div className="mk-kicker">Our mission</div>
                        <h2 className="mk-section-title">
                            Move freight, not paperwork.
                        </h2>
                        <p className="mk-section-sub">
                            Dispatch is the connective tissue of the American economy — and for
                            forty years it has been powered by tools that were built for the fax era.
                            We believe the next generation of carriers, brokerages and owner-operators
                            deserves the same caliber of software that Silicon Valley reserves for itself.
                        </p>
                        <p className="mk-section-sub">
                            DispatchOS is not another TMS with a chatbot bolted on. It is the operating
                            system dispatchers actually run their day on — with an AI copilot that treats
                            the boring 80% of the job as a solved problem, so humans can focus on
                            the calls that matter.
                        </p>
                    </div>
                    <aside className="mk-factbox">
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">2021</span>
                            <span className="mk-factbox-label">Founded in Austin, TX</span>
                        </div>
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">142</span>
                            <span className="mk-factbox-label">People across 3 offices</span>
                        </div>
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">$78M</span>
                            <span className="mk-factbox-label">Raised to date, Series B</span>
                        </div>
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">3,412</span>
                            <span className="mk-factbox-label">Active drivers on-platform</span>
                        </div>
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">41</span>
                            <span className="mk-factbox-label">US states served</span>
                        </div>
                    </aside>
                </div>
            </section>

            {/* VALUES */}
            <section className="mk-section">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">What we believe</div>
                        <h2 className="mk-section-title">Four values we hire, review and fire on.</h2>
                        <p className="mk-section-sub">
                            These are not posters. They are how we decide what to build, who to bring on,
                            and which shortcuts we refuse to take.
                        </p>
                    </div>
                    <div className="mk-values">
                        {VALUES.map((v, i) => (
                            <article className="mk-value" key={v.title}>
                                <div className="mk-value-n">{String(i + 1).padStart(2, '0')}</div>
                                <h3 className="mk-value-title">{v.title}</h3>
                                <p className="mk-value-body">{v.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* TIMELINE */}
            <section className="mk-section mk-section--alt">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">Our story</div>
                        <h2 className="mk-section-title">Five years, one thesis.</h2>
                    </div>
                    <ol className="mk-timeline">
                        {TIMELINE.map(t => (
                            <li className="mk-timeline-item" key={t.year}>
                                <div className="mk-timeline-year">{t.year}</div>
                                <div className="mk-timeline-body">
                                    <h4>{t.title}</h4>
                                    <p>{t.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* OFFICES */}
            <section className="mk-section mk-section--alt">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">Where we work</div>
                        <h2 className="mk-section-title">Three offices, one time zone that matters — the driver&apos;s.</h2>
                    </div>
                    <div className="mk-offices">
                        {OFFICES.map(o => (
                            <div className="mk-office" key={o.city}>
                                <div className="mk-office-city">{o.city}</div>
                                <div className="mk-office-role">{o.role}</div>
                                <div className="mk-office-addr">{o.address}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRESS */}
            <section className="mk-section" id="press">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">Press</div>
                        <h2 className="mk-section-title">Recent coverage.</h2>
                    </div>
                    <ul className="mk-press">
                        {PRESS.map((p, i) => (
                            <li className="mk-press-item" key={i}>
                                <span className="mk-press-arrow" aria-hidden="true">↗</span>
                                {p}
                            </li>
                        ))}
                    </ul>
                    <p className="mk-press-contact">
                        Press &amp; analyst inquiries: <a href="mailto:press@dispatchos.io">press@dispatchos.io</a>
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="mk-cta">
                <div className="mk-container mk-cta-inner">
                    <div>
                        <h2 className="mk-cta-title">Want to help us rewire American freight?</h2>
                        <p className="mk-cta-sub">
                            We are hiring across engineering, operations, and the driver-facing team.
                        </p>
                    </div>
                    <div className="mk-cta-actions">
                        <Link to="/career" className="mk-btn mk-btn--primary">See open roles</Link>
                        <a href="mailto:hello@dispatchos.io" className="mk-btn mk-btn--ghost">Say hello</a>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
