/**
 * Circular HOS clock — visualizes remaining driving hours out of the
 * federal 11-hour daily limit. Not a full FMCSA-compliant ELD (that would
 * also track 14-hour on-duty window, 30-min break, 60/70-hour rolling limit),
 * but enough of a mental model for a driver to see "how much do I have left today".
 */
export default function HosClock({ hoursRemaining = 0, maxHours = 11 }) {
    const h = Math.max(0, Math.min(hoursRemaining, maxHours));
    const pct = h / maxHours;
    const size = 168;
    const stroke = 14;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = c * pct;

    const level = h > 6 ? 'ok' : h > 2 ? 'warn' : 'critical';
    const label = h > 6 ? 'Plenty of hours' : h > 2 ? 'Watch your clock' : 'Break soon required';

    return (
        <section className="me-card hos-clock-card">
            <div className="me-card-label">Hours of service</div>
            <div className="hos-clock-wrap">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={size/2} cy={size/2} r={r}
                        fill="none" stroke="var(--border)" strokeWidth={stroke}/>
                    <circle cx={size/2} cy={size/2} r={r}
                        fill="none"
                        stroke={`var(--${level})`}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${c}`}
                        transform={`rotate(-90 ${size/2} ${size/2})`}/>
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                        fontFamily="var(--font-serif)"
                        fontSize="34" fill="var(--text)">
                        {h.toFixed(1)}
                    </text>
                    <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle"
                        fontSize="11" fill="var(--text-faint)" letterSpacing="0.08em">
                        HOURS · MAX {maxHours}
                    </text>
                </svg>
            </div>
            <div className={'hos-clock-label ' + level}>{label}</div>
        </section>
    );
}
