import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout.jsx';

const DRIVER = (n) => `${import.meta.env.BASE_URL}img/drivers/${n}.jpg`;
const TRAILER = (n) => `${import.meta.env.BASE_URL}img/trailers/${n}.jpg`;
const HERO_BG = `${import.meta.env.BASE_URL}img/login/hero.jpg`;

const BENEFITS = [
    {
        icon: 'medic',
        title: 'Health, dental & vision',
        body: '100% employer-paid premiums for you and your family. FSA, HSA, and a real mental-health benefit — not an EAP hotline.',
    },
    {
        icon: 'equity',
        title: 'Meaningful equity',
        body: 'Every full-time hire gets equity with a 10-year exercise window. When we win, you do.',
    },
    {
        icon: 'time',
        title: 'Rest that is actually rest',
        body: '20 vacation days, 11 US holidays, and a 4-week paid sabbatical every 4 years. We track it — and we notice when you do not use it.',
    },
    {
        icon: 'family',
        title: '20 weeks parental leave',
        body: 'Fully paid, all parents, all paths. Return-to-work ramp of 60% for your first month back.',
    },
    {
        icon: 'gear',
        title: 'Setup that fits the job',
        body: 'M-series Mac, ultrawide, standing desk, and a $2,000 home-office budget you actually get to spend.',
    },
    {
        icon: 'learn',
        title: '$3,000 learning budget',
        body: 'Conferences, books, courses, a CDL — if it makes you better at your work here, we pay for it.',
    },
];

const ROLES = [
    {
        team: 'Engineering',
        openings: [
            { title: 'Senior software engineer, Dispatch platform', loc: 'Austin, TX · Hybrid', type: 'Full-time' },
            { title: 'Staff engineer, Data & pricing', loc: 'Remote (US)', type: 'Full-time' },
            { title: 'Software engineer, Driver mobile', loc: 'Warsaw, PL · Hybrid', type: 'Full-time' },
            { title: 'Site reliability engineer', loc: 'Remote (US)', type: 'Full-time' },
            { title: 'Engineering manager, Broker experience', loc: 'Austin, TX · Hybrid', type: 'Full-time' },
        ],
    },
    {
        team: 'AI & Research',
        openings: [
            { title: 'Applied AI engineer, Dispatch copilot', loc: 'Austin, TX · Hybrid', type: 'Full-time' },
            { title: 'Research engineer, Evaluations', loc: 'Remote (US/EU)', type: 'Full-time' },
            { title: 'ML platform engineer', loc: 'Warsaw, PL · Hybrid', type: 'Full-time' },
        ],
    },
    {
        team: 'Product & Design',
        openings: [
            { title: 'Senior product designer, Dispatch board', loc: 'Austin, TX · Hybrid', type: 'Full-time' },
            { title: 'Product manager, Compliance & audit', loc: 'Remote (US)', type: 'Full-time' },
            { title: 'Content designer, Driver app', loc: 'Remote (US)', type: 'Full-time' },
        ],
    },
    {
        team: 'Operations',
        openings: [
            { title: 'Head of driver onboarding', loc: 'Guadalajara, MX', type: 'Full-time' },
            { title: 'Dispatch solutions engineer', loc: 'Austin, TX · Hybrid', type: 'Full-time' },
            { title: 'Fleet success manager', loc: 'Remote (US)', type: 'Full-time' },
        ],
    },
    {
        team: 'Go-to-market',
        openings: [
            { title: 'Enterprise account executive, Southeast', loc: 'Atlanta, GA · Remote', type: 'Full-time' },
            { title: 'Sales development representative', loc: 'Austin, TX · On-site', type: 'Full-time' },
            { title: 'Partnerships lead, Brokerages', loc: 'Remote (US)', type: 'Full-time' },
        ],
    },
];

