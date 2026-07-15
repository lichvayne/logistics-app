import DetailDrawer from './DetailDrawer.jsx';
import { useLoadDetail } from '../api.js';
import { formatCoord, formatMoney } from '../format.js';

export default function LoadDetailDrawer({ id, onClose }) {
    const open = !!id;
    const { data: L, isLoading } = useLoadDetail(id);

    return (
        <DetailDrawer open={open} onClose={onClose}
            title={id || ''}
            subtitle={L ? `${L.origin} → ${L.destination}` : ''}>
            {isLoading || !L ? (
                <div className="loading">Loading…</div>
            ) : (
                <>
                    <div className="detail-hero-load">
                        <div className="me-active-route">
                            <span>{L.origin}</span>
                            <span className="me-arrow">→</span>
                            <span>{L.destination}</span>
                        </div>
                        <div className="detail-payout">{formatMoney(L.payoutRate)}</div>
                    </div>

                    <dl className="detail-kv">
                        <div><dt>Load ID</dt><dd className="mono">{L.loadId}</dd></div>
                        <div><dt>Equipment</dt><dd>{L.equipmentType}</dd></div>
                        <div><dt>Drive hours</dt><dd>{L.estimatedDriveHours}h</dd></div>
                        <div><dt>Pickup</dt><dd className="mono">{formatCoord(L.pickupLatitude, L.pickupLongitude)}</dd></div>
                        <div><dt>Payout</dt><dd className="accent">{formatMoney(L.payoutRate)}</dd></div>
                    </dl>

                    {L.pickupLatitude && L.pickupLongitude && (
                        <div className="msg-map" style={{marginTop:16, maxWidth:'none'}}>
                            <iframe
                                src={`https://maps.google.com/maps?q=${L.pickupLatitude},${L.pickupLongitude}&z=13&output=embed`}
                                title="Pickup location"
                                loading="lazy"
                            />
                            <a
                                className="msg-map-link"
                                href={`https://www.google.com/maps/search/?api=1&query=${L.pickupLatitude},${L.pickupLongitude}`}
                                target="_blank" rel="noreferrer"
                            >Open pickup in Google Maps →</a>
                        </div>
                    )}
                </>
            )}
        </DetailDrawer>
    );
}
