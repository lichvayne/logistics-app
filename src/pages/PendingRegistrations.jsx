import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePendingRegistrations, approvePendingRegistration, rejectPendingRegistration } from '../api.js';

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
    if (children == null || children === '' || (Array.isArray(children) && children.length === 0)) return null;
    return (
        <div className="preg-field">
            <div className="preg-field-label">{label}</div>
            <div className="preg-field-val">{children}</div>
        </div>
    );
}

function PendingCard({ item, onDone }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const skills = (item.equipmentSkills || '').split(',').map(s => s.trim()).filter(Boolean);

    const doApprove = async () => {
        setBusy(true); setErr('');
        try { await approvePendingRegistration(item.id, note); onDone(); }
        catch (e) { setErr(e.message); }
        finally { setBusy(false); }
    };
    const doReject = async () => {
        if (!note.trim()) { setErr('Add a short rejection note so the applicant knows why.'); return; }
        setBusy(true); setErr('');
        try { await rejectPendingRegistration(item.id, note); onDone(); }
        catch (e) { setErr(e.message); }
        finally { setBusy(false); }
    };

    return (
        <article className="preg-card">
            <header className="preg-card-head">
                <div>
                    <div className="preg-card-name">{item.displayName}</div>
                    <div className="preg-card-sub">@{item.username} · driver name <b>{item.driverName}</b></div>
                </div>
                <div className="preg-card-meta">
                    <span className="preg-badge">#{item.id}</span>
                    <span className="preg-time">{relTime(item.submittedAt)}</span>
                </div>
            </header>

            <div className="preg-grid">
                <Field label="Phone">{item.phoneNumber}</Field>
                <Field label="CDL">{item.licenseNumber}</Field>
                <Field label="Personal / employee ID">{item.personalNumber}</Field>
                <Field label="Hire date">{item.hiredAt}</Field>
                <Field label="Home yard">{item.homeYard}</Field>
                <Field label="Coordinates">
                    {item.latitude != null && item.longitude != null ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : null}
                </Field>
                {skills.length > 0 && (
                    <Field label="Equipment">
                        <div className="preg-skills">{skills.map(s => <span key={s} className="preg-skill">{s}</span>)}</div>
                    </Field>
                )}
                <Field label="CDL photo">
                    {item.cdlPhotoUrl ? <a href={item.cdlPhotoUrl} target="_blank" rel="noreferrer">Open →</a> : <span className="preg-missing">not provided</span>}
                </Field>
                <Field label="ID photo">
                    {item.idPhotoUrl ? <a href={item.idPhotoUrl} target="_blank" rel="noreferrer">Open →</a> : <span className="preg-missing">not provided</span>}
                </Field>
            </div>

            <div className="preg-actions">
                <input
                    className="preg-note"
                    placeholder="Notes to the applicant (required for rejection)…"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
                <button className="preg-btn preg-btn--reject" onClick={doReject} disabled={busy}>Reject</button>
                <button className="preg-btn preg-btn--approve" onClick={doApprove} disabled={busy}>
                    {busy ? '…' : 'Approve → create account'}
                </button>
            </div>
            {err && <div className="preg-err">{err}</div>}
        </article>
    );
}

export default function PendingRegistrations() {
    const { data, isLoading, isError } = usePendingRegistrations();
    const qc = useQueryClient();

    const items = data || [];

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['pending-registrations'] });
        qc.invalidateQueries({ queryKey: ['drivers'] });
    };

    return (
        <div className="preg-page">
            <header className="preg-head">
                <div>
                    <div className="preg-eyebrow">Onboarding queue</div>
                    <h1 className="preg-title">Pending driver registrations</h1>
                    <p className="preg-sub">Applicants who went through the AI intake are waiting for you to verify their docs and activate the account.</p>
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
                    <div className="preg-empty-icon">🎉</div>
                    <div>No pending registrations — you're all caught up.</div>
                </div>
            )}

            <div className="preg-list">
                {items.map(it => <PendingCard key={it.id} item={it} onDone={invalidate} />)}
            </div>
        </div>
    );
}
