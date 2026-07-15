import { useEffect, useRef, useState } from 'react';
import { cesChatApi } from '../api.js';
import { formatMoney } from '../format.js';

const QUICK_CHIPS = [
    'How much will I take home on my next load?',
    'Fuel cost, Dallas to Atlanta reefer, $3,240',
    'Compare my next two assigned loads',
    'When do I get home this week?',
];

function fmtNum(n) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}
function fmtHours(n) { return n == null ? '—' : `${Number(n).toFixed(1)} h`; }
function fmtRate(n)  { return n == null ? '—' : `$${Number(n).toFixed(2)}/mi`; }
function verdictTone(rating) {
    if (rating === 'GOOD') return 'ok';
    if (rating === 'SKIP') return 'critical';
    return 'warn';
}

/**
 * If a CES agent reply contains a JSON block matching our brief schema,
 * extract and render the structured card. Otherwise return null and the
 * caller shows the plain text bubble.
 */
function tryExtractBrief(text) {
    if (!text) return null;
    // Look for a ```json ... ``` fenced block first, then any {...} that parses.
    const fenced = text.match(/```json\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim()
        : (text.match(/(\{[\s\S]*"kind"\s*:\s*"(single|compare)"[\s\S]*\})/) || [])[1];
    if (!candidate) return null;
    try {
        const j = JSON.parse(candidate);
        if (j && (j.kind === 'single' || j.kind === 'compare')) return j;
    } catch { /* ignore */ }
    return null;
}

function BriefCard({ brief, verdict, compact = false }) {
    if (!brief) return null;
    const load = brief.load || {};
    const costs = brief.costs || {};
    const pay = brief.payments || {};
    const time = brief.time || {};
    const tone = verdict ? verdictTone(verdict.rating) : 'ok';
    return (
        <div className={`da-brief ${compact ? 'da-brief--compact' : ''} da-brief--${tone}`}>
            <div className="da-brief-head">
                <div className="da-brief-label">{brief.label || 'Load'}</div>
                {verdict && (
                    <span className={`da-verdict da-verdict--${tone}`}>
                        <span className="da-verdict-dot" />
                        {verdict.rating || '—'}
                    </span>
                )}
            </div>
            <div className="da-brief-route">
                <b>{load.originCity || '—'}</b>
                <span className="da-brief-arrow">→</span>
                <b>{load.destinationCity || '—'}</b>
                <span className="da-brief-eq">{(load.equipment || '').replace('_', ' ')}</span>
            </div>
            <div className="da-brief-topline">
                <div>
                    <span className="da-brief-topline-label">Line-haul</span>
                    <span className="da-brief-topline-value">{formatMoney(load.rateUsd)}</span>
                </div>
                <div>
                    <span className="da-brief-topline-label">Rate/mi</span>
                    <span className="da-brief-topline-value">{fmtRate(load.ratePerMile)}</span>
                </div>
                <div>
                    <span className="da-brief-topline-label">Miles</span>
                    <span className="da-brief-topline-value">{fmtNum(load.milesEstimated)}</span>
                </div>
            </div>
            <div className="da-brief-ladder">
                <div className="da-ladder-row"><span>+ Line-haul</span><b>{formatMoney(pay.linehaulUsd)}</b></div>
                {pay.fuelSurchargeUsd > 0 && (
                    <div className="da-ladder-row"><span>+ Fuel surcharge</span><b>{formatMoney(pay.fuelSurchargeUsd)}</b></div>
                )}
                <div className="da-ladder-row"><span>+ Per-diem</span><b>{formatMoney(pay.perDiemUsd)}</b></div>
                <div className="da-ladder-sep" />
                <div className="da-ladder-row da-ladder-row--gross"><span>Gross to truck</span><b>{formatMoney(pay.grossToTruckUsd)}</b></div>
                <div className="da-ladder-row"><span>− Fuel</span><b>{formatMoney(costs.fuelUsd)}</b></div>
                <div className="da-ladder-row"><span>− Deadhead ({fmtNum(costs.deadheadMiles)} mi)</span><b>{formatMoney(costs.deadheadFuelUsd)}</b></div>
                <div className="da-ladder-row"><span>− Tolls (est.)</span><b>{formatMoney(costs.tollsEstimatedUsd)}</b></div>
                <div className="da-ladder-sep" />
                <div className="da-ladder-row da-ladder-row--takehome">
                    <span>Your take-home</span>
                    <b className="da-takehome">
                        {formatMoney(pay.driverTakeHomeUsd)}
                        <em>{pay.driverSplitPercent != null ? ` @ ${Math.round(pay.driverSplitPercent)}%` : ''}</em>
                    </b>
                </div>
            </div>
            <div className="da-brief-time">
                <div><span>Drive</span><b>{fmtHours(time.estimatedDriveHours)}</b></div>
                <div><span>Total</span><b>{fmtHours(time.estimatedTripHours)}</b></div>
                <div><span>HOS</span><b className="da-hos">{time.hosImpact || '—'}</b></div>
                {time.estimatedArrival && (
                    <div><span>Arrive</span><b>{String(time.estimatedArrival).slice(0, 16).replace('T', ' ')}</b></div>
                )}
            </div>
            {verdict && verdict.summary && (
                <div className={`da-verdict-panel da-verdict-panel--${tone}`}>
                    <div className="da-verdict-summary">{verdict.summary}</div>
                    {Array.isArray(verdict.reasons) && verdict.reasons.length > 0 && (
                        <ul className="da-verdict-reasons">
                            {verdict.reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

function AgentBubble({ text, structured }) {
    // If we detected a brief, hide the raw JSON from the bubble text.
    const cleanText = structured
        ? text.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*"kind"[\s\S]*\}/, '').trim()
        : text;

    return (
        <div className="da-msg da-msg--agent">
            <div className="da-msg-role">
                <span className="da-msg-avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
                    </svg>
                </span>
                CES agent
            </div>
            {cleanText && <div className="da-msg-text">{cleanText}</div>}
            {structured?.kind === 'single' && (
                <BriefCard brief={structured.brief} verdict={structured.verdict} />
            )}
            {structured?.kind === 'compare' && (
                <div className="da-compare-grid">
                    {(structured.briefs || []).map((b, i) => (
                        <BriefCard key={i} brief={b} compact />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DriverAssistant({ open, onClose }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState('');
    const [listening, setListening] = useState(false);
    const recRef = useRef(null);
    const bodyRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [messages, busy]);

    const toggleMic = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setError('Voice input not supported in this browser — try Chrome or Edge.');
            return;
        }
        if (listening) { recRef.current?.stop(); return; }
        const rec = new SR();
        rec.lang = 'en-US';
        rec.interimResults = true;
        rec.continuous = false;
        rec.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
            setText(transcript);
        };
        rec.onerror = (e) => {
            setListening(false);
            if (e.error !== 'aborted') setError(`Voice error: ${e.error}`);
        };
        rec.onend = () => setListening(false);
        rec.start();
        recRef.current = rec;
        setListening(true);
        setError('');
    };

    const submit = async (e) => {
        e?.preventDefault?.();
        const trimmed = text.trim();
        if (!trimmed || busy) return;
        setError('');
        setMessages(m => [...m, { role: 'user', text: trimmed }]);
        setText('');
        setBusy(true);
        try {
            const r = await cesChatApi(trimmed, sessionId);
            if (r.sessionId) setSessionId(r.sessionId);
            if (r.upstreamStatus) {
                const msg = r.upstreamError?.error?.message
                    || r.upstreamError?.message
                    || `CES returned ${r.upstreamStatus}`;
                setMessages(m => [...m, { role: 'agent', text: msg, error: true }]);
            } else {
                const responseText = r.response || '(no reply)';
                const structured = tryExtractBrief(responseText);
                setMessages(m => [...m, { role: 'agent', text: responseText, structured }]);
            }
        } catch (err) {
            setError(err.message || 'Failed to reach CES');
        } finally {
            setBusy(false);
        }
    };

    const useChip = (q) => {
        setText(q);
        setTimeout(() => document.getElementById('da-form')?.requestSubmit?.(), 30);
    };

    const reset = () => {
        setMessages([]);
        setSessionId('');
        setError('');
    };

    if (!open) return null;

    return (
        <div className="da-drawer" role="dialog" aria-label="Driver AI assistant">
            <div className="da-scrim" onClick={onClose} />
            <div className="da-panel">
                <header className="da-head">
                    <div className="da-head-left">
                        <span className="da-head-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
                            </svg>
                        </span>
                        <div>
                            <div className="da-head-title">Trip planner</div>
                            <div className="da-head-sub">
                                Talking to your CES agent
                                {sessionId && <span className="da-head-session"> · session {sessionId.slice(0, 8)}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="da-head-actions">
                        {messages.length > 0 && (
                            <button className="da-newchat" onClick={reset} title="New chat">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14"/>
                                </svg>
                                New
                            </button>
                        )}
                        <button className="da-close" onClick={onClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
                        </button>
                    </div>
                </header>

                <div className="da-body" ref={bodyRef}>
                    {messages.length === 0 && !error && (
                        <>
                            <div className="da-empty">
                                <div className="da-empty-badge">Ask about any load</div>
                                <div className="da-empty-hint">
                                    Your CES agent has access to your profile and current orders.
                                    Ask about costs, take-home, HOS, home time — voice works too.
                                </div>
                            </div>
                            <div className="da-chips">
                                {QUICK_CHIPS.map((c, i) => (
                                    <button key={i} type="button" className="da-chip" onClick={() => useChip(c)}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {messages.map((m, i) => {
                        if (m.role === 'user') {
                            return (
                                <div key={i} className="da-msg da-msg--user">
                                    <div className="da-msg-text">{m.text}</div>
                                </div>
                            );
                        }
                        if (m.error) {
                            return (
                                <div key={i} className="da-msg da-msg--err">
                                    <div className="da-msg-role">CES error</div>
                                    <div className="da-msg-text">{m.text}</div>
                                </div>
                            );
                        }
                        return <AgentBubble key={i} text={m.text} structured={m.structured} />;
                    })}

                    {busy && (
                        <div className="da-msg da-msg--agent da-msg--typing">
                            <div className="da-msg-role">
                                <span className="da-msg-avatar" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
                                    </svg>
                                </span>
                                CES agent
                            </div>
                            <div className="da-typing"><span/><span/><span/></div>
                        </div>
                    )}

                    {error && <div className="da-error">{error}</div>}
                </div>

                <form id="da-form" className="da-input" onSubmit={submit}>
                    <button
                        type="button"
                        className={'da-mic' + (listening ? ' is-on' : '')}
                        onClick={toggleMic}
                        title={listening ? 'Stop' : 'Push to talk'}
                        aria-label={listening ? 'Stop listening' : 'Start listening'}
                    >
                        {listening ? (
                            <>
                                <span className="da-mic-pulse" />
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                            </>
                        ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="3" width="6" height="12" rx="3"/>
                                <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
                            </svg>
                        )}
                    </button>
                    <textarea
                        className="da-textarea"
                        rows={1}
                        placeholder={listening ? 'Listening…' : 'Ask the agent about a load…'}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submit(e);
                            }
                        }}
                        disabled={busy}
                    />
                    <button className="da-send" type="submit" disabled={!text.trim() || busy}>
                        {busy ? (
                            <span className="da-spinner" />
                        ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12h16M13 6l6 6-6 6"/>
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export function DriverAssistantFab({ onClick }) {
    return (
        <button className="da-fab" onClick={onClick} type="button" aria-label="Open trip planner">
            <span className="da-fab-halo" aria-hidden="true" />
            <span className="da-fab-core">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
                </svg>
            </span>
            <span className="da-fab-label">Trip planner</span>
        </button>
    );
}
