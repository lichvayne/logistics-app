import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DetailDrawer from './DetailDrawer.jsx';
import {
    useDrivers, useOrderNotifications,
    reassignOrder, notifyEta, prioritizeOrder,
    createTrackingLink
} from '../api.js';
import { formatMoney, formatRelTime } from '../format.js';
import { loadImage, LOAD_FALLBACK } from '../assets/images.js';

const STATUS_PILL = { Delivered: 'ok', 'In-Transit': 'warn', Scheduled: 'info' };

export default function OrderDetailDrawer({ order, onClose }) {
    const open = !!order;
    const orderId = order?.orderId;
    const qc = useQueryClient();

    const { data: drivers } = useDrivers();
    const { data: notifications } = useOrderNotifications(orderId);

    const [busy, setBusy] = useState('');
    const [msg, setMsg] = useState('');
    const [pickedDriver, setPickedDriver] = useState('');
    const [etaAt, setEtaAt] = useState('');
    const [recipient, setRecipient] = useState('');
    const [note, setNote] = useState('');
    const [channel, setChannel] = useState('STUB');

    const invalidateAll = () => {
        qc.invalidateQueries({ queryKey: ['orders'] });
        qc.invalidateQueries({ queryKey: ['orders-prioritized'] });
        qc.invalidateQueries({ queryKey: ['order-notifications', orderId] });
        qc.invalidateQueries({ queryKey: ['audit-log'] });
    };

    const doReassign = async () => {
        if (!pickedDriver) return;
        setBusy('reassign'); setMsg('');
        try {
            const res = await reassignOrder(orderId, pickedDriver);
            setMsg(`✅ Reassigned ${orderId}: ${res.previousDriver || '—'} → ${res.newDriver}`);
            invalidateAll();
        } catch (e) { setMsg('⚠ ' + e.message); }
        finally { setBusy(''); }
    };

    const doNotify = async () => {
        setBusy('notify'); setMsg('');
        try {
            const iso = etaAt ? new Date(etaAt).toISOString() : null;
            const res = await notifyEta(orderId, { recipient, etaAt: iso, note, channel });
            setMsg(`✅ Notification #${res.notificationId} logged (${res.channel} · ${res.deliveryStatus})`);
            invalidateAll();
        } catch (e) { setMsg('⚠ ' + e.message); }
        finally { setBusy(''); }
    };

    const doPrioritize = async () => {
        setBusy('prioritize'); setMsg('');
        try {
            const res = await prioritizeOrder(orderId);
            setMsg(`✅ Priority = ${res.priorityScore.toFixed(1)}`);
            invalidateAll();
        } catch (e) { setMsg('⚠ ' + e.message); }
        finally { setBusy(''); }
    };

    return (
        <DetailDrawer open={open} onClose={onClose}
            title={orderId || ''}
            subtitle={order ? `${order.origin} → ${order.destination}` : ''}>
            {!order ? (
                <div className="loading">Loading…</div>
            ) : (
                <>
                    <div className="detail-hero-load">
                        <img
                            className="load-hero-img"
                            src={loadImage(order)}
                            alt={`${order.equipmentType || 'Load'} cargo`}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = LOAD_FALLBACK; }}
                        />
                        <div className="detail-hero-load-body">
                            <div className="me-active-route">
                                <span>{order.origin}</span>
                                <span className="me-arrow">→</span>
                                <span>{order.destination}</span>
                            </div>
                            <div className="detail-payout">{formatMoney(order.rate)}</div>
                        </div>
                    </div>

                    <dl className="detail-kv">
                        <div><dt>Status</dt><dd>
                            <span className={'pill ' + (STATUS_PILL[order.status] || 'info')}>{order.status}</span>
                        </dd></div>
                        <div><dt>Driver</dt><dd className="mono">{order.driverName || '—'}</dd></div>
                        <div><dt>Trailer</dt><dd className="mono">{order.trailerId || '—'}</dd></div>
                        <div><dt>Equipment</dt><dd>{order.equipmentType}</dd></div>
                        <div><dt>Created</dt><dd className="dim">{formatRelTime(order.createdAt)}</dd></div>
                        {order.etaAt && <div><dt>ETA</dt><dd>{new Date(order.etaAt).toLocaleString()}</dd></div>}
                        {order.priorityScore != null && (
                            <div><dt>Priority</dt><dd className="accent">{order.priorityScore.toFixed(1)}</dd></div>
                        )}
                    </dl>

                    <h3 className="detail-section">🔀 Reassign to another driver</h3>
                    <div className="dispatch-row">
                        <select value={pickedDriver} onChange={e => setPickedDriver(e.target.value)}
                            disabled={busy === 'reassign' || order.status === 'Delivered'}>
                            <option value="">Choose driver…</option>
                            {(drivers || []).filter(d => d.driverName !== order.driverName).map(d => (
                                <option key={d.driverName} value={d.driverName}>
                                    {d.driverName} (HOS {d.hosRemaining?.toFixed(1)}h)
                                </option>
                            ))}
                        </select>
                        <button className="btn-primary" onClick={doReassign}
                            disabled={!pickedDriver || busy === 'reassign' || order.status === 'Delivered'}>
                            {busy === 'reassign' ? '…' : 'Reassign'}
                        </button>
                    </div>

                    <h3 className="detail-section">📣 Notify shipper of new ETA</h3>
                    <div className="dispatch-eta-grid">
                        <label>
                            <span className="dim">Recipient</span>
                            <input value={recipient} onChange={e => setRecipient(e.target.value)}
                                placeholder="ops@shipper.com or +15551234567" />
                        </label>
                        <label>
                            <span className="dim">ETA (local time)</span>
                            <input type="datetime-local" value={etaAt} onChange={e => setEtaAt(e.target.value)} />
                        </label>
                        <label>
                            <span className="dim">Channel</span>
                            <select value={channel} onChange={e => setChannel(e.target.value)}>
                                <option value="STUB">Log only (demo)</option>
                                <option value="EMAIL">Email</option>
                                <option value="WHATSAPP">WhatsApp</option>
                                <option value="SMS">SMS</option>
                            </select>
                        </label>
                        <label className="full">
                            <span className="dim">Note</span>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                                placeholder="Delayed 45 min due to weather on I-70" />
                        </label>
                    </div>
                    <button className="btn-primary" onClick={doNotify} disabled={busy === 'notify'}
                        style={{ marginTop: 10 }}>
                        {busy === 'notify' ? '…' : 'Send / log notification'}
                    </button>

                    <h3 className="detail-section">🎯 Priority</h3>
                    <button className="duty-btn" onClick={doPrioritize} disabled={busy === 'prioritize'}>
                        {busy === 'prioritize' ? '…' : 'Recompute priority score'}
                    </button>

                    <h3 className="detail-section">📄 Broker docs</h3>
                    <div className="dispatch-row" style={{ flexWrap: 'wrap' }}>
                        <a className="duty-btn" href={`/v1/tms/orders/${encodeURIComponent(orderId)}/rate-con`}
                           target="_blank" rel="noreferrer">
                            Open rate confirmation
                        </a>
                        <button className="duty-btn" disabled={busy === 'link'}
                            onClick={async () => {
                                setBusy('link'); setMsg('');
                                try {
                                    const res = await createTrackingLink(orderId);
                                    const full = location.origin + res.url;
                                    await navigator.clipboard?.writeText(full).catch(() => {});
                                    setMsg(`🔗 Public link (copied): ${full}`);
                                } catch (e) { setMsg('⚠ ' + e.message); }
                                finally { setBusy(''); }
                            }}>
                            {busy === 'link' ? '…' : 'Create tracking link'}
                        </button>
                    </div>

                    {msg && <div className="dim" style={{ marginTop: 10 }}>{msg}</div>}

                    <h3 className="detail-section">📜 Notifications sent</h3>
                    {(notifications || []).length === 0 ? (
                        <div className="detail-empty">No notifications yet.</div>
                    ) : (
                        <ul className="detail-list">
                            {(notifications || []).map(n => (
                                <li key={n.id}>
                                    <div className="detail-list-main">
                                        <span className="pill neutral">{n.channel}</span>
                                        <b>{n.recipient || '—'}</b>
                                    </div>
                                    <div className="detail-list-meta">
                                        <span>{n.message?.slice(0, 100)}{n.message?.length > 100 ? '…' : ''}</span>
                                        <span className="dim">{formatRelTime(n.createdAt)} · by {n.sentBy}</span>
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
