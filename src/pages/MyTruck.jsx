import { useMemo } from 'react';
import { useMyDeliveries, useTrailerDetail } from '../api.js';
import { batteryLevel, formatRelTime, locationDescription } from '../format.js';
import { trailerImage, truckImage, TRAILER_FALLBACK } from '../assets/images.js';
import { useT } from '../i18n.jsx';

function addDays(dateStr, days) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function BatteryRing({ pct }) {
    const lvl = batteryLevel(pct);
    const R = 34;
    const C = 2 * Math.PI * R;
    const p = Math.max(0.02, Math.min(1, (pct ?? 0) / 100));
    return (
        <div className={'mt-batt-ring mt-batt-ring--' + lvl}>
            <svg viewBox="0 0 84 84" width="84" height="84">
                <circle cx="42" cy="42" r={R} className="mt-batt-track" />
                <circle
                    cx="42" cy="42" r={R}
                    className="mt-batt-fill"
                    strokeDasharray={`${C * p} ${C}`}
                    transform="rotate(-90 42 42)"
                />
            </svg>
            <div className="mt-batt-num">
                <span>{pct ?? 0}</span>
                <span className="mt-batt-unit">%</span>
            </div>
        </div>
    );
}

export default function MyTruck() {
    const t = useT();
    const { data: deliveries, isLoading: dl } = useMyDeliveries();

    const currentTrailerId = useMemo(() => {
        const list = deliveries || [];
        const active = list.find(x => x.status === 'In-Transit')
            || list.find(x => x.status === 'Scheduled')
            || list.find(x => x.trailerId);
        return active?.trailerId || null;
    }, [deliveries]);

    const { data: detail, isLoading: tl } = useTrailerDetail(currentTrailerId);
    const trailer = detail?.trailer;
    const orders = detail?.orders || [];

    if (dl || tl) return <div className="loading">{t('loading')}</div>;

    if (!currentTrailerId || !trailer) {
        return (
            <>
                <section className="mt-hero">
                    <div className="mt-hero-bg" aria-hidden="true">
                        <span className="mt-hero-orb mt-hero-orb-a" />
                        <span className="mt-hero-orb mt-hero-orb-b" />
                    </div>
                    <div className="mt-hero-inner">
                        <div>
                            <div className="mt-hero-eyebrow">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17V7a1 1 0 0 1 1-1h10v11"/><path d="M14 10h4l3 4v3h-2"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>
                                <span>Equipment · assignment</span>
                            </div>
                            <h1 className="mt-hero-title">{t('truck_title')}</h1>
                            <p className="mt-hero-sub">{t('truck_subtitle')}</p>
                        </div>
                    </div>
                </section>
                <div className="mt-none">
                    <img className="mt-none-img" src={TRAILER_FALLBACK} alt="No trailer" />
                    <div className="mt-none-title">{t('truck_none_title')}</div>
                    <div className="mt-none-sub">{t('truck_none_sub')}</div>
                </div>
            </>
        );
    }

    const bl = batteryLevel(trailer.batteryPercent);
    const today = new Date();
    const lastService = new Date(today);
    lastService.setDate(today.getDate() - 45);
    const nextService = addDays(today.toISOString(), 45);

    return (
        <>
            <section className="mt-hero">
                <div className="mt-hero-bg" aria-hidden="true">
                    <span className="mt-hero-orb mt-hero-orb-a" />
                    <span className="mt-hero-orb mt-hero-orb-b" />
                    <span className="mt-hero-grid" />
                </div>
                <div className="mt-hero-inner">
                    <div>
                        <div className="mt-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17V7a1 1 0 0 1 1-1h10v11"/><path d="M14 10h4l3 4v3h-2"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>
                            <span>Equipment · your rig</span>
                        </div>
                        <h1 className="mt-hero-title">
                            <span className="mt-hero-hash">#</span>{trailer.trailerId}
                        </h1>
                        <p className="mt-hero-sub">Assigned to <b>{trailer.assignedSpot}</b> · currently <b>{trailer.status}</b></p>
                    </div>
                    <a
                        className="mt-hero-cta"
                        href={`https://www.google.com/maps/search/?api=1&query=${trailer.latitude},${trailer.longitude}`}
                        target="_blank" rel="noreferrer"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
                        {t('truck_open_maps')}
                    </a>
                </div>
            </section>

            <div className="mt-shell">
                <div className="mt-photos">
                    <div className="mt-photo mt-photo--cab">
                        <img src={truckImage(trailer)} alt="Tractor" loading="lazy" onError={(e) => { e.currentTarget.src = TRAILER_FALLBACK; }} />
                        <span className="mt-photo-shade" aria-hidden="true" />
                        <span className={'mt-photo-tag mt-photo-tag--' + (trailer.status || '').toLowerCase().replace(/[^a-z]/g, '')}>Cab · {trailer.status}</span>
                    </div>
                    <div className="mt-photo mt-photo--trailer">
                        <img src={trailerImage(trailer)} alt={`Trailer ${trailer.trailerId}`} loading="lazy" onError={(e) => { e.currentTarget.src = TRAILER_FALLBACK; }} />
                        <span className="mt-photo-shade" aria-hidden="true" />
                        <span className="mt-photo-tag">Trailer · {trailer.trailerId}</span>
                    </div>
                </div>

                <div className="mt-sidebar">
                    <div className="mt-batt-card">
                        <BatteryRing pct={trailer.batteryPercent} />
                        <div className="mt-batt-body">
                            <div className="mt-batt-label">Tracker battery</div>
                            <div className={'mt-batt-tag mt-batt-tag--' + bl}>
                                {bl === 'critical' ? 'Critical — swap soon' : bl === 'warn' ? 'Low' : 'Healthy'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-facts">
                        <div className="mt-fact">
                            <div className="mt-fact-label">Location</div>
                            <div className="mt-fact-value">{locationDescription(trailer.latitude, trailer.longitude)}</div>
                        </div>
                        <div className="mt-fact">
                            <div className="mt-fact-label">Landmark</div>
                            <div className="mt-fact-value">{trailer.landmarkHint || <em className="mt-faint">—</em>}</div>
                        </div>
                        <div className="mt-fact">
                            <div className="mt-fact-label">Last service</div>
                            <div className="mt-fact-value">{lastService.toISOString().slice(0, 10)}</div>
                        </div>
                        <div className="mt-fact">
                            <div className="mt-fact-label">Next service</div>
                            <div className="mt-fact-value">{nextService}</div>
                        </div>
                    </div>
                </div>
            </div>

            {orders.length > 0 && (
                <section className="mt-history">
                    <header className="mt-history-head">
                        <h2 className="mt-history-title">{t('me_history')}</h2>
                        <span className="mt-history-count">{t('me_count', orders.length)}</span>
                    </header>
                    <div className="mt-history-list">
                        {orders.slice(0, 12).map((o, i) => (
                            <div key={o.orderId} className="mt-history-row" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                                <span className="mono mt-history-id">{o.orderId}</span>
                                <span className="mt-history-route">
                                    <b>{o.origin}</b>
                                    <span className="mt-history-arrow">→</span>
                                    <b>{o.destination}</b>
                                </span>
                                <span className="mt-history-status">{o.status || '—'}</span>
                                <span className="mt-history-time">{formatRelTime(o.deliveredAt || o.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}
