import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicTracking } from '../api.js';

const STATUS_PILL = { Delivered: 'ok', 'In-Transit': 'warn', Scheduled: 'info' };

export default function PublicTrack() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const d = await fetchPublicTracking(token);
            setData(d);
            setErr('');
        } catch (e) {
            setErr(e.message);
            setData(null);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        load();
        const iv = setInterval(load, 20000);
        return () => clearInterval(iv);
    }, [token]);

    if (loading) return <div className="track-page"><div className="loading">Loading…</div></div>;
    if (err || !data) return (
        <div className="track-page">
            <div className="track-card">
                <h1>Tracking unavailable</h1>
                <p className="dim">{err || 'This link is expired or invalid.'}</p>
            </div>
        </div>
    );

    const { orderId, origin, destination, equipmentType, status, etaAt, deliveredAt, carrier } = data;

    return (
        <div className="track-page">
            <div className="track-card">
                <div className="track-brand">Logistics APP · Shipment tracking</div>
                <h1>{origin} → {destination}</h1>
                <div className="dim mono">Order {orderId} · {equipmentType}</div>

                <div className="track-status">
                    <span className={'pill lg ' + (STATUS_PILL[status] || 'info')}>{status}</span>
                    {etaAt && <span className="dim">· ETA {new Date(etaAt).toLocaleString()}</span>}
                    {deliveredAt && <span className="dim">· Delivered {new Date(deliveredAt).toLocaleString()}</span>}
                </div>

                {carrier && (
                    <div className="track-carrier">
                        <div className="track-carrier-head">Carrier</div>
                        <div className="track-carrier-body">
                            <div><b>{carrier.driverInitial}</b> {carrier.dutyStatus && <span className="dim">· {carrier.dutyStatus}</span>}</div>
                            {carrier.latitude != null && carrier.longitude != null && (
                                <>
                                    <div className="dim mono">
                                        Last known position: {carrier.latitude.toFixed(3)}, {carrier.longitude.toFixed(3)}
                                    </div>
                                    <iframe
                                        title="Live position"
                                        className="track-map"
                                        src={`https://maps.google.com/maps?q=${carrier.latitude},${carrier.longitude}&z=8&output=embed`}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="track-footer dim">
                    Auto-refreshes every 20s. Contact your broker for questions about this shipment.
                </div>
            </div>
        </div>
    );
}
