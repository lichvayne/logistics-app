import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePendingLoads, approvePendingLoad, rejectPendingLoad } from '../api.js';

function relTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1)   return 'just now';
    if (m < 60)  return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24)  return `${h} h ago`;
    const d = Math.round(h / 24);
    return `${d} d ago`;
}

function Field({ label, children }) {
    if (children == null || children === '') return null;
    return (
        <div className="preg-field">
            <div className="preg-field-label">{label}</div>
            <div className="preg-field-val">{children}</div>
        </div>
    );
}

function PendingLoadCard({ item, onDone }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const doApprove = async () => {
        setBusy(true); setErr('');
        try { await approvePendingLoad(item.id, note); onDone(); }
        catch (e) { setErr(e.message); }
        finally { setBusy(false); }
    };
    const doReject = async () => {
        if (!note.trim()) { setErr('Add a short rejection note.'); return; }
        setBusy(true); setErr('');
        try { await rejectPendingLoad(item.id, note); onDone(); }
        catch (e) { setErr(e.message); }
        finally { setBusy(false); }
    };

    return (
        <article className="preg-card">
            <header className="preg-card-head">
                <div>
                    <div className="preg-card-name">{item.origin} → {item.destination}</div>
                    <div className="preg-card-sub">
                        {item.equipmentType} · ${Number(item.payoutRate).toLocaleString()} · {item.estimatedDriveHours} h drive
                    </div>
                </div>
                <div className="preg-card-meta">
                    <span className="preg-badge">#{item.id}</span>
                    <span className="preg-time">{relTime(item.submittedAt)}</span>
                </div>
            </header>

            <div className="preg-grid">
                <Field label="Pickup coordinates">
                    {item.pickupLatitude?.toFixed(4)}, {item.pickupLongitude?.toFixed(4)}
                </Field>
                <Field label="Contact">{item.contactName}</Field>
                <Field label="Phone">{item.contactPhone}</Field>
                <Field label="Email">{item.contactEmail}</Field>
                <Field label="Shipper reference">{item.shipperReference}</Field>
                <Field label="Submitted by">{item.submittedByUsername || <span className="preg-missing">anonymous</span>}</Field>
                {item.notes && (
                    <div className="preg-field" style={{ gridColumn: '1 / -1' }}>
                        <div className="preg-field-label">Notes from submitter</div>
                        <div className="preg-field-val" style={{ whiteSpace: 'pre-wrap' }}>{item.notes}</div>
                    </div>
                )}
            </div>

            <div className="preg-actions">
                <input
                    className="preg-note"
                    placeholder="Notes on your decision (required for rejection)…"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
                <button className="preg-btn preg-btn--reject"  onClick={doReject}  disabled={busy}>Reject</button>
                <button className="preg-btn preg-btn--approve" onClick={doApprove} disabled={busy}>
                    {busy ? '…' : 'Approve → post to board'}
                </button>
            </div>
            {err && <div className="preg-err">{err}</div>}
        </article>
    );
}

export default function PendingLoads() {
    const { data, isLoading, isError } = usePendingLoads();
    const qc = useQueryClient();
    const items = data || [];

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['pending-loads'] });
        qc.invalidateQueries({ queryKey: ['loads'] });
    };

    return (
        <div className="preg-page">
            <header className="preg-head">
                <div>
                    <div className="preg-eyebrow">Broker submissions</div>
                    <h1 className="preg-title">Pending loads</h1>
                    <p className="preg-sub">Brokers submitted these through the AI intake. Review the route, rate, and contact info before posting to the load board.</p>
                </div>
                <div className="preg-count">
                    <div className="preg-count-num">{items.length}</div>
                    <div className="preg-count-label">awaiting review</div>
                </div>
            </header>

            {isLoading && <div className="preg-empty">Loading…</div>}
            {isError   && <div className="preg-empty preg-empty--err">Couldn't load the queue.</div>}
            {!isLoading && items.length === 0 && (
                <div className="preg-empty">
                    <div className="preg-empty-icon">📦</div>
                    <div>No pending loads — nothing to review right now.</div>
                </div>
            )}

            <div className="preg-list">
                {items.map(it => <PendingLoadCard key={it.id} item={it} onDone={invalidate} />)}
            </div>
        </div>
    );
}
