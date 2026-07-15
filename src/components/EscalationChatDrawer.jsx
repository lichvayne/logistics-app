import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authFetch } from '../auth.js';
import { useEscalationMessages } from '../api.js';
import { formatRelTime } from '../format.js';

export default function EscalationChatDrawer({ escalation, onClose, onResolved }) {
    const open = !!escalation;
    const id = escalation?.id;
    const qc = useQueryClient();
    const { data: messages } = useEscalationMessages(id);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const send = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        try {
            await authFetch(`/v1/escalations/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            setInput('');
            qc.invalidateQueries({ queryKey: ['escalation-messages', id] });
            qc.invalidateQueries({ queryKey: ['live-escalations'] });
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const resolve = async () => {
        if (!confirm('Mark this escalation as resolved?')) return;
        await authFetch(`/v1/escalations/${id}/resolve`, { method: 'POST' });
        qc.invalidateQueries({ queryKey: ['live-escalations'] });
        onResolved?.();
    };

    return (
        <>
            {open && <div className="drawer-backdrop" onClick={onClose} />}
            <aside className={'assistant-drawer' + (open ? ' open' : '')} aria-hidden={!open}>
                {escalation && (
                    <>
                        <header className="drawer-header">
                            <div>
                                <div className="drawer-title">
                                    #{escalation.id} · driver {escalation.driverName || '—'}
                                </div>
                                <div className="drawer-sub">
                                    <span className={'pill ' + (escalation.status === 'CLAIMED' ? 'warn' : 'critical')}>
                                        {escalation.status}
                                    </span>
                                    {escalation.trailerId && <> · trailer {escalation.trailerId}</>}
                                </div>
                            </div>
                            <div className="drawer-actions">
                                <button className="text-btn" onClick={resolve}>Resolve</button>
                                <button className="drawer-close" onClick={onClose} aria-label="Close">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </header>

                        <div className="chat-messages drawer-messages">
                            {(messages || []).map(m => (
                                <div key={m.id} className={'chat-msg esc-msg-' + (m.senderType || '').toLowerCase()}>
                                    <div className="msg-role">
                                        {m.senderName || m.senderType}
                                        <span className="esc-msg-time">{formatRelTime(m.createdAt)}</span>
                                    </div>
                                    <div className="msg-text">{m.text}</div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        <form className="chat-input-row drawer-input-row" onSubmit={send}>
                            <input
                                ref={inputRef}
                                className="chat-input"
                                placeholder="Type a message to the driver…"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={sending}
                                autoFocus
                            />
                            <button type="submit" className="chat-send" disabled={!input.trim() || sending}>
                                Send
                            </button>
                        </form>
                    </>
                )}
            </aside>
        </>
    );
}
