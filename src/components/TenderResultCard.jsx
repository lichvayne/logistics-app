import { formatMoney } from '../format.js';

function fmtNum(n, digits = 0) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return Number(n).toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

function fmtRate(n) {
    if (n == null) return '—';
    return `$${Number(n).toFixed(2)}/mi`;
}

function toneFor(action) {
    if (action === 'ACCEPT') return 'ok';
    if (action === 'REJECT') return 'critical';
    return 'warn';
}

export default function TenderResultCard({ result }) {
    if (!result) return null;
    const load = result.load || {};
    const margin = result.margin || {};
    const rec = result.recommendation || {};
    const warnings = result.warnings || [];
    const tone = toneFor(rec.action);
    const conf = Math.round((result.confidence || 0) * 100);
    const src = result.source || 'gemini';

    return (
        <article className={`tp-result tp-result--${tone}`}>
            <header className="tp-result-head">
                <div className="tp-result-head-left">
                    <span className={`tp-recbadge tp-recbadge--${tone}`}>
                        <span className="tp-recbadge-dot" />
                        {rec.action || 'REVIEW'}
                    </span>
                    <div>
                        <div className="tp-result-summary">{result.summary || 'Extracted tender'}</div>
                        <div className="tp-result-reason">{rec.reason || ''}</div>
                    </div>
                </div>
                <div className="tp-result-meta">
                    <div><span>Confidence</span><b>{conf}%</b></div>
                    <div><span>Source</span><b className={src === 'mock' ? 'tp-src-mock' : 'tp-src-live'}>{src === 'mock' ? 'mock' : 'Gemini'}</b></div>
                </div>
            </header>

            <div className="tp-result-body">
                <section className="tp-block">
                    <h4>Load</h4>
                    <div className="tp-kv">
                        <div><dt>Broker</dt><dd>{load.brokerName || '—'}</dd></div>
                        <div><dt>Reference</dt><dd className="mono">{load.referenceNumber || '—'}</dd></div>
                        <div><dt>Origin</dt><dd>{load.originCity || '—'}{load.originState ? `, ${load.originState}` : ''}</dd></div>
                        <div><dt>Destination</dt><dd>{load.destinationCity || '—'}{load.destinationState ? `, ${load.destinationState}` : ''}</dd></div>
                        <div><dt>Pickup</dt><dd>{load.pickupDate || '—'}</dd></div>
                        <div><dt>Delivery</dt><dd>{load.deliveryDate || '—'}</dd></div>
                        <div><dt>Equipment</dt><dd>{(load.equipment || '—').replace('_', ' ')}</dd></div>
                        <div><dt>Weight</dt><dd>{load.weightPounds ? `${fmtNum(load.weightPounds)} lbs` : '—'}</dd></div>
                        <div><dt>Commodity</dt><dd>{load.commodity || '—'}</dd></div>
                        <div><dt>Contact</dt><dd>{load.brokerContact || '—'}</dd></div>
                    </div>
                </section>

                <section className="tp-block tp-block--money">
                    <h4>Rate &amp; margin</h4>
                    <div className="tp-money">
                        <div className="tp-money-row tp-money-row--top">
                            <span>Line-haul rate</span>
                            <b>{formatMoney(load.rateUsd)}</b>
                        </div>
                        <div className="tp-money-row">
                            <span>Est. miles</span>
                            <b>{fmtNum(load.milesEstimated)}</b>
                        </div>
                        <div className="tp-money-row">
                            <span>Rate / mile</span>
                            <b>{fmtRate(load.ratePerMile)}</b>
                        </div>
                        <div className="tp-money-sep" />
                        <div className="tp-money-row"><span>− Fuel</span><b>{formatMoney(margin.estimatedFuelUsd)}</b></div>
                        <div className="tp-money-row"><span>− Deadhead ({fmtNum(margin.estimatedDeadheadMiles)} mi)</span><b>{formatMoney(margin.estimatedDeadheadCost)}</b></div>
                        <div className="tp-money-row"><span>− Driver pay</span><b>{formatMoney(margin.estimatedDriverPay)}</b></div>
                        <div className="tp-money-sep" />
                        <div className="tp-money-row tp-money-row--net">
                            <span>Est. net</span>
                            <b>{formatMoney(margin.estimatedNetUsd)}</b>
                        </div>
                        <div className="tp-money-row tp-money-row--margin">
                            <span>Margin</span>
                            <b className={`tp-margin tp-margin--${tone}`}>
                                {margin.marginPercent != null ? `${Number(margin.marginPercent).toFixed(1)}%` : '—'}
                            </b>
                        </div>
                        {rec.counterRateUsd != null && (
                            <div className="tp-money-row tp-money-row--counter">
                                <span>Suggested counter</span>
                                <b>{formatMoney(rec.counterRateUsd)}</b>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {load.specialInstructions && (
                <section className="tp-notes">
                    <span className="tp-notes-label">Special instructions</span>
                    <div>{load.specialInstructions}</div>
                </section>
            )}

            {warnings.length > 0 && (
                <ul className="tp-warnings">
                    {warnings.map((w, i) => (
                        <li key={i}>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/>
                            </svg>
                            {w}
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
