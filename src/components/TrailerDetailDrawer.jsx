import DetailDrawer from './DetailDrawer.jsx';
import { useTrailerDetail } from '../api.js';
import { trailerImage, TRAILER_FALLBACK } from '../assets/images.js';
import { batteryLevel, formatCoord, formatMoney, formatRelTime, statusPill } from '../format.js';

const STATUS_PILL = { Delivered: 'ok', 'In-Transit': 'warn', Scheduled: 'info' };

export default function TrailerDetailDrawer({ id, onClose }) {
    const open = !!id;
    const { data, isLoading } = useTrailerDetail(id);
    const t = data?.trailer;
    const orders = data?.orders || [];

    return (
        <DetailDrawer open={open} onClose={onClose}
            title={id ? `Trailer ${id}` : ''}
            subtitle={t?.assignedSpot}>
            {isLoading || !t ? (
                <div className="loading">Loading…</div>
            ) : (
                <>
                    <div className="detail-photo">
                        <img
                            src={trailerImage(t)}
                            alt={`Trailer ${t.trailerId}`}
                            onError={(e) => { e.currentTarget.src = TRAILER_FALLBACK; }}
                        />
                        <span className={'pill ' + statusPill(t.status)}>{t.status}</span>
                    </div>

                    <dl className="detail-kv">
                        <div><dt>Trailer ID</dt><dd className="mono">{t.trailerId}</dd></div>
                        <div><dt>Assigned spot</dt><dd>{t.assignedSpot}</dd></div>
                        <div><dt>Status</dt><dd>{t.status}</dd></div>
                        <div><dt>Battery</dt><dd><span className={'battery-pct ' + batteryLevel(t.batteryPercent)}>{t.batteryPercent}%</span></dd></div>
                        <div><dt>Location</dt><dd className="mono">{formatCoord(t.latitude, t.longitude)}</dd></div>
                        <div><dt>Landmark</dt><dd>{t.landmarkHint || '—'}</dd></div>
                    </dl>

                    <a
                        className="btn-primary"
                        style={{textDecoration:'none', display:'inline-block', marginTop:12}}
                        href={`https://www.google.com/maps/search/?api=1&query=${t.latitude},${t.longitude}`}
                        target="_blank" rel="noreferrer"
                    >Open on Google Maps →</a>

                    <h3 className="detail-section">Orders using this trailer</h3>
                    {orders.length === 0 ? (
                        <div className="detail-empty">No orders on record.</div>
                    ) : (
                        <ul className="detail-list">
                            {orders.slice(0, 10).map(o => (
                                <li key={o.orderId}>
                                    <div className="detail-list-main">
                                        <span className="mono dim">{o.orderId}</span>
                                        <b>{o.origin}</b> <span className="dim">→</span> <b>{o.destination}</b>
                                    </div>
                                    <div className="detail-list-meta">
                                        <span className={'pill ' + (STATUS_PILL[o.status] || 'info')}>{o.status || '—'}</span>
                                        <span className="accent">{formatMoney(o.rate)}</span>
                                        <span className="dim">{formatRelTime(o.deliveredAt || o.createdAt)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </DetailDrawer>
    );
}
