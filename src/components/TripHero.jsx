import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { reportArrival, reportDeparture } from '../api.js';
import { formatMoney } from '../format.js';
import PodUploadModal from './PodUploadModal.jsx';

const STATUS_PILL = { Delivered: 'ok', 'In-Transit': 'warn', Scheduled: 'info' };

/**
 * Big-hero "today's trip" card for the driver home page. Shows the current
 * active order (In-Transit preferred, else Scheduled) with the route, key
 * meta, and the arrival/departure/POD actions all in one place.
 */
export default function TripHero({ active }) {
    const qc = useQueryClient();
    const [busy, setBusy] = useState('');
    const [msg, setMsg] = useState('');
    const [podFor, setPodFor] = useState(null);

    if (!active) {
        return (
            <section className="me-card trip-hero empty">
                <div className="me-card-label">Today's trip</div>
                <div className="trip-hero-empty">
                    <div className="trip-hero-empty-icon" aria-hidden="true">🛌</div>
                    <div>
                        <div className="trip-hero-empty-title">No active trip</div>
                        <div className="dim">You're off the road right now. Ask the assistant to find you a load when you're ready.</div>
                    </div>
                </div>
            </section>
        );
    }

    const doStop = async (fn, stopType, label) => {
        setBusy(label); setMsg('');
        try {
            const res = await fn(active.orderId, stopType);
            setMsg(res?.status === 'already_arrived'
                ? `Already checked in at ${stopType.toLowerCase()}.`
                : `${label} recorded${res?.detentionMinutes != null
                    ? ` (${res.detentionMinutes} min${res.flagged ? ' — FLAGGED for detention' : ''})` : ''}.`);
            qc.invalidateQueries({ queryKey: ['me-deliveries'] });
            qc.invalidateQueries({ queryKey: ['me-activity'] });
        } catch (e) { setMsg('⚠ ' + e.message); }
        finally { setBusy(''); }
    };

    return (
        <>
            <section className="me-card trip-hero">
                <div className="trip-hero-head">
                    <div className="me-card-label">Today's trip</div>
                    <span className={'pill ' + (STATUS_PILL[active.status] || 'info')}>{active.status}</span>
                </div>

                <div className="trip-hero-route">
                    <span className="trip-hero-city">{active.origin}</span>
                    <span className="trip-hero-arrow" aria-hidden="true">→</span>
                    <span className="trip-hero-city">{active.destination}</span>
                </div>

                <div className="trip-hero-meta">
                    <span className="mono dim">{active.orderId}</span>
                    <span>{active.equipmentType}</span>
                    <span>Trailer <span className="mono">{active.trailerId || '—'}</span></span>
                    <span className="accent"><b>{formatMoney(active.rate)}</b></span>
                </div>

                <div className="trip-hero-actions">
                    <button className="duty-btn" disabled={!!busy}
                        onClick={() => doStop(reportArrival, 'PICKUP', 'Arrived pickup')}>📍 Arrived pickup</button>
                    <button className="duty-btn" disabled={!!busy}
                        onClick={() => doStop(reportDeparture, 'PICKUP', 'Left pickup')}>🚛 Left pickup</button>
                    <button className="duty-btn" disabled={!!busy}
                        onClick={() => doStop(reportArrival, 'DROPOFF', 'Arrived dropoff')}>📍 Arrived dropoff</button>
                    <button className="duty-btn" disabled={!!busy}
                        onClick={() => doStop(reportDeparture, 'DROPOFF', 'Left dropoff')}>🚛 Left dropoff</button>
                    <button className="btn-primary" onClick={() => setPodFor(active.orderId)}>📸 Upload POD</button>
                </div>

                {msg && <div className="dim trip-hero-msg">{msg}</div>}
            </section>

            {podFor && (
                <PodUploadModal
                    orderId={podFor}
                    onClose={() => setPodFor(null)}
                    onSubmitted={() => {
                        setMsg('POD submitted — order marked Delivered.');
                        qc.invalidateQueries({ queryKey: ['me-deliveries'] });
                        qc.invalidateQueries({ queryKey: ['me-summary'] });
                        qc.invalidateQueries({ queryKey: ['me-activity'] });
                    }}
                />
            )}
        </>
    );
}
