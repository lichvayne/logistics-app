import { useEffect, useMemo, useRef, useState } from 'react';
import { useTrailers } from '../api.js';
import { batteryLevel, locationDescription, yardCode } from '../format.js';
import { trailerImage, TRAILER_FALLBACK } from '../assets/images.js';
import { useT } from '../i18n.jsx';
import TrailerDetailDrawer from '../components/TrailerDetailDrawer.jsx';

const YARD_NAMES = {
    'TBS': 'Tbilisi',
    'BUS': 'Batumi',
    'KUT': 'Kutaisi',
    'RUS': 'Rustavi',
    'ATL': 'Atlanta',
    'CHI': 'Chicago',
    'DAL': 'Dallas',
};

const PAGE_SIZES = [9, 18, 36];

const STATUS_META = {
    'in-yard':          { tone: 'idle',    label: 'In yard',        dot: '#10B981' },
    'loaded':           { tone: 'loaded',  label: 'Loaded',         dot: '#F59E0B' },
    'out-for-delivery': { tone: 'moving',  label: 'Out for delivery', dot: '#3B82F6' },
    'maintenance':     { tone: 'down',    label: 'Maintenance',    dot: '#F43F5E' },
};

function statusMeta(status) {
    const key = (status || '').toLowerCase();
    return STATUS_META[key] || { tone: 'idle', label: status || 'Unknown', dot: '#64748B' };
}

function BatteryRing({ pct }) {
    const lvl = batteryLevel(pct);
    const R = 22;
    const C = 2 * Math.PI * R;
    const p = Math.max(0.02, Math.min(1, (pct ?? 0) / 100));
    return (
        <div className={'trl-batt-ring trl-batt-ring--' + lvl}>
            <svg viewBox="0 0 56 56" width="56" height="56">
                <circle cx="28" cy="28" r={R} className="trl-batt-track" />
                <circle
                    cx="28" cy="28" r={R}
                    className="trl-batt-fill"
                    strokeDasharray={`${C * p} ${C}`}
                    transform="rotate(-90 28 28)"
                />
            </svg>
            <div className="trl-batt-num">{pct ?? 0}<span>%</span></div>
        </div>
    );
}

function buildPageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out = new Set([1, total, current, current - 1, current + 1]);
    if (current <= 3) [2, 3, 4].forEach(p => out.add(p));
    if (current >= total - 2) [total - 3, total - 2, total - 1].forEach(p => out.add(p));
    const sorted = [...out].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
        result.push(sorted[i]);
    }
    return result;
}

