import { useMemo } from 'react';
import { formatMoney } from '../format.js';

/**
 * "This week" mini bar chart of earnings per day for the last 7 days,
 * plus deliveries count and average rate. Reads straight from
 * useMyDeliveries — no new endpoint needed.
 */
export default function WeekSnapshot({ deliveries = [] }) {
    const days = useMemo(() => {
        const now = new Date();
        const buckets = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return { date: d, earnings: 0, count: 0 };
        });
        for (const o of deliveries || []) {
            if (o.status !== 'Delivered' || !o.deliveredAt) continue;
            const ts = new Date(o.deliveredAt);
            for (const b of buckets) {
                const next = new Date(b.date);
                next.setDate(b.date.getDate() + 1);
                if (ts >= b.date && ts < next) {
                    b.earnings += o.rate || 0;
                    b.count += 1;
                    break;
                }
            }
        }
        return buckets;
    }, [deliveries]);

    const maxE = Math.max(1, ...days.map(d => d.earnings));
    const totalE = days.reduce((s, d) => s + d.earnings, 0);
    const totalC = days.reduce((s, d) => s + d.count, 0);
    const avg = totalC > 0 ? totalE / totalC : 0;

    const dayLetter = (d) => 'SMTWTFS'[d.getDay()];

    return (
        <section className="me-card week-snapshot">
            <div className="me-card-label">This week</div>

            <div className="week-headline">
                <div>
                    <div className="week-headline-v">{formatMoney(totalE)}</div>
                    <div className="week-headline-l">Earned · {totalC} deliveries</div>
                </div>
                <div>
                    <div className="week-headline-v">{formatMoney(avg)}</div>
                    <div className="week-headline-l">Avg per load</div>
                </div>
            </div>

            <div className="week-bars">
                {days.map((d, i) => {
                    const h = Math.round((d.earnings / maxE) * 90) + 4;
                    const isToday = i === days.length - 1;
                    return (
                        <div key={i} className={'week-bar-col' + (isToday ? ' today' : '')}
                             title={`${d.date.toDateString()}: ${formatMoney(d.earnings)} · ${d.count} loads`}>
                            <div className="week-bar-val">
                                {d.earnings > 0 ? `$${Math.round(d.earnings)}` : ''}
                            </div>
                            <div className="week-bar" style={{ height: h + 'px' }} />
                            <div className="week-bar-lbl">{dayLetter(d.date)}</div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
