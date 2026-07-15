import { useEffect, useMemo, useRef, useState } from 'react';
import { useLoads } from '../api.js';
import { formatMoney, locationDescription } from '../format.js';
import LoadDetailDrawer from '../components/LoadDetailDrawer.jsx';

const PAGE_SIZES = [9, 18, 36];

const EQUIPMENT_META = {
    'reefer':   { tone: 'reefer',  icon: 'snow', label: 'Reefer' },
    'flatbed':  { tone: 'flatbed', icon: 'grid', label: 'Flatbed' },
    'dry van':  { tone: 'dry',     icon: 'box',  label: 'Dry Van' },
    'dryvan':   { tone: 'dry',     icon: 'box',  label: 'Dry Van' },
    'tanker':   { tone: 'tanker',  icon: 'drop', label: 'Tanker' },
    'stepdeck': { tone: 'step',    icon: 'grid', label: 'Stepdeck' },
};

function eqMeta(t) {
    const k = (t || '').toLowerCase().trim();
    return EQUIPMENT_META[k] || { tone: 'dry', icon: 'box', label: t || 'Unknown' };
}

function EqIcon({ kind }) {
    if (kind === 'snow') return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M4.5 7.5l15 9M4.5 16.5l15-9"/>
        </svg>
    );
    if (kind === 'grid') return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="1"/>
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
        </svg>
    );
    if (kind === 'drop') return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3s7 8 7 13a7 7 0 1 1-14 0c0-5 7-13 7-13z"/>
        </svg>
    );
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/>
            <path d="M3 7l9 4 9-4M12 11v10"/>
        </svg>
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

