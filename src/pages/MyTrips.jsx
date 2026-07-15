import { useMemo, useState } from 'react';
import { useMyDeliveries } from '../api.js';
import { formatMoney, formatRelTime } from '../format.js';
import { trailerImage, TRAILER_FALLBACK } from '../assets/images.js';
import { useT } from '../i18n.jsx';

const STATUS_META = {
    'Delivered':  { tone: 'done', key: 'delivery_delivered', label: 'Delivered' },
    'In-Transit': { tone: 'move', key: 'delivery_in_transit', label: 'In transit' },
    'Scheduled':  { tone: 'plan', key: 'delivery_scheduled', label: 'Scheduled' },
};

const FILTERS = ['all', 'In-Transit', 'Scheduled', 'Delivered'];

export default function MyTrips() {
    const t = useT();
    const { data: deliveries, isLoading } = useMyDeliveries();
    const [status, setStatus] = useState('all');

    const rows = useMemo(() => {
        const all = deliveries || [];
        return status === 'all' ? all : all.filter(d => d.status === status);
    }, [deliveries, status]);

    const counts = useMemo(() => {
        const all = deliveries || [];
        return {
            all: all.length,
            'In-Transit': all.filter(d => d.status === 'In-Transit').length,
            'Scheduled':  all.filter(d => d.status === 'Scheduled').length,
            'Delivered':  all.filter(d => d.status === 'Delivered').length
        };
    }, [deliveries]);

    const stats = useMemo(() => {
        const all = deliveries || [];
        const delivered = all.filter(d => d.status === 'Delivered');
        return {
            total: all.length,
            earned: delivered.reduce((s, d) => s + (d.rate || 0), 0),
            avgRate: delivered.length ? delivered.reduce((s, d) => s + (d.rate || 0), 0) / delivered.length : 0,
        };
    }, [deliveries]);

    if (isLoading) return <div className="loading">{t('loading')}</div>;

    return (
        <>
            <section className="tr-hero">
                <div className="tr-hero-bg" aria-hidden="true">
                    <span className="tr-hero-orb tr-hero-orb-a" />
                    <span className="tr-hero-orb tr-hero-orb-b" />
                </div>
                <div className="tr-hero-inner">
                    <div>
                        <div className="tr-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 17V7a1 1 0 0 1 1-1h10v11"/><path d="M14 10h4l3 4v3h-2"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>
                            </svg>
                            <span>Driver · trip log</span>
                        </div>
                        <h1 className="tr-hero-title">{t('trips_title')}</h1>
                        <p className="tr-hero-sub">{t('trips_subtitle', deliveries?.length || 0)}</p>
                    </div>
                    <div className="tr-hero-stats">
                        <div className="tr-hero-stat"><div className="tr-hero-stat-num">{stats.total}</div><div className="tr-hero-stat-label">Trips</div></div>
                        <div className="tr-hero-stat tr-hero-stat--money"><div className="tr-hero-stat-num">{formatMoney(stats.earned)}</div><div className="tr-hero-stat-label">Earned</div></div>
                        <div className="tr-hero-stat"><div className="tr-hero-stat-num">{formatMoney(stats.avgRate)}</div><div className="tr-hero-stat-label">Avg rate</div></div>
                    </div>
                </div>
            </section>

            <div className="tr-chips">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        type="button"
                        className={'tr-chip tr-chip--' + f.toLowerCase().replace('-', '') + (status === f ? ' is-active' : '')}
                        onClick={() => setStatus(f)}
                    >
                        <span>{f === 'all' ? t('trips_filter_all') : t(STATUS_META[f]?.key || f)}</span>
                        <span className="tr-chip-count">{counts[f]}</span>
                    </button>
                ))}
            </div>

            {rows.length === 0 ? (
                <div className="tr-empty">{t('trips_empty')}</div>
            ) : (
                <div className="tr-list">
                    {rows.map((d, i) => {
                        const meta = STATUS_META[d.status] || { tone: 'plan', key: d.status, label: d.status };
                        return (
                            <article
                                key={d.orderId}
                                className={'tr-card tr-card--' + meta.tone}
                                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                            >
                                <div className="tr-photo">
                                    {d.trailerId ? (
                                        <img
                                            src={trailerImage(d.trailerId)}
                                            alt={`Trailer ${d.trailerId}`}
                                            loading="lazy"
                                            onError={(e) => { e.currentTarget.src = TRAILER_FALLBACK; }}
                                        />
                                    ) : (
                                        <div className="tr-photo-placeholder">
                                            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="7" width="14" height="9" rx="1"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="tr-body">
                                    <div className="tr-head">
                                        <span className="tr-id mono">{d.orderId}</span>
                                        <span className={'tr-status tr-status--' + meta.tone}>
                                            <span className="tr-status-dot" />
                                            {t(STATUS_META[d.status]?.key || d.status)}
                                        </span>
                                    </div>
                                    <div className="tr-route">
                                        <span className="tr-route-node">
                                            <span className="tr-route-dot tr-route-dot--start" />
                                            <b>{d.origin}</b>
                                        </span>
                                        <span className="tr-route-line" />
                                        <span className="tr-route-node">
                                            <span className="tr-route-dot tr-route-dot--end" />
                                            <b>{d.destination}</b>
                                        </span>
                                    </div>
                                    <div className="tr-foot">
                                        <div className="tr-facts">
                                            <span className="tr-fact"><span>Equip</span>{d.equipmentType}</span>
                                            <span className="tr-fact"><span>Trailer</span><span className="mono">{d.trailerId || '—'}</span></span>
                                            <span className="tr-fact"><span>When</span>{formatRelTime(d.deliveredAt || d.createdAt)}</span>
                                        </div>
                                        <div className="tr-rate">{formatMoney(d.rate)}</div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </>
    );
}
