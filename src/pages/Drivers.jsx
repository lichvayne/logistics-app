import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDrivers } from '../api.js';
import { getAuth } from '../auth.js';
import { formatRelTime, hosLevel, initials, locationDescription } from '../format.js';
import { driverAvatar } from '../assets/images.js';
import { useT } from '../i18n.jsx';
import DriverDetailDrawer from '../components/DriverDetailDrawer.jsx';

const MAX_HOS = 11;

const DUTY_META = {
    'driving':   { label: 'Driving',   tone: 'live',   icon: 'wheel' },
    'on-duty':   { label: 'On duty',   tone: 'active', icon: 'bolt'  },
    'on_duty':   { label: 'On duty',   tone: 'active', icon: 'bolt'  },
    'sleeper':   { label: 'Sleeper',   tone: 'rest',   icon: 'moon'  },
    'off-duty':  { label: 'Off duty',  tone: 'rest',   icon: 'moon'  },
    'off_duty':  { label: 'Off duty',  tone: 'rest',   icon: 'moon'  },
};

function dutyMeta(status) {
    if (!status) return null;
    return DUTY_META[status.toLowerCase()] || { label: status, tone: 'idle', icon: 'dot' };
}

function DutyIcon({ kind }) {
    if (kind === 'wheel') return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>
        </svg>
    );
    if (kind === 'bolt')  return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
        </svg>
    );
    if (kind === 'moon')  return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
        </svg>
    );
    return <span className="drv-duty-mini-dot" />;
}

function HosRing({ hours }) {
    const pct = Math.min(1, Math.max(0.02, hours / MAX_HOS));
    const lvl = hosLevel(hours);
    const R = 26;
    const C = 2 * Math.PI * R;
    const dash = C * pct;
    return (
        <div className={'drv-ring drv-ring--' + lvl}>
            <svg viewBox="0 0 64 64" width="64" height="64">
                <circle cx="32" cy="32" r={R} className="drv-ring-track" />
                <circle
                    cx="32" cy="32" r={R}
                    className="drv-ring-fill"
                    strokeDasharray={`${dash} ${C}`}
                    transform="rotate(-90 32 32)"
                />
            </svg>
            <div className="drv-ring-inner">
                <div className="drv-ring-num">{hours.toFixed(1)}</div>
                <div className="drv-ring-unit">hrs</div>
            </div>
        </div>
    );
}

function Avatar({ d }) {
    const [broken, setBroken] = useState(false);
    if (broken) {
        return <div className="drv-avatar drv-avatar--fallback">{initials(d.driverName)}</div>;
    }
    return (
        <img
            className="drv-avatar"
            src={driverAvatar(d)}
            alt={d.driverName}
            onError={() => setBroken(true)}
        />
    );
}

