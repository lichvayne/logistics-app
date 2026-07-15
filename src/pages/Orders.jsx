import { useEffect, useMemo, useRef, useState } from 'react';
import { useOrders, usePrioritizedOrders } from '../api.js';
import { formatMoney, formatRelTime } from '../format.js';
import OrderDetailDrawer from '../components/OrderDetailDrawer.jsx';
import { loadImage, LOAD_FALLBACK } from '../assets/images.js';

const PAGE_SIZES = [9, 18, 36];

const STATUS_META = {
    'delivered':  { tone: 'done',  label: 'Delivered' },
    'in-transit': { tone: 'move',  label: 'In Transit' },
    'scheduled':  { tone: 'plan',  label: 'Scheduled' },
    'cancelled':  { tone: 'dead',  label: 'Cancelled' },
};

function statusMeta(s) {
    const k = (s || '').toLowerCase();
    return STATUS_META[k] || { tone: 'plan', label: s || 'Unknown' };
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

export default function Orders() {
    const { data, isLoading } = useOrders();
    const { data: prioritized } = usePrioritizedOrders();
    const [selected, setSelected] = useState(null);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const gridTopRef = useRef(null);

    const orders = data ?? [];
    const scoreByOrder = useMemo(() => {
        const map = {};
        (prioritized || []).forEach(o => { map[o.orderId] = o.priorityScore; });
        return map;
    }, [prioritized]);

    const stats = useMemo(() => {
        const s = { total: orders.length, done: 0, move: 0, plan: 0, value: 0 };
        for (const o of orders) {
            const k = (o.status || '').toLowerCase();
            if (k === 'delivered')      s.done++;
            else if (k === 'in-transit') s.move++;
            else if (k === 'scheduled')  s.plan++;
            s.value += o.rate || 0;
        }
        return s;
    }, [orders]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return orders
            .filter(o => statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter)
            .filter(o => !q
                || o.orderId.toLowerCase().includes(q)
                || (o.origin || '').toLowerCase().includes(q)
                || (o.destination || '').toLowerCase().includes(q)
                || (o.driverName || '').toLowerCase().includes(q))
            .sort((a, b) => {
                if (sortBy === 'rate')     return b.rate - a.rate;
                if (sortBy === 'priority') {
                    const sa = a.priorityScore ?? scoreByOrder[a.orderId] ?? -1;
                    const sb = b.priorityScore ?? scoreByOrder[b.orderId] ?? -1;
                    return sb - sa;
                }
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }, [orders, statusFilter, query, sortBy, scoreByOrder]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    useEffect(() => { setPage(1); }, [statusFilter, query, sortBy, pageSize]);
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

    const statusChips = [
        { key: 'all',        label: 'All' },
        { key: 'scheduled',  label: 'Scheduled' },
        { key: 'in-transit', label: 'In transit' },
        { key: 'delivered',  label: 'Delivered' },
    ];

    return (
        <>
            <section className="ord-hero">
                <div className="ord-hero-bg" aria-hidden="true">
                    <span className="ord-hero-orb ord-hero-orb-a" />
                    <span className="ord-hero-orb ord-hero-orb-b" />
                </div>
                <div className="ord-hero-inner">
                    <div>
                        <div className="ord-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 7h16M4 12h16M4 17h10"/>
                            </svg>
                            <span>TMS · orders</span>
                        </div>
                        <h1 className="ord-hero-title">Orders</h1>
                        <p className="ord-hero-sub">{orders.length} recent TMS orders · {(prioritized || []).length} in priority queue</p>
                    </div>
                    <div className="ord-hero-stats">
                        <div className="ord-hero-stat"><div className="ord-hero-stat-num">{stats.total}</div><div className="ord-hero-stat-label">Total</div></div>
                        <div className="ord-hero-stat ord-hero-stat--plan"><div className="ord-hero-stat-num">{stats.plan}</div><div className="ord-hero-stat-label">Scheduled</div></div>
                        <div className="ord-hero-stat ord-hero-stat--move"><div className="ord-hero-stat-num">{stats.move}</div><div className="ord-hero-stat-label">In transit</div></div>
                        <div className="ord-hero-stat ord-hero-stat--done"><div className="ord-hero-stat-num">{stats.done}</div><div className="ord-hero-stat-label">Delivered</div></div>
                        <div className="ord-hero-stat ord-hero-stat--value"><div className="ord-hero-stat-num">{formatMoney(stats.value)}</div><div className="ord-hero-stat-label">Book value</div></div>
                    </div>
                </div>
            </section>

            <div className="ord-toolbar">
                <div className="ord-search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search order ID, driver, city…"
                    />
                    {query && (
                        <button className="ord-search-clear" onClick={() => setQuery('')} aria-label="Clear">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
                        </button>
                    )}
                </div>
                <div className="ord-status-chips">
                    {statusChips.map(sc => (
                        <button
                            key={sc.key}
                            type="button"
                            className={'ord-status-chip ord-status-chip--' + sc.key + (statusFilter === sc.key ? ' is-active' : '')}
                            onClick={() => setStatusFilter(sc.key)}
                        >{sc.label}</button>
                    ))}
                </div>
                <div className="ord-sort">
                    <label>Sort</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="recent">Most recent</option>
                        <option value="rate">Rate (high→low)</option>
                        <option value="priority">Priority score</option>
                    </select>
                </div>
            </div>

            <div ref={gridTopRef} />

            {filtered.length === 0 ? (
                <div className="ord-empty">No orders match your filters.</div>
            ) : (
                <div className="ord-grid">
                    {pageItems.map((o, i) => {
                        const meta = statusMeta(o.status);
                        const score = o.priorityScore ?? scoreByOrder[o.orderId];
                        const hasScore = score != null;
                        return (
                            <button
                                key={o.orderId}
                                type="button"
                                className={'ord-card ord-card--' + meta.tone}
                                onClick={() => setSelected(o)}
                                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                            >
                                <div className="ord-card-media">
                                    <img
                                        src={loadImage(o)}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.src = LOAD_FALLBACK; }}
                                    />
                                    <span className="ord-card-media-shade" aria-hidden="true" />
                                    <span className={'ord-status-badge ord-status-badge--' + meta.tone}>
                                        <span className="ord-status-badge-dot" />
                                        {meta.label}
                                    </span>
                                    <div className="ord-card-id">
                                        <span className="ord-card-id-hash">#</span>{o.orderId}
                                    </div>
                                    {hasScore && (
                                        <div className="ord-priority" title="Priority score">
                                            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2l2.4 6.9L22 10l-6.2 4.4L18 22l-6-4-6 4 2.2-7.6L2 10l7.6-1.1L12 2z"/></svg>
                                            <span>{score.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="ord-card-body">
                                    <div className="ord-route">
                                        <span className="ord-route-city">{o.origin}</span>
                                        <span className="ord-route-arrow">→</span>
                                        <span className="ord-route-city">{o.destination}</span>
                                    </div>

                                    <div className="ord-facts">
                                        <div className="ord-fact">
                                            <span className="ord-fact-label">Driver</span>
                                            <span className="ord-fact-value">{o.driverName || <em className="ord-faint">unassigned</em>}</span>
                                        </div>
                                        <div className="ord-fact">
                                            <span className="ord-fact-label">Equipment</span>
                                            <span className="ord-fact-value">{o.equipmentType || '—'}</span>
                                        </div>
                                    </div>

                                    <div className="ord-card-foot">
                                        <div className="ord-rate">
                                            <span className="ord-rate-num">{formatMoney(o.rate)}</span>
                                            <span className="ord-rate-label">rate</span>
                                        </div>
                                        <span className="ord-time">{formatRelTime(o.createdAt)}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {filtered.length > 0 && (
                <nav className="ord-pager" aria-label="Orders pagination">
                    <div className="ord-pager-info">
                        Showing <b>{startIdx + 1}</b>–<b>{Math.min(startIdx + pageSize, filtered.length)}</b> of <b>{filtered.length}</b>
                    </div>
                    <div className="ord-pager-nav">
                        <button type="button" className="ord-pager-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        {pageNumbers.map((p, i) => p === '…' ? (
                            <span key={'e' + i} className="ord-pager-ellipsis">…</span>
                        ) : (
                            <button key={p} type="button" className={'ord-pager-num' + (p === currentPage ? ' is-current' : '')} onClick={() => goToPage(p)} aria-current={p === currentPage ? 'page' : undefined}>{p}</button>
                        ))}
                        <button type="button" className="ord-pager-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                        </button>
                    </div>
                    <div className="ord-pager-size">
                        <label>Per page</label>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </nav>
            )}

            <OrderDetailDrawer order={selected} onClose={() => setSelected(null)} />
        </>
    );
}
