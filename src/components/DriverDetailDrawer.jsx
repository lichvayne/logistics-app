import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DetailDrawer from './DetailDrawer.jsx';
import { useDriverDetail, useSmsThread } from '../api.js';
import { authFetch } from '../auth.js';
import { driverAvatar } from '../assets/images.js';
import { formatCoord, formatMoney, formatRelTime, hosLevel } from '../format.js';

const STATUS_PILL = { Delivered: 'ok', 'In-Transit': 'warn', Scheduled: 'info' };

export default function DriverDetailDrawer({ name, onClose }) {
    const open = !!name;
    const { data, isLoading } = useDriverDetail(name);
    const d = data?.driver;
    const orders = data?.orders || [];
    const totals = data?.totals || {};

    const [waText, setWaText] = useState('');
    const [waSending, setWaSending] = useState(false);
    const [waError, setWaError] = useState('');
    const threadEndRef = useRef(null);
    const qc = useQueryClient();
    const { data: thread } = useSmsThread(name);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thread]);

    const sendWhatsApp = async (e) => {
        e.preventDefault();
        if (!waText.trim() || !d?.phoneNumber) return;
        setWaSending(true);
        setWaError('');
        try {
            const res = await authFetch('/v1/sms/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: d.phoneNumber, text: waText.trim() })
            });
            if (res.ok) {
                setWaText('');
                qc.invalidateQueries({ queryKey: ['sms-thread', name] });
            } else {
                const j = await res.json();
                setWaError('❌ ' + (j.error || `HTTP ${res.status}`));
            }
        } catch (err) {
            setWaError('❌ ' + err.message);
        } finally {
            setWaSending(false);
        }
    };

    const DIR_LABEL = {
        IN: { cls: 'in', label: (m) => m.senderName || 'Driver' },
        OUT_HUMAN: { cls: 'out human', label: (m) => `${m.senderName || 'You'} (dispatcher)` },
        OUT_AGENT: { cls: 'out agent', label: () => 'AI Agent' }
    };

    return (
        <DetailDrawer open={open} onClose={onClose}
            title={name || ''}
            subtitle={d?.homeYard ? `Home yard · ${d.homeYard}` : ''}>
            {isLoading || !d ? (
                <div className="loading">Loading…</div>
            ) : (
                <>
                    <section className="detail-hero">
                        <img className="me-avatar" src={driverAvatar(d, 128)} alt={d.driverName}/>
                        <div>
                            <div className="detail-name">{d.driverName}</div>
                            <div className="detail-role">Driver</div>
                        </div>
                    </section>

                    <dl className="detail-kv">
                        <div><dt>HOS remaining</dt><dd><span className={'hos-value ' + hosLevel(d.hosRemaining)}>{d.hosRemaining?.toFixed(1)}h</span></dd></div>
                        <div><dt>Location</dt><dd className="mono">{formatCoord(d.latitude, d.longitude)}</dd></div>
                        <div><dt>Personal number</dt><dd className="mono">{d.personalNumber || '—'}</dd></div>
                        <div><dt>License</dt><dd className="mono">{d.licenseNumber || '—'}</dd></div>
                        <div><dt>Phone</dt><dd className="mono">{d.phoneNumber || '—'}</dd></div>
                        <div><dt>Hired</dt><dd>{d.hiredAt || '—'}</dd></div>
                    </dl>

                    <div className="detail-stats">
                        <div><div className="stat-v">{totals.delivered ?? 0}</div><div className="stat-l">Delivered</div></div>
                        <div><div className="stat-v">{totals.inTransit ?? 0}</div><div className="stat-l">In-Transit</div></div>
                        <div><div className="stat-v">{totals.scheduled ?? 0}</div><div className="stat-l">Scheduled</div></div>
                    </div>

                    {d.phoneNumber && (
                        <>
                            <h3 className="detail-section">💬 WhatsApp conversation</h3>
                            <div className="wa-thread">
                                {(thread || []).length === 0 ? (
                                    <div className="detail-empty">No messages yet. Start below.</div>
                                ) : (
                                    (thread || []).map(m => {
                                        const meta = DIR_LABEL[m.direction] || DIR_LABEL.IN;
                                        return (
                                            <div key={m.id} className={'wa-bubble ' + meta.cls}>
                                                <div className="wa-bubble-role">{meta.label(m)}</div>
                                                <div className="wa-bubble-text">{m.text}</div>
                                                <div className="wa-bubble-time">{formatRelTime(m.createdAt)}</div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={threadEndRef} />
                            </div>
                            <form onSubmit={sendWhatsApp} className="wa-input-row">
                                <input
                                    type="text"
                                    value={waText}
                                    onChange={e => setWaText(e.target.value)}
                                    placeholder={`Reply to ${d.driverName} on WhatsApp…`}
                                    disabled={waSending}
                                />
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={!waText.trim() || waSending}
                                >{waSending ? '…' : 'Send'}</button>
                            </form>
                            {waError && <div className="sms-hint" style={{marginTop:6}}>{waError}</div>}
                        </>
                    )}

                    <h3 className="detail-section">Recent orders</h3>
                    {orders.length === 0 ? (
                        <div className="detail-empty">No orders yet.</div>
                    ) : (
                        <ul className="detail-list">
                            {orders.slice(0, 12).map(o => (
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