export default function Trailers() {
    const t = useT();
    const { data, isLoading } = useTrailers();
    const [yardFilter, setYardFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [openId, setOpenId] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const gridTopRef = useRef(null);

    const trailers = data ?? [];

    const yards = useMemo(
        () => Array.from(new Set(trailers.map(tr => yardCode(tr.assignedSpot)))).sort(),
        [trailers]
    );

    const stats = useMemo(() => {
        const s = { total: trailers.length, inYard: 0, loaded: 0, moving: 0, lowBattery: 0 };
        for (const tr of trailers) {
            const k = (tr.status || '').toLowerCase();
            if (k === 'in-yard') s.inYard++;
            else if (k === 'loaded') s.loaded++;
            else if (k === 'out-for-delivery') s.moving++;
            if (tr.batteryPercent != null && tr.batteryPercent < 60) s.lowBattery++;
        }
        return s;
    }, [trailers]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return trailers
            .filter(tr => yardFilter === 'all' || yardCode(tr.assignedSpot) === yardFilter)
            .filter(tr => statusFilter === 'all' || (tr.status || '').toLowerCase() === statusFilter)
            .filter(tr => !q
                || tr.trailerId.toLowerCase().includes(q)
                || (tr.assignedSpot || '').toLowerCase().includes(q)
                || (tr.landmarkHint || '').toLowerCase().includes(q))
            .sort((a, b) => {
                if (sortBy === 'battery') return (b.batteryPercent ?? 0) - (a.batteryPercent ?? 0);
                if (sortBy === 'battery-asc') return (a.batteryPercent ?? 0) - (b.batteryPercent ?? 0);
                if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
                return a.trailerId.localeCompare(b.trailerId);
            });
    }, [trailers, yardFilter, statusFilter, query, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    useEffect(() => { setPage(1); }, [yardFilter, statusFilter, query, sortBy, pageSize]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + pageSize);
    const pageNumbers = buildPageList(currentPage, totalPages);

    const goToPage = (p) => {
        setPage(p);
        if (gridTopRef.current) gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (isLoading) return <div className="loading">{t('loading')}</div>;

    const statusChips = [
        { key: 'all',              label: 'All' },
        { key: 'in-yard',          label: 'In yard' },
        { key: 'loaded',           label: 'Loaded' },
        { key: 'out-for-delivery', label: 'On road' },
    ];

    return (
        <>
            <section className="trl-hero">
                <div className="trl-hero-bg" aria-hidden="true">
                    <span className="trl-hero-orb trl-hero-orb-a" />
                    <span className="trl-hero-orb trl-hero-orb-b" />
                    <span className="trl-hero-grid" />
                </div>
                <div className="trl-hero-inner">
                    <div>
                        <div className="trl-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="14" height="9" rx="1"/>
                                <path d="M16 10h3l3 3v3h-2"/>
                                <circle cx="7" cy="18" r="2"/>
                                <circle cx="18" cy="18" r="2"/>
                            </svg>
                            <span>Yard · inventory</span>
                        </div>
                        <h1 className="trl-hero-title">{t('trailers_title')}</h1>
                        <p className="trl-hero-sub">{t('trailers_subtitle', trailers.length, yards.length)}</p>
                    </div>
                    <div className="trl-hero-stats">
                        <div className="trl-hero-stat">
                            <div className="trl-hero-stat-num">{stats.total}</div>
                            <div className="trl-hero-stat-label">Fleet</div>
                        </div>
                        <div className="trl-hero-stat trl-hero-stat--yard">
                            <div className="trl-hero-stat-num">{stats.inYard}</div>
                            <div className="trl-hero-stat-label">In yard</div>
                        </div>
                        <div className="trl-hero-stat trl-hero-stat--loaded">
                            <div className="trl-hero-stat-num">{stats.loaded}</div>
                            <div className="trl-hero-stat-label">Loaded</div>
                        </div>
                        <div className="trl-hero-stat trl-hero-stat--moving">
                            <div className="trl-hero-stat-num">{stats.moving}</div>
                            <div className="trl-hero-stat-label">On road</div>
                        </div>
                        <div className={'trl-hero-stat trl-hero-stat--low' + (stats.lowBattery > 0 ? ' is-live' : '')}>
                            <div className="trl-hero-stat-num">{stats.lowBattery}</div>
                            <div className="trl-hero-stat-label">Low batt</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="trl-toolbar">
                <div className="trl-search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <path d="M21 21l-4.3-4.3"/>
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search trailer ID, spot, landmark…"
                    />
                    {query && (
                        <button className="trl-search-clear" onClick={() => setQuery('')} aria-label="Clear">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M6 6l12 12M6 18L18 6"/>
                            </svg>
                        </button>
                    )}
                </div>

                <div className="trl-status-chips">
                    {statusChips.map(sc => (
                        <button
                            key={sc.key}
                            type="button"
                            className={'trl-status-chip trl-status-chip--' + sc.key + (statusFilter === sc.key ? ' is-active' : '')}
                            onClick={() => setStatusFilter(sc.key)}
                        >
                            {sc.label}
                        </button>
                    ))}
                </div>

                <div className="trl-sort">
                    <label>Sort</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="id">Trailer ID</option>
                        <option value="battery">Battery (high→low)</option>
                        <option value="battery-asc">Battery (low→high)</option>
                        <option value="status">Status</option>
                    </select>
                </div>
            </div>

            <div className="trl-yard-row">
                <button
                    type="button"
                    className={'trl-yard-chip' + (yardFilter === 'all' ? ' is-active' : '')}
                    onClick={() => setYardFilter('all')}
                >
                    <span>{t('all_yards')}</span>
                    <span className="trl-yard-count">{trailers.length}</span>
                </button>
                {yards.map(y => {
                    const count = trailers.filter(tr => yardCode(tr.assignedSpot) === y).length;
                    return (
                        <button
                            key={y}
                            type="button"
                            className={'trl-yard-chip' + (yardFilter === y ? ' is-active' : '')}
                            onClick={() => setYardFilter(y)}
                        >
                            <span className="trl-yard-code">{y}</span>
                            <span>{YARD_NAMES[y] || y}</span>
                            <span className="trl-yard-count">{count}</span>
                        </button>
                    );
                })}
            </div>

            <div ref={gridTopRef} />

            {filtered.length === 0 ? (
                <div className="trl-empty">
                    <div className="trl-empty-icon">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7"/>
                            <path d="M21 21l-4.3-4.3"/>
                        </svg>
                    </div>
                    <div>No trailers match your filters.</div>
                </div>
            ) : (
                <div className="trl-grid">
                    {pageItems.map((tr, i) => {
                        const bl = batteryLevel(tr.batteryPercent);
                        const meta = statusMeta(tr.status);
                        const yc = yardCode(tr.assignedSpot);
                        const yardName = YARD_NAMES[yc] || yc;
                        return (
                            <button
                                key={tr.trailerId}
                                type="button"
                                className={'trl-card trl-card--' + meta.tone}
                                onClick={() => setOpenId(tr.trailerId)}
                                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                            >
                                <div className="trl-photo">
                                    <img
                                        src={trailerImage(tr)}
                                        alt={`Trailer ${tr.trailerId}`}
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.src = TRAILER_FALLBACK; }}
                                    />
                                    <span className="trl-photo-shade" aria-hidden="true" />
                                    <span className={'trl-status-badge trl-status-badge--' + meta.tone}>
                                        <span className="trl-status-badge-dot" />
                                        <span>{meta.label}</span>
                                    </span>
                                    <div className="trl-photo-id">
                                        <span className="trl-photo-id-hash">#</span>
                                        {tr.trailerId}
                                    </div>
                                </div>

                                <div className="trl-body">
                                    <div className="trl-row">
                                        <div className="trl-spot">
                                            <span className="trl-spot-yard">{yardName}</span>
                                            <span className="trl-sep">·</span>
                                            <span className="trl-spot-name">{tr.assignedSpot}</span>
                                        </div>
                                        <BatteryRing pct={tr.batteryPercent} />
                                    </div>

                                    <div className="trl-landmark">
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
                                            <circle cx="12" cy="10" r="2.5"/>
                                        </svg>
                                        <span>{tr.landmarkHint || <span className="trl-faint">no landmark</span>}</span>
                                    </div>

                                    <div className="trl-facts">
                                        <div className="trl-fact">
                                            <div className="trl-fact-label">Location</div>
                                            <div className="trl-fact-value">{locationDescription(tr.latitude, tr.longitude)}</div>
                                        </div>
                                        <div className="trl-fact trl-fact--right">
                                            <div className="trl-fact-label">Tracker</div>
                                            <div className={'trl-fact-value trl-batt-tag trl-batt-tag--' + bl}>
                                                {bl === 'critical' ? 'Critical' : bl === 'warn' ? 'Low' : 'Healthy'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {filtered.length > 0 && (
                <nav className="trl-pager" aria-label="Trailers pagination">
                    <div className="trl-pager-info">
                        Showing <b>{startIdx + 1}</b>–<b>{Math.min(startIdx + pageSize, filtered.length)}</b> of <b>{filtered.length}</b>
                    </div>
                    <div className="trl-pager-nav">
                        <button
                            type="button"
                            className="trl-pager-btn"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>
                        {pageNumbers.map((p, i) => p === '…' ? (
                            <span key={'e' + i} className="trl-pager-ellipsis">…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                className={'trl-pager-num' + (p === currentPage ? ' is-current' : '')}
                                onClick={() => goToPage(p)}
                                aria-current={p === currentPage ? 'page' : undefined}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="trl-pager-btn"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 6l6 6-6 6"/>
                            </svg>
                        </button>
                    </div>
                    <div className="trl-pager-size">
                        <label>Per page</label>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </nav>
            )}

            <TrailerDetailDrawer id={openId} onClose={() => setOpenId(null)} />
        </>
    );
}
