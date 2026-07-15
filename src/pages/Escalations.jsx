import { useMemo, useState } from 'react';
import { useLiveEscalations } from '../api.js';
import { formatRelTime } from '../format.js';
import EscalationChatDrawer from '../components/EscalationChatDrawer.jsx';

const STATUS_META = {
    OPEN:     { tone: 'open',     label: 'Open',     icon: 'alert' },
    CLAIMED:  { tone: 'claimed',  label: 'Claimed',  icon: 'hand'  },
    RESOLVED: { tone: 'resolved', label: 'Resolved', icon: 'check' },
};

function StatusIcon({ kind }) {
    if (kind === 'hand') return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11V6a2 2 0 1 1 4 0v5M13 11V4a2 2 0 1 1 4 0v7M17 11V7a2 2 0 1 1 4 0v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3l-1-2a1.5 1.5 0 0 1 2.5-1.6L7 11"/>
        </svg>
    );
    if (kind === 'check') return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l5 5L20 6"/>
        </svg>
    );
    return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/>
        </svg>
    );
}

export default function Escalations() {
    const { data, isLoading } = useLiveEscalations();
    const [openId, setOpenId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');

    const escalations = data ?? [];

    const stats = useMemo(() => {
        const s = { total: escalations.length, OPEN: 0, CLAIMED: 0, RESOLVED: 0 };
        for (const e of escalations) if (s[e.status] != null) s[e.status]++;
        return s;
    }, [escalations]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return escalations
            .filter(e => filter === 'all' || e.status === filter)
            .filter(e => !q
                || (e.summary || '').toLowerCase().includes(q)
                || (e.driverName || '').toLowerCase().includes(q)
                || (e.trailerId || '').toLowerCase().includes(q))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [escalations, filter, query]);

    if (isLoading) return <div className="loading">Loading…</div>;

    const active = escalations.find(e => e.id === openId);

    const chips = [
        { key: 'all',      label: 'All' },
        { key: 'OPEN',     label: 'Open' },
        { key: 'CLAIMED',  label: 'Claimed' },
        { key: 'RESOLVED', label: 'Resolved' },
    ];

    return (
        <>
            <section className={'esc-hero' + (stats.OPEN > 0 ? ' esc-hero--alert' : '')}>
                <div className="esc-hero-bg" aria-hidden="true">
                    <span className="esc-hero-orb esc-hero-orb-a" />
                    <span className="esc-hero-orb esc-hero-orb-b" />
                    <span className="esc-hero-scan" />
                </div>
                <div className="esc-hero-inner">
                    <div>
                        <div className="esc-hero-eyebrow">
                            <span className="esc-hero-dot" />
                            <span>Live · signal feed</span>
                        </div>
                        <h1 className="esc-hero-title">Escalations</h1>
                        <p className="esc-hero-sub">{escalations.length} live signals · {stats.OPEN} unclaimed</p>
                    </div>
                    <div className="esc-hero-stats">
                        <div className={'esc-hero-stat esc-hero-stat--open' + (stats.OPEN > 0 ? ' is-live' : '')}>
                            <div className="esc-hero-stat-num">{stats.OPEN}</div>
                            <div className="esc-hero-stat-label">Open</div>
                        </div>
                        <div className="esc-hero-stat esc-hero-stat--claimed">
                            <div className="esc-hero-stat-num">{stats.CLAIMED}</div>
                            <div className="esc-hero-stat-label">Claimed</div>
                        </div>
                        <div className="esc-hero-stat esc-hero-stat--resolved">
                            <div className="esc-hero-stat-num">{stats.RESOLVED}</div>
                            <div className="esc-hero-stat-label">Resolved</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="esc-toolbar">
                <div className="esc-search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                    </svg>
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search summary, driver, trailer…" />
                    {query && (
                        <button className="esc-search-clear" onClick={() => setQuery('')} aria-label="Clear">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
                        </button>
                    )}
                </div>
                <div className="esc-chips">
                    {chips.map(c => (
                        <button
                            key={c.key}
                            type="button"
                            className={'esc-chip esc-chip--' + c.key.toLowerCase() + (filter === c.key ? ' is-active' : '')}
                            onClick={() => setFilter(c.key)}
                        >{c.label}</button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="esc-empty">
                    <div className="esc-empty-icon">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/>
                        </svg>
                    </div>
                    <div>No live escalations — nice and quiet.</div>
                </div>
            ) : (
                <div className="esc-timeline">
                    {filtered.map((e, i) => {
                        const meta = STATUS_META[e.status] || STATUS_META.OPEN;
                        return (
                            <article
                                key={e.id}
                                className={'esc-item esc-item--' + meta.tone}
                                style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                            >
                                <div className="esc-rail">
                                    <div className={'esc-rail-badge esc-rail-badge--' + meta.tone}>
                                        <StatusIcon kind={meta.icon} />
                                    </div>
                                    {i < filtered.length - 1 && <span className="esc-rail-line" />}
                                </div>
                                <div className="esc-card">
                                    <header className="esc-card-head">
                                        <span className={'esc-status esc-status--' + meta.tone}>
                                            <span className="esc-status-dot" />
                                            {meta.label}
                                        </span>
                                        <span className="esc-time">{formatRelTime(e.createdAt)}</span>
                                    </header>
                                    <div className="esc-summary">{e.summary}</div>
                                    {(e.driverName || e.trailerId || e.claimedBy) && (
                                        <div className="esc-meta">
                                            {e.driverName && (
                                                <span className="esc-tag">
                                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="8" r="3.5"/><path d="M4 20c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5"/>
                                                    </svg>
                                                    <b>{e.driverName}</b>
                                                </span>
                                            )}
                                            {e.trailerId && (
                                                <span className="esc-tag">
                                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="2" y="7" width="14" height="9" rx="1"/><path d="M16 10h3l3 3v3h-2"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
                                                    </svg>
                                                    <b>{e.trailerId}</b>
                                                </span>
                                            )}
                                            {e.claimedBy && (
                                                <span className="esc-tag esc-tag--claimed">
                                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M9 11V6a2 2 0 1 1 4 0v5M13 11V4a2 2 0 1 1 4 0v7M17 11V7a2 2 0 1 1 4 0v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3l-1-2"/>
                                                    </svg>
                                                    claimed by <b>{e.claimedBy}</b>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <footer className="esc-card-foot">
                                        <button
                                            type="button"
                                            className={'esc-action esc-action--' + meta.tone}
                                            onClick={() => setOpenId(e.id)}
                                        >
                                            {e.status === 'OPEN' ? 'Claim & chat' : e.status === 'CLAIMED' ? 'Open chat' : 'View thread'}
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                                        </button>
                                    </footer>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <EscalationChatDrawer
                escalation={active}
                onClose={() => setOpenId(null)}
                onResolved={() => setOpenId(null)}
            />
        </>
    );
}
