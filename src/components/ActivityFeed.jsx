import { useMyActivity } from '../api.js';
import { formatRelTime } from '../format.js';

const ACTION_ICON = {
    BOOK_ORDER:          { icon: '📦', tone: 'ok',   label: 'Booked order' },
    SUBMIT_POD:          { icon: '✅', tone: 'ok',   label: 'POD submitted' },
    DUTY_STATUS_CHANGE:  { icon: '🕘', tone: 'info', label: 'Duty status' },
    ARRIVE_PICKUP:       { icon: '📍', tone: 'info', label: 'Arrived pickup' },
    ARRIVE_DROPOFF:      { icon: '📍', tone: 'info', label: 'Arrived dropoff' },
    DEPART_PICKUP:       { icon: '🚛', tone: 'info', label: 'Left pickup' },
    DEPART_DROPOFF:      { icon: '🚛', tone: 'info', label: 'Left dropoff' },
    REPORT_INCIDENT:     { icon: '⚠️', tone: 'warn', label: 'Reported incident' },
    RESOLVE_INCIDENT:    { icon: '✔️', tone: 'ok',   label: 'Incident resolved' },
    DISPATCHER_REPLY:    { icon: '💬', tone: 'info', label: 'Dispatcher reply' },
    REASSIGN_ORDER:      { icon: '🔀', tone: 'warn', label: 'Order reassigned' },
    NOTIFY_ETA:          { icon: '📣', tone: 'info', label: 'ETA notice' },
    CREATE_TRACKING_LINK:{ icon: '🔗', tone: 'info', label: 'Tracking link' },
    ISSUE_INVOICE:       { icon: '🧾', tone: 'ok',   label: 'Invoice issued' }
};

function summarize(entry) {
    const meta = ACTION_ICON[entry.action] || { icon: '•', tone: 'info', label: entry.action };
    let detail = '';
    if (entry.action === 'DUTY_STATUS_CHANGE' && entry.afterJson) {
        try {
            const after = JSON.parse(entry.afterJson);
            detail = `→ ${after.dutyStatus}`;
        } catch {}
    } else if (entry.targetType === 'TmsOrder' && entry.targetId) {
        detail = entry.targetId;
    } else if (entry.targetType === 'Incident' && entry.targetId) {
        detail = `#${entry.targetId}`;
    } else if (entry.targetType === 'Driver' && entry.targetId) {
        detail = entry.targetId;
    }
    return { ...meta, detail };
}

export default function ActivityFeed() {
    const { data, isLoading } = useMyActivity();
    const rows = data || [];

    return (
        <section className="me-card activity-feed">
            <div className="me-card-label">Recent activity</div>
            {isLoading ? (
                <div className="dim">Loading…</div>
            ) : rows.length === 0 ? (
                <div className="me-empty">Nothing yet — start a load or change your duty status.</div>
            ) : (
                <ul className="activity-list">
                    {rows.slice(0, 12).map(e => {
                        const s = summarize(e);
                        return (
                            <li key={e.id} className={'activity-item tone-' + s.tone}>
                                <span className="activity-icon" aria-hidden="true">{s.icon}</span>
                                <div className="activity-body">
                                    <div className="activity-title">
                                        {s.label}
                                        {s.detail && <span className="mono dim"> · {s.detail}</span>}
                                    </div>
                                    <div className="activity-when">{formatRelTime(e.createdAt)} · by {e.actor}</div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
