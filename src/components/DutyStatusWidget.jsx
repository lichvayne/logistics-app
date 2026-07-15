import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDutyStatus, changeDutyStatus } from '../api.js';

const OPTIONS = [
    { key: 'DRIVING',  label: 'Driving',  cls: 'warn' },
    { key: 'ON_DUTY',  label: 'On Duty',  cls: 'info' },
    { key: 'SLEEPER',  label: 'Sleeper',  cls: 'dim' },
    { key: 'OFF_DUTY', label: 'Off Duty', cls: 'ok' }
];

export default function DutyStatusWidget({ driverName }) {
    const { data, isLoading } = useDutyStatus(driverName);
    const qc = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    if (isLoading) return <div className="duty-widget loading">…</div>;
    if (!data) return null;

    const current = data.dutyStatus || 'OFF_DUTY';
    const change = async (next) => {
        if (next === current || busy) return;
        setBusy(true);
        setErr('');
        try {
            await changeDutyStatus(driverName, next);
            qc.invalidateQueries({ queryKey: ['duty-status', driverName] });
            qc.invalidateQueries({ queryKey: ['me-profile'] });
        } catch (e) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="me-card duty-widget">
            <div className="me-card-label">Duty status</div>
            <div className="duty-current">
                <span className={'pill lg ' + (OPTIONS.find(o => o.key === current)?.cls || 'info')}>
                    {OPTIONS.find(o => o.key === current)?.label || current}
                </span>
                {data.dutyStatusChangedAt && (
                    <span className="dim duty-since">
                        since {new Date(data.dutyStatusChangedAt).toLocaleTimeString()}
                    </span>
                )}
            </div>
            <div className="duty-actions">
                {OPTIONS.map(o => (
                    <button
                        key={o.key}
                        type="button"
                        disabled={busy || o.key === current}
                        onClick={() => change(o.key)}
                        className={'duty-btn ' + (o.key === current ? 'active' : '')}
                    >{o.label}</button>
                ))}
            </div>
            {err && <div className="duty-err">⚠ {err}</div>}
        </section>
    );
}
