/**
 * Company-wide announcements for drivers. Static content for now — a real
 * product would fetch these from an admin-published feed. Keeping the shape
 * driven by a prop so the /me page can swap in a real API later without a
 * component change.
 */
const DEFAULT_ANNOUNCEMENTS = [
    {
        id: 'winter-driving',
        icon: '❄️',
        title: 'Winter driving reminder',
        body: 'Chains required on I-70 through Vail Pass Nov–Apr. Check road status before departing.',
        priority: 'info',
        publishedRel: 'Yesterday'
    },
    {
        id: 'pay-cycle',
        icon: '💵',
        title: 'Pay cycle',
        body: 'Direct deposits process every Friday for the previous Sun–Sat delivery window.',
        priority: 'info',
        publishedRel: '2 days ago'
    },
    {
        id: 'fuel-card',
        icon: '⛽',
        title: 'Fuel card network expanded',
        body: 'Pilot, Flying J, Love\'s, and now TA/Petro all in-network with corporate discount.',
        priority: 'ok',
        publishedRel: 'This week'
    }
];

export default function AnnouncementsCard({ items = DEFAULT_ANNOUNCEMENTS }) {
    return (
        <section className="me-card announcements">
            <div className="me-card-label">Announcements</div>
            <ul className="announcement-list">
                {items.map(a => (
                    <li key={a.id} className={'announcement tone-' + a.priority}>
                        <span className="announcement-icon" aria-hidden="true">{a.icon}</span>
                        <div>
                            <div className="announcement-title">{a.title}</div>
                            <div className="announcement-body">{a.body}</div>
                            <div className="dim announcement-when">{a.publishedRel}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