function tenureYears(hiredAt) {
    if (!hiredAt) return null;
    const start = new Date(hiredAt);
    if (isNaN(start)) return null;
    const years = (Date.now() - start.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (years < 1) return `${Math.max(1, Math.round(years * 12))}mo`;
    return `${years.toFixed(1)}y`;
}

function parseSkills(s) {
    if (!s) return [];
    return s.split(/[,;|]/).map(x => x.trim()).filter(Boolean).slice(0, 4);
}

const PAGE_SIZES = [9, 18, 36];

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

export default function Drivers() {
    const t = useT();
    const [openName, setOpenName] = useState(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('hos');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const gridTopRef = useRef(null);
    const { data, isLoading } = useDrivers();

    const all = data ?? [];

    const counts = useMemo(() => {
        const c = { all: all.length, ok: 0, warn: 0, critical: 0 };
        for (const d of all) c[hosLevel(d.hosRemaining)]++;
        return c;
    }, [all]);

    const drivers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return all
            .filter(d => filter === 'all' || hosLevel(d.hosRemaining) === filter)
            .filter(d => !q
                || d.driverName.toLowerCase().includes(q)
                || (d.licenseNumber || '').toLowerCase().includes(q)
                || (d.homeYard || '').toLowerCase().includes(q))
            .sort((a, b) => sortBy === 'name'
                ? a.driverName.localeCompare(b.driverName)
                : a.hosRemaining - b.hosRemaining);
    }, [all, query, filter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(drivers.length / pageSize));
    useEffect(() => { setPage(1); }, [query, filter, sortBy, pageSize]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = drivers.slice(startIdx, startIdx + pageSize);
    const pageNumbers = buildPageList(currentPage, totalPages);

    const goToPage = (p) => {
        setPage(p);
        if (gridTopRef.current) {
            gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isLoading) return <div className="loading">{t('loading')}</div>;

    const criticalCount = counts.critical;
    const chips = [
        { key: 'all',      label: t('drivers_col_status') === 'Status' ? 'All' : 'ყველა', count: counts.all },
        { key: 'ok',       label: t('status_available'), count: counts.ok },
        { key: 'warn',     label: t('status_watch'),     count: counts.warn },
        { key: 'critical', label: t('status_critical'),  count: counts.critical },
    ];

    return (
        <>
            <section className="drv-hero">
                <div className="drv-hero-bg" aria-hidden="true">
                    <span className="drv-hero-orb drv-hero-orb-a" />
                    <span className="drv-hero-orb drv-hero-orb-b" />
                </div>
                <div className="drv-hero-inner">
                    <div>
                        <div className="drv-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="3.5"/>
                                <path d="M4 20c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5"/>
                            </svg>
                            <span>Fleet · roster</span>
                        </div>
                        <h1 className="drv-hero-title">{t('drivers_title')}</h1>
                        <p className="drv-hero-sub">{t('drivers_subtitle', all.length)}</p>
                    </div>
                    <div className="drv-hero-stats">
                        <div className="drv-hero-stat">
                            <div className="drv-hero-stat-num">{counts.all}</div>
                            <div className="drv-hero-stat-label">Total</div>
                        </div>
                        <div className="drv-hero-stat drv-hero-stat--ok">
                            <div className="drv-hero-stat-num">{counts.ok}</div>
                            <div className="drv-hero-stat-label">Available</div>
                        </div>
                        <div className="drv-hero-stat drv-hero-stat--warn">
                            <div className="drv-hero-stat-num">{counts.warn}</div>
                            <div className="drv-hero-stat-label">Watch</div>
                        </div>
                        <div className={'drv-hero-stat drv-hero-stat--crit' + (criticalCount > 0 ? ' is-live' : '')}>
                            <div className="drv-hero-stat-num">{counts.critical}</div>
                            <div className="drv-hero-stat-label">Critical</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="drv-toolbar">
                <div className="drv-search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <path d="M21 21l-4.3-4.3"/>
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search name, license, yard…"
                    />
                    {query && (
                        <button className="drv-search-clear" onClick={() => setQuery('')} aria-label="Clear">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M6 6l12 12M6 18L18 6"/>
                            </svg>
                        </button>
                    )}
                </div>
                <div className="drv-chips">
                    {chips.map(c => (
                        <button
                            key={c.key}
                            className={'drv-chip drv-chip--' + c.key + (filter === c.key ? ' is-active' : '')}
                            onClick={() => setFilter(c.key)}
                            type="button"
                        >
                            <span>{c.label}</span>
                            <span className="drv-chip-count">{c.count}</span>
                        </button>
                    ))}
                </div>
                <div className="drv-sort">
                    <label>Sort</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="hos">Hours remaining</option>
                        <option value="name">Name (A–Z)</option>
                    </select>
                </div>
                {['ADMIN', 'DISPATCHER'].includes(getAuth()?.principalType) && (
                    <Link to="/drivers/new" className="drv-new-btn">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        <span>New driver</span>
                    </Link>
                )}
            </div>

            <div ref={gridTopRef} />

            {drivers.length === 0 ? (
                <div className="drv-empty">
                    <div className="drv-empty-icon">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7"/>
                            <path d="M21 21l-4.3-4.3"/>
                        </svg>
                    </div>
                    <div>No drivers match your filters.</div>
                </div>
            ) : (
                <div className="drv-grid">
                    {pageItems.map((d, i) => {
                        const lvl = hosLevel(d.hosRemaining);
                        const statusLabel = lvl === 'critical' ? t('status_critical')
                            : lvl === 'warn' ? t('status_watch')
                                : t('status_available');
                        const duty = dutyMeta(d.dutyStatus);
                        const skills = parseSkills(d.equipmentSkills);
                        const tenure = tenureYears(d.hiredAt);
                        const hosPct = Math.min(100, (d.hosRemaining / MAX_HOS) * 100);
                        return (
                            <button
                                key={d.driverName}
                                type="button"
                                className={'drv-card drv-card--' + lvl}
                                onClick={() => setOpenName(d.driverName)}
                                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                            >
                                <span className="drv-card-glow" aria-hidden="true" />

                                <header className="drv-card-head">
                                    <div className={'drv-avatar-wrap drv-avatar-wrap--' + lvl}>
                                        <Avatar d={d} />
                                        <span className={'drv-status-dot drv-status-dot--' + lvl} />
                                    </div>
                                    <div className="drv-card-id">
                                        <div className="drv-card-name-row">
                                            <span className="drv-card-name">{d.driverName}</span>
                                            <span className={'drv-pill drv-pill--' + lvl}>{statusLabel}</span>
                                        </div>
                                        <div className="drv-card-sub">
                                            {d.licenseNumber ? (
                                                <span className="mono">{d.licenseNumber}</span>
                                            ) : (
                                                <span className="drv-faint">no license on file</span>
                                            )}
                                            {d.homeYard && <><span className="drv-sep">·</span><span>Home {d.homeYard}</span></>}
                                            {tenure && <><span className="drv-sep">·</span><span>{tenure} tenure</span></>}
                                        </div>
                                    </div>
                                </header>

                                {duty && (
                                    <div className={'drv-duty drv-duty--' + duty.tone}>
                                        <span className="drv-duty-badge">
                                            <DutyIcon kind={duty.icon} />
                                            <span>{duty.label.toUpperCase()}</span>
                                        </span>
                                        {d.dutyStatusChangedAt && (
                                            <span className="drv-duty-since">since {formatRelTime(d.dutyStatusChangedAt)}</span>
                                        )}
                                    </div>
                                )}

                                <div className="drv-hos-block">
                                    <HosRing hours={d.hosRemaining} />
                                    <div className="drv-hos-meta">
                                        <div className="drv-hos-meta-label">Hours of service</div>
                                        <div className="drv-hos-bar">
                                            <div
                                                className={'drv-hos-bar-fill drv-hos-bar-fill--' + lvl}
                                                style={{ width: hosPct + '%' }}
                                            />
                                        </div>
                                        <div className="drv-hos-meta-scale">
                                            <span>{d.hosRemaining.toFixed(1)} / {MAX_HOS}h</span>
                                            <span className={'drv-hos-tag drv-hos-tag--' + lvl}>{statusLabel}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="drv-facts">
                                    <div className="drv-fact">
                                        <div className="drv-fact-icon">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
                                                <circle cx="12" cy="10" r="2.5"/>
                                            </svg>
                                        </div>
                                        <div className="drv-fact-body">
                                            <div className="drv-fact-label">Location</div>
                                            <div className="drv-fact-value">{locationDescription(d.latitude, d.longitude)}</div>
                                        </div>
                                    </div>
                                    <div className="drv-fact">
                                        <div className="drv-fact-icon">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z"/>
                                            </svg>
                                        </div>
                                        <div className="drv-fact-body">
                                            <div className="drv-fact-label">Contact</div>
                                            <div className="drv-fact-value">{d.phoneNumber || <span className="drv-faint">—</span>}</div>
                                        </div>
                                    </div>
                                </div>

                                {(skills.length > 0 || d.lastCheckCallAt) && (
                                    <footer className="drv-card-foot">
                                        {skills.length > 0 ? (
                                            <div className="drv-skills">
                                                {skills.map(s => (
                                                    <span key={s} className="drv-skill">{s}</span>
                                                ))}
                                            </div>
                                        ) : <span />}
                                        {d.lastCheckCallAt && (
                                            <span className="drv-checkin">
                                                <span className="drv-checkin-dot" />
                                                check-in {formatRelTime(d.lastCheckCallAt)}
                                            </span>
                                        )}
                                    </footer>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {drivers.length > 0 && (
                <nav className="drv-pager" aria-label="Drivers pagination">
                    <div className="drv-pager-info">
                        Showing <b>{startIdx + 1}</b>–<b>{Math.min(startIdx + pageSize, drivers.length)}</b> of <b>{drivers.length}</b>
                    </div>
                    <div className="drv-pager-nav">
                        <button
                            type="button"
                            className="drv-pager-btn"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>
                        {pageNumbers.map((p, i) => p === '…' ? (
                            <span key={'e' + i} className="drv-pager-ellipsis">…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                className={'drv-pager-num' + (p === currentPage ? ' is-current' : '')}
                                onClick={() => goToPage(p)}
                                aria-current={p === currentPage ? 'page' : undefined}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="drv-pager-btn"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 6l6 6-6 6"/>
                            </svg>
                        </button>
                    </div>
                    <div className="drv-pager-size">
                        <label>Per page</label>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </nav>
            )}

            <DriverDetailDrawer name={openName} onClose={() => setOpenName(null)} />
        </>
    );
}