const PROCESS = [
    {
        n: '01',
        title: 'Intro call · 30 min',
        body: 'A conversation with our recruiter about what you are looking for, and what we are actually building. No trick questions.',
    },
    {
        n: '02',
        title: 'Hiring manager · 60 min',
        body: 'Deep dive with the person you would report to. Talk through your last two years and the problem space of the role.',
    },
    {
        n: '03',
        title: 'Craft exercise',
        body: 'A take-home or live session — your call. Scoped to 2–3 hours, paid, and always drawn from a real problem we hit last quarter.',
    },
    {
        n: '04',
        title: 'On-site · half day',
        body: 'Three sessions with your future team. Includes a values conversation with a leader from outside the team. We share the rubric ahead of time.',
    },
    {
        n: '05',
        title: 'Decision within 5 business days',
        body: 'You will hear back — yes or no — with written feedback. If it is a yes, we call. If it is a no, we still call.',
    },
];

function BenefitIcon({ name }) {
    const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const size = { width: 22, height: 22 };
    switch (name) {
        case 'medic':
            return <svg viewBox="0 0 24 24" {...size} {...common}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M12 10v6M9 13h6M8 6V4h8v2"/></svg>;
        case 'equity':
            return <svg viewBox="0 0 24 24" {...size} {...common}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
        case 'time':
            return <svg viewBox="0 0 24 24" {...size} {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
        case 'family':
            return <svg viewBox="0 0 24 24" {...size} {...common}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6M15 21c0-2.2 1.8-4 4-4s2 1.8 2 4"/></svg>;
        case 'gear':
            return <svg viewBox="0 0 24 24" {...size} {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>;
        case 'learn':
            return <svg viewBox="0 0 24 24" {...size} {...common}><path d="M2 7l10-4 10 4-10 4L2 7Z"/><path d="M6 10v5c0 2 3 4 6 4s6-2 6-4v-5"/></svg>;
        default:
            return null;
    }
}

export default function Career() {
    const totalRoles = ROLES.reduce((n, r) => n + r.openings.length, 0);

    return (
        <MarketingLayout>
            {/* PAGE HERO */}
            <section className="mk-pagehero mk-pagehero--split">
                <div className="mk-container mk-pagehero-grid">
                    <div>
                        <div className="mk-kicker">Careers</div>
                        <h1 className="mk-pagehero-title">
                            Work on the software that <em>moves the country</em>.
                        </h1>
                        <p className="mk-pagehero-sub">
                            Every load on DispatchOS represents a driver waiting to get home,
                            a shipper counting shelves, a broker chasing margin. We build accordingly —
                            with the kind of craft, ownership and pace that comes from knowing the work matters.
                        </p>
                        <div className="mk-pagehero-metrics">
                            <div><span>{totalRoles}</span> open roles</div>
                            <div><span>3</span> offices</div>
                            <div><span>142</span> teammates</div>
                            <div><span>4.7/5</span> Glassdoor rating</div>
                        </div>
                    </div>
                    <div className="mk-pagehero-visual" aria-hidden="true">
                        <img className="mk-pagehero-img mk-pagehero-img--main" src={HERO_BG} alt="" loading="eager" />
                        <img className="mk-pagehero-img mk-pagehero-img--corner" src={TRAILER('u9')} alt="" loading="lazy" />
                        <img className="mk-pagehero-img mk-pagehero-img--pin" src={DRIVER('sofia')} alt="" loading="lazy" />
                    </div>
                </div>
            </section>

            {/* CULTURE / LIFE */}
            <section className="mk-section mk-section--alt">
                <div className="mk-container mk-splitrow">
                    <div className="mk-split-copy">
                        <div className="mk-kicker">What it&apos;s like here</div>
                        <h2 className="mk-section-title">Small teams, real ownership, no theater.</h2>
                        <p className="mk-section-sub">
                            Teams are 4–7 people including a designer, an engineer or two, a PM,
                            and (whenever possible) an operator with dispatch experience. You will
                            ship in your first two weeks. You will talk to a customer in your first month.
                        </p>
                        <p className="mk-section-sub">
                            We write more than we chat. We publish an internal weekly, an engineering
                            review, and a product changelog every Friday — so nobody has to guess
                            what everyone else is doing. Meetings are optional; documents are not.
                        </p>
                        <ul className="mk-checklist">
                            <li>Async by default · a handful of standing meetings, none over 30 min</li>
                            <li>Written proposals for anything that spans two teams</li>
                            <li>Two ride-alongs a year with a customer dispatcher — even if you write CSS</li>
                            <li>Compensation bands published internally, reviewed twice a year</li>
                        </ul>
                    </div>
                    <aside className="mk-factbox">
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">142</span>
                            <span className="mk-factbox-label">Full-time teammates</span>
                        </div>
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">47%</span>
                            <span className="mk-factbox-label">Under-represented in tech</span>
                        </div>
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">92%</span>
                            <span className="mk-factbox-label">Would recommend DispatchOS (internal eNPS)</span>
                        </div>
                        <div className="mk-factbox-row">
                            <span className="mk-factbox-value">3.8yr</span>
                            <span className="mk-factbox-label">Median tenure</span>
                        </div>
                    </aside>
                </div>
            </section>

            {/* BENEFITS */}
            <section className="mk-section">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">Benefits</div>
                        <h2 className="mk-section-title">The kind of package we would want.</h2>
                        <p className="mk-section-sub">
                            We do not treat benefits as a differentiator — we treat them as the floor.
                            Here is what everyone at DispatchOS gets, from day one.
                        </p>
                    </div>
                    <div className="mk-benefits">
                        {BENEFITS.map(b => (
                            <article className="mk-benefit" key={b.title}>
                                <div className="mk-benefit-icon"><BenefitIcon name={b.icon} /></div>
                                <h3 className="mk-benefit-title">{b.title}</h3>
                                <p className="mk-benefit-body">{b.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* OPEN ROLES */}
            <section className="mk-section mk-section--alt" id="roles">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">Open roles</div>
                        <h2 className="mk-section-title">
                            {totalRoles} open positions across {ROLES.length} teams.
                        </h2>
                        <p className="mk-section-sub">
                            Do not see your role? Send us a note at <a href="mailto:jobs@dispatchos.io">jobs@dispatchos.io</a> —
                            we hire for talent density, not headcount plans.
                        </p>
                    </div>

                    <div className="mk-roles">
                        {ROLES.map(group => (
                            <div className="mk-rolegroup" key={group.team}>
                                <div className="mk-rolegroup-head">
                                    <h3>{group.team}</h3>
                                    <span className="mk-rolegroup-count">{group.openings.length} open</span>
                                </div>
                                <ul className="mk-rolelist">
                                    {group.openings.map(r => (
                                        <li className="mk-role" key={r.title}>
                                            <div className="mk-role-title">{r.title}</div>
                                            <div className="mk-role-meta">
                                                <span>{r.loc}</span>
                                                <span className="mk-role-dot">·</span>
                                                <span>{r.type}</span>
                                            </div>
                                            <a href={`mailto:jobs@dispatchos.io?subject=${encodeURIComponent(r.title)}`} className="mk-role-apply">
                                                View role <span aria-hidden="true">→</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PROCESS */}
            <section className="mk-section">
                <div className="mk-container">
                    <div className="mk-section-head">
                        <div className="mk-kicker">Hiring process</div>
                        <h2 className="mk-section-title">Predictable, fast, respectful of your time.</h2>
                        <p className="mk-section-sub">
                            End-to-end, most candidates hear from us within three weeks. We tell
                            you the rubric up front. If we say no, you get real feedback — not a template.
                        </p>
                    </div>
                    <ol className="mk-steps mk-steps--tight">
                        {PROCESS.map(s => (
                            <li className="mk-step" key={s.n}>
                                <div className="mk-step-n">{s.n}</div>
                                <h4 className="mk-step-title">{s.title}</h4>
                                <p className="mk-step-body">{s.body}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* CTA */}
            <section className="mk-cta">
                <div className="mk-container mk-cta-inner">
                    <div>
                        <h2 className="mk-cta-title">Not sure which role fits? Just reach out.</h2>
                        <p className="mk-cta-sub">
                            We hire when we meet great people, whether or not there is a matching req.
                            Send us a note — a real human replies within two business days.
                        </p>
                    </div>
                    <div className="mk-cta-actions">
                        <a href="mailto:jobs@dispatchos.io" className="mk-btn mk-btn--primary">Email the team</a>
                        <Link to="/about" className="mk-btn mk-btn--ghost">Learn about us</Link>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