export default function Loads() {
    const { data, isLoading } = useLoads();
    const [equipmentFilter, setEquipmentFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState('rate');
    const [openId, setOpenId] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const gridTopRef = useRef(null);

    const loads = data ?? [];
    const equipmentTypes = useMemo(
        () => Array.from(new Set(loads.map(l => l.equipmentType))).sort(),
        [loads]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return loads
            .filter(l => equipmentFilter === 'all' || l.equipmentType === equipmentFilter)
            .filter(l => !q
                || l.loadId.toLowerCase().includes(q)
                || (l.origin || '').toLowerCase().includes(q)
                || (l.destination || '').toLowerCase().includes(q))
            .sort((a, b) => {
                if (sortBy === 'rate-asc') return a.payoutRate - b.payoutRate;
                if (sortBy === 'drive')    return a.estimatedDriveHours - b.estimatedDriveHours;
                if (sortBy === 'per-hour') return (b.payoutRate / b.estimatedDriveHours) - (a.payoutRate / a.estimatedDriveHours);
                return b.payoutRate - a.payoutRate;
            });
    }, [loads, equipmentFilter, query, sortBy]);

    const totalValue = filtered.reduce((s, l) => s + l.payoutRate, 0);
    const bestRate = filtered.reduce((m, l) => Math.max(m, l.payoutRate), 0);
    const avgPerHour = filtered.length
        ? filtered.reduce((s, l) => s + (l.payoutRate / (l.estimatedDriveHours || 1)), 0) / filtered.length
        : 0;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    useEffect(() => { setPage(1); }, [equipmentFilter, query, sortBy, pageSize]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + pageSize);
    const pageNumbers = buildPageList(currentPage, totalPages);

    const goToPage = (p) => {
        setPage(p);
        if (gridTopRef.current) gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (isLoading) return <div className="loading">Loading…</div>;

    return (
        <>
            <section className="lds-hero">
                <div className="lds-hero-bg" aria-hidden="true">
                    <span className="lds-hero-orb lds-hero-orb-a" />
                    <span className="lds-hero-orb lds-hero-orb-b" />
                </div>
                <div className="lds-hero-inner">
                    <div>
                        <div className="lds-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/>
                                <path d="M12 12l9-5M12 12v10M12 12L3 7"/>
                            </svg>
                            <span>Freight · load board</span>
                        </div>
                        <h1 className="lds-hero-title">Loads</h1>
                        <p className="lds-hero-sub">{loads.length} loads on the board · {equipmentTypes.length} equipment types</p>
                    </div>
                    <div className="lds-hero-stats">
                        <div className="lds-hero-stat">
                            <div className="lds-hero-stat-num">{formatMoney(totalValue)}</div>
                            <div className="lds-hero-stat-label">Filtered value</div>
                        </div>
                        <div className="lds-hero-stat lds-hero-stat--best">
                            <div className="lds-hero-stat-num">{formatMoney(bestRate)}</div>
                            <div className="lds-hero-stat-label">Top rate</div>
                        </div>
                        <div className="lds-hero-stat lds-hero-stat--rate">
                            <div className="lds-hero-stat-num">{formatMoney(avgPerHour)}<span className="lds-hero-stat-unit">/h</span></div>
                            <div className="lds-hero-stat-label">Avg $/hour</div>
                        </div>
                        <div className="lds-hero-stat">
                            <div className="lds-hero-stat-num">{filtered.length}</div>
                            <div className="lds-hero-stat-label">Showing</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="lds-toolbar">
                <div className="lds-search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <path d="M21 21l-4.3-4.3"/>
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search load ID, origin, destination…"
                    />
                    {query && (
                        <button className="lds-search-clear" onClick={() => setQuery('')} aria-label="Clear">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M6 6l12 12M6 18L18 6"/>
                            </svg>
                        </button>
                    )}
                </div>
                <div className="lds-eq-chips">
                    <button
                        type="button"
                        className={'lds-eq-chip' + (equipmentFilter === 'all' ? ' is-active' : '')}
                        onClick={() => setEquipmentFilter('all')}
                    >
                        All <span className="lds-eq-count">{loads.length}</span>
                    </button>
                    {equipmentTypes.map(eq => {
                        const m = eqMeta(eq);
                        const count = loads.filter(l => l.equipmentType === eq).length;
                        return (
                            <button
                                key={eq}
                                type="button"
                                className={'lds-eq-chip lds-eq-chip--' + m.tone + (equipmentFilter === eq ? ' is-active' : '')}
                                onClick={() => setEquipmentFilter(eq)}
                            >
                                <EqIcon kind={m.icon} />
                                <span>{m.label}</span>
                                <span className="lds-eq-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="lds-sort">
                    <label>Sort</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="rate">Rate (high→low)</option>
                        <option value="rate-asc">Rate (low→high)</option>
                        <option value="per-hour">$/hour</option>
                        <option value="drive">Drive time (short→long)</option>
                    </select>
                </div>
            </div>

            <div ref={gridTopRef} />

            {filtered.length === 0 ? (
                <div className="lds-empty">
                    <div className="lds-empty-icon">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                        </svg>
                    </div>
                    <div>No loads match your filters.</div>
                </div>
            ) : (
                <div className="lds-grid">
                    {pageItems.map((l, i) => {
                        const m = eqMeta(l.equipmentType);
                        const perHour = l.payoutRate / (l.estimatedDriveHours || 1);
                        return (
                            <button
                                key={l.loadId}
                                type="button"
                                className={'lds-card lds-card--' + m.tone}
                                onClick={() => setOpenId(l.loadId)}
                                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                            >
                                <div className="lds-card-head">
                                    <div className="lds-card-id">
                                        <span className="lds-card-id-hash">#</span>{l.loadId}
                                    </div>
                                    <span className={'lds-eq-tag lds-eq-tag--' + m.tone}>
                                        <EqIcon kind={m.icon} />
                                        <span>{m.label}</span>
                                    </span>
                                </div>

                                <div className="lds-route">
                                    <div className="lds-route-node">
                                        <span className="lds-route-dot lds-route-dot--start" />
                                        <div>
                                            <div className="lds-route-label">Pickup</div>
                                            <div className="lds-route-city">{l.origin}</div>
                                        </div>
                                    </div>
                                    <div className="lds-route-line">
                                        <span className="lds-route-truck">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 17V7a1 1 0 0 1 1-1h10v11"/>
                                                <path d="M14 10h4l3 4v3h-2"/>
                                                <circle cx="7.5" cy="17.5" r="2"/>
                                                <circle cx="17.5" cy="17.5" r="2"/>
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="lds-route-node lds-route-node--end">
                                        <span className="lds-route-dot lds-route-dot--end" />
                                        <div>
                                            <div className="lds-route-label">Deliver</div>
                                            <div className="lds-route-city">{l.destination}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lds-payout">
                                    <div className="lds-payout-main">
                                        <div className="lds-payout-num">{formatMoney(l.payoutRate)}</div>
                                        <div className="lds-payout-label">Payout</div>
                                    </div>
                                    <div className="lds-payout-side">
                                        <div className="lds-payout-side-item">
                                            <div className="lds-payout-side-num">{l.estimatedDriveHours.toFixed(1)}<span>h</span></div>
                                            <div className="lds-payout-side-label">Drive</div>
                                        </div>
                                        <div className="lds-payout-side-item">
                                            <div className="lds-payout-side-num">{formatMoney(perHour)}<span>/h</span></div>
                                            <div className="lds-payout-side-label">Rate</div>
                                        </div>
                                    </div>
                                </div>

                                {(l.pickupLatitude != null && l.pickupLongitude != null) && (
                                    <div className="lds-pickup">
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
                                            <circle cx="12" cy="10" r="2.5"/>
                                        </svg>
                                        <span>Pickup · {locationDescription(l.pickupLatitude, l.pickupLongitude)}</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {filtered.length > 0 && (
                <nav className="lds-pager" aria-label="Loads pagination">
                    <div className="lds-pager-info">
                        Showing <b>{startIdx + 1}</b>–<b>{Math.min(startIdx + pageSize, filtered.length)}</b> of <b>{filtered.length}</b>
                    </div>
                    <div className="lds-pager-nav">
                        <button type="button" className="lds-pager-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        {pageNumbers.map((p, i) => p === '…' ? (
                            <span key={'e' + i} className="lds-pager-ellipsis">…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                className={'lds-pager-num' + (p === currentPage ? ' is-current' : '')}
                                onClick={() => goToPage(p)}
                                aria-current={p === currentPage ? 'page' : undefined}
                            >{p}</button>
                        ))}
                        <button type="button" className="lds-pager-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                        </button>
                    </div>
                    <div className="lds-pager-size">
                        <label>Per page</label>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </nav>
            )}

            <LoadDetailDrawer id={openId} onClose={() => setOpenId(null)} />
        </>
    );
}
