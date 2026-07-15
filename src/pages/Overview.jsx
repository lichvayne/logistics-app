import { useEffect, useState } from 'react';
import { useDrivers, useTrailers, useLoads, useOrders, useEscalations } from '../api.js';
import { formatMoney, formatRelTime, yardCode } from '../format.js';

function greeting(hour) {
    if (hour < 5)  return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function useNow() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);
    return now;
}

function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const start = performance.now();
        const from = 0;
        const to = Number(value) || 0;
        const dur = 900;
        let raf;
        const tick = (t) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <>{display}</>;
}

const ICONS = {
    drivers: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.5"/>
            <path d="M4 20c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5"/>
        </svg>
    ),
    trailers: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="14" height="9" rx="1"/>
            <path d="M16 10h3l3 3v3h-2"/>
            <circle cx="7" cy="18" r="2"/>
            <circle cx="18" cy="18" r="2"/>
        </svg>
    ),
    loads: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/>
            <path d="M12 12l9-5M12 12v10M12 12L3 7"/>
        </svg>
    ),
    signals: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c3-6 17-6 20 0-3 6-17 6-20 0z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ),
};

const EVENT_ICONS = {
    escalation: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l10 18H2L12 3z"/>
            <path d="M12 10v5M12 18v.5"/>
        </svg>
    ),
    order: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M4 12h16M4 17h10"/>
        </svg>
    ),
};

export default function Overview() {
    const drivers = useDrivers();
    const trailers = useTrailers();
    const loads = useLoads();
    const orders = useOrders();
    const escalations = useEscalations();
    const now = useNow();

    const anyLoading = drivers.isLoading || trailers.isLoading || loads.isLoading || orders.isLoading || escalations.isLoading;
    if (anyLoading) return <div className="loading">Loading…</div>;

    const dList = drivers.data ?? [];
    const tList = trailers.data ?? [];
    const lList = loads.data ?? [];
    const oList = orders.data ?? [];
    const eList = escalations.data ?? [];

    const critHos = dList.filter(d => d.hosRemaining < 4).length;
    const yardCount = new Set(tList.map(t => yardCode(t.assignedSpot))).size;
    const totalRate = lList.reduce((s, l) => s + l.payoutRate, 0);
    const lowBattery = tList.filter(t => t.batteryPercent < 60).length;

    const activity = [
        ...eList.map(e => ({ kind: 'escalation', ts: e.createdAt, data: e })),
        ...oList.map(o => ({ kind: 'order',      ts: o.createdAt, data: o }))
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);

    const totalIssues = critHos + lowBattery + eList.length;
    const health = totalIssues === 0 ? 'nominal' : totalIssues < 4 ? 'watch' : 'strained';
    const healthCopy = health === 'nominal'
        ? 'All systems nominal'
        : health === 'watch'
            ? `${totalIssues} items need attention`
            : `${totalIssues} active signals`;

    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    const cards = [
        {
            key: 'drivers',
            label: 'Drivers on duty',
            value: dList.length,
            sub: critHos > 0 ? `${critHos} critical HOS` : 'All compliant',
            warn: critHos > 0,
            tone: 'indigo',
        },
        {
            key: 'trailers',
            label: 'Trailers tracked',
            value: tList.length,
            sub: `${yardCount} yards · ${lowBattery} low battery`,
            warn: lowBattery > 0,
            tone: 'cyan',
        },
        {
            key: 'loads',
            label: 'Open loads',
            value: lList.length,
            sub: `${formatMoney(totalRate)} total value`,
            warn: false,
            tone: 'emerald',
        },
        {
            key: 'signals',
            label: 'Signal events',
            value: eList.length + oList.length,
            sub: `${eList.length} escalations · ${oList.length} orders`,
            warn: eList.length > 0,
            tone: 'amber',
        },
    ];

    return (
        <>
            <section className={`ov-hero ov-hero--${health}`}>
                <div className="ov-hero-bg" aria-hidden="true">
                    <span className="ov-orb ov-orb-a" />
                    <span className="ov-orb ov-orb-b" />
                    <span className="ov-orb ov-orb-c" />
                    <span className="ov-grid" />
                </div>
                <div className="ov-hero-inner">
                    <div className="ov-hero-lead">
                        <div className="ov-eyebrow">
                            <span className={`ov-health-dot ov-health-dot--${health}`} />
                            <span>{healthCopy}</span>
                        </div>
                        <h1 className="ov-title">
                            {greeting(now.getHours())}<span className="ov-title-accent">.</span>
                        </h1>
                        <p className="ov-subtitle">
                            Here's the fleet snapshot for <b>{dateStr}</b>. Data refreshes every 30 seconds.
                        </p>
                    </div>
                    <div className="ov-hero-side">
                        <div className="ov-clock">{timeStr}</div>
                        <div className="ov-clock-label">local time</div>
                    </div>
                </div>
            </section>

            <div className="ov-stats">
                {cards.map((c, i) => (
                    <div
                        key={c.key}
                        className={`ov-stat ov-stat--${c.tone}`}
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="ov-stat-top">
                            <div className="ov-stat-label">{c.label}</div>
                            <div className="ov-stat-icon">{ICONS[c.key]}</div>
                        </div>
                        <div className="ov-stat-value">
                            <AnimatedNumber value={c.value} />
                        </div>
                        <div className={'ov-stat-sub' + (c.warn ? ' is-warn' : '')}>
                            <span className="ov-stat-sub-dot" />
                            {c.sub}
                        </div>
                        <span className="ov-stat-glow" aria-hidden="true" />
                    </div>
                ))}
            </div>

            <div className="ov-section-head">
                <h2 className="ov-section-title">Recent activity</h2>
                <span className="ov-section-meta">{activity.length} events</span>
            </div>

            {activity.length === 0 ? (
                <div className="ov-empty">
                    <div className="ov-empty-icon">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9"/>
                            <path d="M8 12l2.5 2.5L16 9"/>
                        </svg>
                    </div>
                    <div>No recent activity — quiet on the wire.</div>
                </div>
            ) : (
                <div className="ov-feed">
                    {activity.map((ev, i) => (
                        <div
                            key={i}
                            className={`ov-feed-row ov-feed-row--${ev.kind}`}
                            style={{ animationDelay: `${i * 45}ms` }}
                        >
                            <div className="ov-feed-time">{formatRelTime(ev.ts)}</div>
                            <div className="ov-feed-rail">
                                <div className="ov-feed-badge">{EVENT_ICONS[ev.kind]}</div>
                                {i < activity.length - 1 && <span className="ov-feed-line" />}
                            </div>
                            <div className="ov-feed-body">
                                {ev.kind === 'escalation' ? (
                                    <>
                                        <div className="ov-feed-title">{ev.data.summary}</div>
                                        {(ev.data.driverName || ev.data.trailerId) && (
                                            <div className="ov-feed-meta">
                                                {ev.data.driverName && <>driver <b>{ev.data.driverName}</b></>}
                                                {ev.data.driverName && ev.data.trailerId && <> · </>}
                                                {ev.data.trailerId && <>trailer <b>{ev.data.trailerId}</b></>}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="ov-feed-title">
                                            <b>{ev.data.orderId}</b> · {ev.data.origin} → {ev.data.destination}
                                        </div>
                                        <div className="ov-feed-meta">
                                            {ev.data.equipmentType} · <b>{formatMoney(ev.data.rate)}</b>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}