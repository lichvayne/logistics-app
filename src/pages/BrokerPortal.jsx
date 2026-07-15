import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authFetch } from '../auth.js';
import { useBrokerOrders, parseTenderApi } from '../api.js';
import { formatMoney, formatRelTime } from '../format.js';
import TenderResultCard from '../components/TenderResultCard.jsx';

const SAMPLES = [
    {
        label: 'Reefer to Batumi',
        icon: 'snow',
        text: `RATE CONFIRMATION
Broker: BlackSea Logistics LLC
PU Location: Tbilisi warehouse
Drop Location: Batumi cold-storage dock
Equipment: Reefer
Total Rate: $1,650
Pickup: today, drop by tomorrow 08:00`,
    },
    {
        label: 'Flatbed with hazmat',
        icon: 'alert',
        text: `Load Tender
Origin: Rustavi Metallurgical
Destination: Marneuli
Trailer type: Flatbed
Payout: 340 USD
Notes: hazmat placards required`,
    },
    {
        label: 'Dry Van short haul',
        icon: 'box',
        text: `PU Zip: Kutaisi 4600
Drop Location: Poti Port
Trailer: Dry Van
Total Rate: 880`,
    },
];

const STATUS_META = {
    'Delivered':  { tone: 'done', label: 'Delivered' },
    'In-Transit': { tone: 'move', label: 'In transit' },
    'Scheduled':  { tone: 'plan', label: 'Scheduled' },
};

function SampleIcon({ kind }) {
    if (kind === 'snow')  return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M4.5 7.5l15 9M4.5 16.5l15-9"/></svg>;
    if (kind === 'alert') return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>;
    return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/></svg>;
}

