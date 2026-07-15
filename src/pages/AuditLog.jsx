import { useMemo, useState } from 'react';
import { useAuditLog } from '../api.js';
import { formatRelTime } from '../format.js';

const ACTION_META = {
    BOOK_ORDER:         { tone: 'ok',   label: 'Book order',       icon: 'plus' },
    SUBMIT_POD:         { tone: 'ok',   label: 'Submit POD',       icon: 'check' },
    DUTY_STATUS_CHANGE: { tone: 'info', label: 'Duty change',      icon: 'sync' },
    REPORT_INCIDENT:    { tone: 'warn', label: 'Report incident',  icon: 'alert' },
    RESOLVE_INCIDENT:   { tone: 'ok',   label: 'Resolve incident', icon: 'check' },
    DISPATCHER_REPLY:   { tone: 'info', label: 'Dispatcher reply', icon: 'chat' },
};

function actionMeta(a) {
    return ACTION_META[a] || { tone: 'info', label: a || 'Unknown', icon: 'flag' };
}

function ActionIcon({ kind }) {
    switch (kind) {
        case 'plus':  return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
        case 'check': return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>;
        case 'sync':  return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>;
        case 'alert': return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>;
        case 'chat':  return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
        default:      return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4h14l-3 5 3 5H4"/></svg>;
    }
}

function tryPretty(json) {
    if (!json) return '';
    try { return JSON.stringify(JSON.parse(json), null, 2); }
    catch { return json; }
}

function AuditEntry({ entry, isLast }) {
    const [open, setOpen] = useState(false);
    const meta = actionMeta(entry.action);
    const hasDiff = entry.beforeJson || entry.afterJson;
    const isAI = /^(ai|agent|system|planner)/i.test(entry.actor || '');
    return (
        <article className={'aud-item aud-item--' + meta.tone}>
            <div className="aud-rail">
                <div className={'aud-rail-badge aud-rail-badge--' + meta.tone}>
                    <ActionIcon kind={meta.icon} />
                </div>
                {!isLast && <span className="aud-rail-line" />}
            </div>
            <div className="aud-card">
                <button
                    type="button"
                    className={'aud-card-head' + (hasDiff ? ' has-diff' : '')}
                    onClick={() => hasDiff && setOpen(o => !o)}
                    disabled={!hasDiff}
                >
                    <div className="aud-card-lead">
                        <span className={'aud-action aud-action--' + meta.tone}>{meta.label}</span>
                        <span className="aud-actor">
                            {isAI ? (
                                <span className="aud-actor-badge aud-actor-badge--ai">AI</span>
                            ) : (
                                <span className="aud-actor-badge">HUM</span>
                            )}
                            <span className="mono">{entry.actor}</span>
                        </span>
                    </div>
                    <div className="aud-card-tail">
                        {entry.targetType && (
                            <span className="aud-target">
                                <span className="aud-target-type">{entry.targetType}</span>
                                {entry.targetId && <span className="aud-target-id mono">{entry.targetId}</span>}
                            </span>
                        )}
                        <span className="aud-time">{formatRelTime(entry.createdAt)}</span>
                        {hasDiff && (
                            <span className={'aud-caret' + (open ? ' is-open' : '')} aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                            </span>
                        )}
                    </div>
                </button>
                {open && hasDiff && (
                    <div className="aud-diff">
                        <div className="aud-diff-col">
                            <div className="aud-diff-label aud-diff-label--before">Before</div>
                            <pre>{tryPretty(entry.beforeJson) || <span className="aud-faint">—</span>}</pre>
                        </div>
                        <div className="aud-diff-col">
                            <div className="aud-diff-label aud-diff-label--after">After</div>
                            <pre>{tryPretty(entry.afterJson) || <span className="aud-faint">—</span>}</pre>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}

export default function AuditLog() {
    const [page, setPage] = useState(0);
    const [actionFilter, setActionFilter] = useState('all');
    const [query, setQuery] = useState('');
    const size = 50;
    const { data, isLoading } = useAuditLog(page, size);

    const entries = data?.entries || [];
    const total = data?.total || 0;
    const maxPage = Math.max(0, Math.ceil(total / size) - 1);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return entries
            .filter(e => actionFilter === 'all' || e.action === actionFilter)
            .filter(e => !q
                || (e.actor || '').toLowerCase().includes(q)
                || (e.targetType || '').toLowerCase().includes(q)
                || (e.targetId || '').toLowerCase().includes(q)
                || (e.action || '').toLowerCase().includes(q));
    }, [entries, actionFilter, query]);

    const uniqueActions = useMemo(() => {
        const s = new Set();
        entries.forEach(e => e.action && s.add(e.action));
        return Array.from(s).sort();
    }, [entries]);

    const aiCount = entries.filter(e => /^(ai|agent|system|planner)/i.test(e.actor || '')).length;

    return (
        <>
            <section className="aud-hero">
                <div className="aud-hero-bg" aria-hidden="true">
                    <span className="aud-hero-orb aud-hero-orb-a" />
                    <span className="aud-hero-orb aud-hero-orb-b" />
                </div>
                <div className="aud-hero-inner">
                    <div>
                        <div className="aud-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>
                            </svg>
                            <span>Governance · audit</span>
                        </div>
                        <h1 className="aud-hero-title">Audit log</h1>
                        <p className="aud-hero-sub">Every write action taken by AI agents or humans is recorded here.</p>
                    </div>
                    <div className="aud-hero-stats">
                        <div className="aud-hero-stat"><div className="aud-hero-stat-num">{total}</div><div className="aud-hero-stat-label">Total events</div></div>
                        <div className="aud-hero-stat aud-hero-stat--ai"><div className="aud-hero-stat-num">{aiCount}</div><div className="aud-hero-stat-label">AI actions</div></div>
                        <div className="aud-hero-stat aud-hero-stat--hum"><div className="aud-hero-stat-num">{entries.length - aiCount}</div><div className="aud-hero-stat-label">Human</div></div>
                    </div>
                </div>
            </section>

            <div className="aud-toolbar">
                <div className="aud-search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                    </svg>
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter this page — actor, target, action…" />
                    {query && <button className="aud-search-clear" onClick={() => setQuery('')} aria-label="Clear"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg></button>}
                </div>
                <div className="aud-action-select">
                    <label>Action</label>
                    <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                        <option value="all">All actions</option>
                        {uniqueActions.map(a => <option key={a} value={a}>{actionMeta(a).label}</option>)}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="loading">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="aud-empty">No audit entries match this filter.</div>
            ) : (
                <div className="aud-timeline">
                    {filtered.map((e, i) => (
                        <AuditEntry key={e.id} entry={e} isLast={i === filtered.length - 1} />
                    ))}
                </div>
            )}

            {total > size && (
                <nav className="aud-pager" aria-label="Audit pagination">
                    <button type="button" className="aud-pager-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        Prev
                    </button>
                    <span className="aud-pager-info">Page <b>{page + 1}</b> of <b>{maxPage + 1}</b></span>
                    <button type="button" className="aud-pager-btn" disabled={page >= maxPage} onClick={() => setPage(p => p + 1)}>
                        Next
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                    </button>
                </nav>
            )}
        </>
    );
}