export default function BrokerPortal() {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [mode, setMode] = useState('analyze'); // 'analyze' | 'chat'
    const [parsed, setParsed] = useState(null);
    const [parseErr, setParseErr] = useState('');
    const qc = useQueryClient();
    const { data: orders } = useBrokerOrders();

    const submit = async (e) => {
        e?.preventDefault?.();
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setParseErr('');

        if (mode === 'analyze') {
            try {
                const result = await parseTenderApi(trimmed);
                setParsed(result);
            } catch (err) {
                setParseErr(err.message || 'Failed to parse tender');
            } finally {
                setSending(false);
            }
            return;
        }

        setTranscript(t => [...t, { role: 'broker', text: trimmed, ts: Date.now() }]);
        setText('');
        try {
            const res = await authFetch('/v1/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, sessionId })
            });
            const data = await res.json();
            if (data.sessionId) setSessionId(data.sessionId);
            const reply = data.upstreamStatus
                ? `Google returned ${data.upstreamStatus}: ${data.upstreamError?.error?.message || ''}`
                : (data.response || '(no reply)');
            setTranscript(t => [...t, { role: 'agent', text: reply, ts: Date.now(), error: !!data.upstreamStatus }]);
            qc.invalidateQueries({ queryKey: ['broker-orders'] });
        } finally {
            setSending(false);
        }
    };

    const totalValue = (orders || []).reduce((s, o) => s + (o.rate || 0), 0);
    const inTransit = (orders || []).filter(o => o.status === 'In-Transit').length;

    return (
        <>
            <section className="brk-hero">
                <div className="brk-hero-bg" aria-hidden="true">
                    <span className="brk-hero-orb brk-hero-orb-a" />
                    <span className="brk-hero-orb brk-hero-orb-b" />
                    <span className="brk-hero-grid" />
                </div>
                <div className="brk-hero-inner">
                    <div>
                        <div className="brk-hero-eyebrow">
                            <span className="brk-hero-spark" />
                            <span>Ingestion · AI parser</span>
                        </div>
                        <h1 className="brk-hero-title">
                            Broker portal<span className="brk-hero-accent">.</span>
                        </h1>
                        <p className="brk-hero-sub">
                            Paste a rate confirmation or load tender. The ingestion agent extracts the fields and creates the order — no forms, no fuss.
                        </p>
                    </div>
                    <div className="brk-hero-stats">
                        <Link to="/post-load" className="brk-hero-cta">
                            <span className="brk-hero-cta-icon">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14"/>
                                </svg>
                            </span>
                            <span>
                                <span className="brk-hero-cta-title">Post a load with AI</span>
                                <span className="brk-hero-cta-sub">Chat intake · dispatch approves</span>
                            </span>
                        </Link>
                        <div className="brk-hero-stat">
                            <div className="brk-hero-stat-num">{(orders || []).length}</div>
                            <div className="brk-hero-stat-label">Orders booked</div>
                        </div>
                        <div className="brk-hero-stat brk-hero-stat--move">
                            <div className="brk-hero-stat-num">{inTransit}</div>
                            <div className="brk-hero-stat-label">In transit</div>
                        </div>
                        <div className="brk-hero-stat brk-hero-stat--value">
                            <div className="brk-hero-stat-num">{formatMoney(totalValue)}</div>
                            <div className="brk-hero-stat-label">Book value</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="brk-grid">
                <section className="brk-input-card">
                    <header className="brk-card-head">
                        <div>
                            <h2 className="brk-card-title">Rate confirmation</h2>
                            <p className="brk-card-sub">
                                {mode === 'analyze'
                                    ? 'AI extracts fields, runs margin math, and recommends accept/reject.'
                                    : 'Chat with the ingestion agent — it creates the order for you.'}
                            </p>
                        </div>
                        <div className="brk-mode">
                            <button
                                type="button"
                                className={'brk-mode-tab' + (mode === 'analyze' ? ' is-on' : '')}
                                onClick={() => setMode('analyze')}
                            >AI analyzer</button>
                            <button
                                type="button"
                                className={'brk-mode-tab' + (mode === 'chat' ? ' is-on' : '')}
                                onClick={() => setMode('chat')}
                            >Chat intake</button>
                        </div>
                    </header>
                    <div className="brk-samples">
                        {SAMPLES.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                className="brk-sample"
                                onClick={() => setText(s.text)}
                                title={`Use sample: ${s.label}`}
                            >
                                <SampleIcon kind={s.icon} />
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </div>
                    <form onSubmit={submit} className="brk-form">
                        <textarea
                            className="brk-textarea"
                            placeholder={mode === 'analyze'
                                ? 'Paste the broker tender email or rate confirmation here…'
                                : 'Paste rate confirmation text here…'}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            rows={12}
                            disabled={sending}
                        />
                        <div className="brk-actions">
                            <button
                                type="submit"
                                className="brk-submit"
                                disabled={!text.trim() || sending}
                            >
                                {sending ? (
                                    <>
                                        <span className="brk-spinner" />
                                        {mode === 'analyze' ? 'Analyzing…' : 'Parsing…'}
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            {mode === 'analyze'
                                                ? <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
                                                : <path d="M12 5v14M5 12h14"/>
                                            }
                                        </svg>
                                        {mode === 'analyze' ? 'Analyze tender' : 'Parse & create order'}
                                    </>
                                )}
                            </button>
                            {(transcript.length > 0 || parsed) && (
                                <button
                                    type="button"
                                    className="brk-clear"
                                    onClick={() => { setTranscript([]); setSessionId(''); setParsed(null); setParseErr(''); }}
                                >Clear</button>
                            )}
                        </div>
                    </form>

                    {parseErr && <div className="brk-parse-err">{parseErr}</div>}

                    {mode === 'analyze' && parsed && (
                        <TenderResultCard result={parsed} />
                    )}

                    {mode === 'chat' && transcript.length > 0 && (
                        <div className="brk-transcript">
                            {transcript.map((m, i) => (
                                <div key={i} className={'brk-msg brk-msg--' + (m.role === 'broker' ? 'you' : m.error ? 'err' : 'agent')}>
                                    <div className="brk-msg-role">
                                        {m.role === 'broker' ? 'You' : m.error ? 'Error' : 'Ingestion agent'}
                                    </div>
                                    <div className="brk-msg-text">{m.text}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <aside className="brk-orders-card">
                    <header className="brk-orders-head">
                        <h2 className="brk-card-title">Recent orders</h2>
                        <span className="brk-card-count">{(orders || []).length}</span>
                    </header>
                    {!orders || orders.length === 0 ? (
                        <div className="brk-orders-empty">
                            <div className="brk-orders-empty-icon">
                                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/>
                                </svg>
                            </div>
                            <div>Book your first order from a rate confirmation to see it here.</div>
                        </div>
                    ) : (
                        <ul className="brk-orders-list">
                            {orders.slice(0, 10).map((o, i) => {
                                const meta = STATUS_META[o.status] || { tone: 'plan', label: o.status || '—' };
                                return (
                                    <li key={o.orderId} className={'brk-order brk-order--' + meta.tone} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                                        <div className="brk-order-top">
                                            <span className="brk-order-id mono">{o.orderId}</span>
                                            <span className={'brk-order-status brk-order-status--' + meta.tone}>{meta.label}</span>
                                        </div>
                                        <div className="brk-order-route">
                                            <b>{o.origin}</b>
                                            <span className="brk-order-arrow">→</span>
                                            <b>{o.destination}</b>
                                        </div>
                                        <div className="brk-order-foot">
                                            <span className="brk-order-rate">{formatMoney(o.rate)}</span>
                                            <span className="brk-order-time">{formatRelTime(o.createdAt)}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>
            </div>
        </>
    );
}
