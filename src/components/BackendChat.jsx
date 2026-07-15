import { useCallback, useEffect, useRef, useState } from 'react';
import { authFetch, getAuth, API_BASE } from '../auth.js';
import { useT } from '../i18n.jsx';
import { useMyEscalation, useEscalationMessages } from '../api.js';
import { formatRelTime } from '../format.js';

const URL_RE = /(https?:\/\/[^\s)]+)/g;
const SESSION_INIT = '__session_init__';

// CES BidiRunSession negotiated audio format. Both directions.
const VOICE_SAMPLE_RATE = 16000;

function renderText(text) {
    if (!text) return null;
    const parts = text.split(URL_RE);
    return parts.map((part, i) => {
        if (URL_RE.test(part)) {
            URL_RE.lastIndex = 0;
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer">
                    {part}
                </a>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

async function postChat(payload) {
    const res = await authFetch('/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

function downsampleBuffer(input, inputRate, targetRate) {
    if (targetRate >= inputRate) return input;
    const ratio = inputRate / targetRate;
    const outLen = Math.floor(input.length / ratio);
    const out = new Float32Array(outLen);
    let outIdx = 0;
    let inIdx = 0;
    while (outIdx < outLen) {
        const nextIdx = Math.floor((outIdx + 1) * ratio);
        let sum = 0;
        let count = 0;
        for (let i = inIdx; i < nextIdx && i < input.length; i++) {
            sum += input[i];
            count++;
        }
        out[outIdx] = count > 0 ? sum / count : 0;
        outIdx++;
        inIdx = nextIdx;
    }
    return out;
}

function floatTo16BitPCM(input) {
    const buf = new ArrayBuffer(input.length * 2);
    const view = new DataView(buf);
    for (let i = 0; i < input.length; i++) {
        let s = Math.max(-1, Math.min(1, input[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(i * 2, s, true);
    }
    return new Uint8Array(buf);
}

function bytesToBase64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
}

function base64ToInt16(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

function int16ToFloat32(int16) {
    const out = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        const s = int16[i];
        out[i] = s < 0 ? s / 0x8000 : s / 0x7FFF;
    }
    return out;
}

function voiceWsUrl(token) {
    const base = new URL(API_BASE);
    const scheme = base.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${base.host}/v1/ws/assistant/voice?token=${encodeURIComponent(token || '')}`;
}

export default function BackendChat() {
    const t = useT();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [voiceState, setVoiceState] = useState('idle'); // idle | connecting | live
    const [agentSpeaking, setAgentSpeaking] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [voiceError, setVoiceError] = useState(null);

    // When the current driver has a live escalation, switch this drawer into
    // "chat-with-dispatcher" mode: hide the AI transcript, render the
    // escalation transcript, and route sends to /v1/escalations/{id}/messages.
    const auth = getAuth();
    const isDriver = auth?.principalType === 'DRIVER';
    const { data: myEscalation } = useMyEscalation();
    const escalationId = isDriver ? myEscalation?.id : null;
    const inEscalation = !!escalationId;
    const { data: escalationMessages } = useEscalationMessages(escalationId);

    const sessionIdRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const initRunRef = useRef(false);

    // Voice session refs
    const wsRef = useRef(null);
    const captureCtxRef = useRef(null);
    const captureSourceRef = useRef(null);
    const captureProcessorRef = useRef(null);
    const streamRef = useRef(null);
    const inputSampleRateRef = useRef(48000);
    const playbackCtxRef = useRef(null);
    const playbackCursorRef = useRef(0);
    const scheduledSourcesRef = useRef(new Set());

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, liveTranscript, escalationMessages]);

    const appendAgentReply = useCallback((body) => {
        if (body?.upstreamStatus) {
            const errText = typeof body.upstreamError === 'string'
                ? body.upstreamError
                : JSON.stringify(body.upstreamError);
            setMessages(m => [...m, {
                id: crypto.randomUUID(),
                role: 'error',
                text: `${t('assistant_error')} (${body.upstreamStatus}): ${errText}`,
            }]);
            return;
        }
        const text = body?.response?.trim();
        if (text) setMessages(m => [...m, { id: crypto.randomUUID(), role: 'agent', text }]);
    }, [t]);

    const initSession = useCallback(async () => {
        setSending(true);
        try {
            const { ok, status, body } = await postChat({ message: SESSION_INIT, sessionId: null });
            if (body?.sessionId) sessionIdRef.current = body.sessionId;
            if (!ok) {
                setMessages([{
                    id: crypto.randomUUID(),
                    role: 'error',
                    text: `${t('assistant_error')} (HTTP ${status})`,
                }]);
                return;
            }
            appendAgentReply(body);
        } catch (e) {
            setMessages([{
                id: crypto.randomUUID(),
                role: 'error',
                text: `${t('assistant_error')}: ${e.message}`,
            }]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }, [appendAgentReply, t]);

    useEffect(() => {
        if (initRunRef.current) return;
        initRunRef.current = true;
        initSession();
    }, [initSession]);

    /* ---------- Playback pipeline ---------- */

    const stopPlayback = useCallback(() => {
        for (const src of scheduledSourcesRef.current) {
            try { src.stop(); } catch { /* ignore */ }
        }
        scheduledSourcesRef.current.clear();
        playbackCursorRef.current = 0;
        setAgentSpeaking(false);
    }, []);

    const enqueuePlayback = useCallback((int16) => {
        if (!int16 || int16.length === 0) return;
        let ctx = playbackCtxRef.current;
        if (!ctx) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtor) return;
            ctx = new AudioCtor({ sampleRate: VOICE_SAMPLE_RATE });
            playbackCtxRef.current = ctx;
        }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const float = int16ToFloat32(int16);
        const buffer = ctx.createBuffer(1, float.length, VOICE_SAMPLE_RATE);
        buffer.getChannelData(0).set(float);

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        const now = ctx.currentTime;
        const startAt = Math.max(now, playbackCursorRef.current);
        src.start(startAt);
        playbackCursorRef.current = startAt + buffer.duration;
        scheduledSourcesRef.current.add(src);
        setAgentSpeaking(true);
        src.onended = () => {
            scheduledSourcesRef.current.delete(src);
            if (scheduledSourcesRef.current.size === 0) setAgentSpeaking(false);
        };
    }, []);

    /* ---------- Voice session lifecycle ---------- */

    const teardownVoice = useCallback(() => {
        try { captureProcessorRef.current?.disconnect(); } catch { /* ignore */ }
        try { captureSourceRef.current?.disconnect(); } catch { /* ignore */ }
        try { captureCtxRef.current?.close(); } catch { /* ignore */ }
        streamRef.current?.getTracks().forEach(tr => tr.stop());
        captureProcessorRef.current = null;
        captureSourceRef.current = null;
        captureCtxRef.current = null;
        streamRef.current = null;

        const ws = wsRef.current;
        wsRef.current = null;
        if (ws && ws.readyState <= WebSocket.OPEN) {
            try { ws.close(1000, 'client-end'); } catch { /* ignore */ }
        }

        stopPlayback();
        // Seal any still-streaming agent bubble + drop the transient transcript.
        setMessages(m => m.map(msg =>
            msg.streaming ? { ...msg, streaming: false } : msg
        ));
        setLiveTranscript('');
        setVoiceState('idle');
    }, [stopPlayback]);

    useEffect(() => () => { teardownVoice(); }, [teardownVoice]);

    const handleServerFrame = useCallback((frame) => {
        // BidiSessionServerMessage — camelCase on the wire (matches ces-genesys-adapter).
        if (frame.interruptionSignal) {
            stopPlayback();
            return;
        }
        if (frame.endSession) {
            teardownVoice();
            return;
        }
        const rec = frame.recognitionResult?.transcript;
        if (typeof rec === 'string') {
            setLiveTranscript(rec);
        }
        const out = frame.sessionOutput;
        if (!out) return;

        if (typeof out.audio === 'string' && out.audio.length > 0) {
            try { enqueuePlayback(base64ToInt16(out.audio)); } catch { /* ignore */ }
        }

        // Text from the agent — render it in the chat as soon as it arrives.
        // CES streams text incrementally; append into the last agent bubble
        // if it's still open, otherwise start a new one. Also promote any
        // in-flight user transcript to a permanent message since the agent
        // has started responding, meaning the user's turn is done.
        if (typeof out.text === 'string' && out.text.length > 0) {
            if (liveTranscript.trim()) {
                const usr = liveTranscript.trim();
                setLiveTranscript('');
                setMessages(m => [...m, { id: crypto.randomUUID(), role: 'user', text: usr, voice: true }]);
            }
            setMessages(m => {
                const last = m[m.length - 1];
                if (last && last.role === 'agent' && last.streaming) {
                    const merged = { ...last, text: last.text + out.text };
                    return [...m.slice(0, -1), merged];
                }
                return [...m, {
                    id: crypto.randomUUID(),
                    role: 'agent',
                    text: out.text,
                    streaming: true,
                }];
            });
        }

        if (out.turnComplete || out.isFinal) {
            // Finalize: seal the streaming agent bubble and drop any lingering transcript.
            setMessages(m => m.map(msg =>
                msg.streaming ? { ...msg, streaming: false } : msg
            ));
            if (liveTranscript.trim()) {
                const usr = liveTranscript.trim();
                setLiveTranscript('');
                setMessages(m => [...m, { id: crypto.randomUUID(), role: 'user', text: usr, voice: true }]);
            }
        }
    }, [enqueuePlayback, stopPlayback, teardownVoice, liveTranscript]);

    const startVoice = useCallback(async () => {
        setVoiceError(null);
        const auth = getAuth();
        if (!auth?.token) { setVoiceError('Not signed in.'); return; }
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setVoiceError('Voice input is not supported in this browser.'); return;
        }
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) { setVoiceError('Voice input is not supported in this browser.'); return; }

        setVoiceState('connecting');

        let ws;
        try {
            ws = new WebSocket(voiceWsUrl(auth.token));
        } catch (e) {
            setVoiceError(`Voice connection failed: ${e.message}`);
            setVoiceState('idle');
            return;
        }
        wsRef.current = ws;

        ws.addEventListener('message', (evt) => {
            let frame;
            try { frame = JSON.parse(evt.data); } catch { return; }
            handleServerFrame(frame);
        });
        ws.addEventListener('close', () => {
            if (wsRef.current === ws) teardownVoice();
        });
        ws.addEventListener('error', () => {
            setVoiceError('Voice connection error.');
        });

        ws.addEventListener('open', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
                });
                streamRef.current = stream;
                const ctx = new AudioCtor();
                captureCtxRef.current = ctx;
                inputSampleRateRef.current = ctx.sampleRate;

                const source = ctx.createMediaStreamSource(stream);
                captureSourceRef.current = source;
                const processor = ctx.createScriptProcessor(2048, 1, 1);
                captureProcessorRef.current = processor;

                processor.onaudioprocess = (evt) => {
                    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                    const ch = evt.inputBuffer.getChannelData(0);
                    const down = downsampleBuffer(ch, inputSampleRateRef.current, VOICE_SAMPLE_RATE);
                    const pcm = floatTo16BitPCM(down);
                    const b64 = bytesToBase64(pcm);
                    wsRef.current.send(JSON.stringify({ realtimeInput: { audio: b64 } }));
                };

                source.connect(processor);
                processor.connect(ctx.destination);
                setVoiceState('live');
            } catch (err) {
                const name = err?.name;
                let msg = err?.message || 'Unable to access microphone.';
                if (name === 'NotAllowedError' || name === 'SecurityError') {
                    msg = 'Microphone permission was blocked. Enable it in the browser to use voice.';
                } else if (name === 'NotFoundError') {
                    msg = 'No microphone was found on this device.';
                }
                setVoiceError(msg);
                teardownVoice();
            }
        });
    }, [handleServerFrame, teardownVoice]);

    const stopVoice = useCallback(() => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify({ realtimeInput: { turnComplete: true } })); } catch { /* ignore */ }
        }
        teardownVoice();
    }, [teardownVoice]);

    const toggleVoice = () => {
        if (voiceState === 'idle') startVoice();
        else stopVoice();
    };

    /* ---------- Text send ----------
     * Routes to the escalation transcript when the driver is currently
     * connected to a live dispatcher; otherwise falls through to CES.
     */

    const send = async (e) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || sending) return;
        setInput('');
        setSending(true);
        try {
            if (inEscalation) {
                const res = await authFetch(`/v1/escalations/${escalationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                });
                if (!res.ok) {
                    setMessages(m => [...m, {
                        id: crypto.randomUUID(),
                        role: 'error',
                        text: `${t('assistant_error')} (HTTP ${res.status})`,
                    }]);
                }
                // The saved message will arrive via the escalation WS
                // subscription; no local optimistic append needed.
                return;
            }

            setMessages(m => [...m, { id: crypto.randomUUID(), role: 'user', text }]);
            const { ok, status, body } = await postChat({ message: text, sessionId: sessionIdRef.current });
            if (body?.sessionId) sessionIdRef.current = body.sessionId;
            if (!ok) {
                setMessages(m => [...m, {
                    id: crypto.randomUUID(),
                    role: 'error',
                    text: `${t('assistant_error')} (HTTP ${status})`,
                }]);
                return;
            }
            appendAgentReply(body);
        } catch (err) {
            setMessages(m => [...m, {
                id: crypto.randomUUID(),
                role: 'error',
                text: `${t('assistant_error')}: ${err.message}`,
            }]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const reset = async () => {
        teardownVoice();
        setVoiceError(null);
        sessionIdRef.current = null;
        setMessages([]);
        initRunRef.current = false;
        await initSession();
        initRunRef.current = true;
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    // While an escalation is live, the mic and reset don't make sense —
    // the driver is talking to a human, not the AI.
    useEffect(() => {
        if (inEscalation && voiceState !== 'idle') teardownVoice();
    }, [inEscalation, voiceState, teardownVoice]);

    const live = voiceState === 'live';
    const connecting = voiceState === 'connecting';
    const inputDisabled = sending || live || connecting;
    const placeholder = inEscalation
        ? `Message dispatcher${myEscalation?.claimedBy ? ' ' + myEscalation.claimedBy : ''}…`
        : live
            ? t('assistant_placeholder_listening')
            : t('assistant_placeholder');

    return (
        <div className="backend-chat">
            {inEscalation && (
                <div className="esc-banner">
                    <span className="esc-banner-dot" />
                    <span>
                        Live chat with dispatcher
                        {myEscalation.claimedBy ? ` · ${myEscalation.claimedBy}` : ' · waiting to be picked up'}
                    </span>
                </div>
            )}
            <div className="chat-messages drawer-messages">
                {inEscalation ? (
                    (escalationMessages || []).map(m => {
                        const mine = m.senderType === 'DRIVER';
                        return (
                            <div key={m.id} className={`chat-msg ${mine ? 'msg-user' : 'msg-agent'} esc-msg-${(m.senderType || '').toLowerCase()}`}>
                                <div className="msg-role">
                                    {mine ? t('assistant_you') : (m.senderName || m.senderType)}
                                    <span className="esc-msg-time"> · {formatRelTime(m.createdAt)}</span>
                                </div>
                                <div className="msg-text">{renderText(m.text)}</div>
                            </div>
                        );
                    })
                ) : (
                    <>
                        {messages.map(m => (
                            <div key={m.id} className={`chat-msg msg-${m.role}${m.voice ? ' msg-voice' : ''}`}>
                                <div className="msg-role">
                                    {m.role === 'user' ? t('assistant_you') : m.role === 'agent' ? 'Assistant' : 'Error'}
                                </div>
                                <div className="msg-text">{renderText(m.text)}</div>
                            </div>
                        ))}
                        {liveTranscript && (
                            <div className="chat-msg msg-user msg-voice msg-partial">
                                <div className="msg-role">{t('assistant_you')}</div>
                                <div className="msg-text">{liveTranscript}</div>
                            </div>
                        )}
                        {sending && (
                            <div className="chat-msg msg-agent">
                                <div className="msg-text msg-typing">…</div>
                            </div>
                        )}
                    </>
                )}
                <div ref={bottomRef} />
            </div>
            {voiceError && !inEscalation && (
                <div className="voice-error" role="alert">{voiceError}</div>
            )}
            {!inEscalation && (
                <div className="voice-toolbar">
                    {connecting && <span className="voice-indicator voice-indicator-connecting">Connecting…</span>}
                    {live && <span className="voice-indicator"><span className="voice-dot" /> {t('assistant_placeholder_listening')}</span>}
                    {agentSpeaking && <span className="voice-indicator voice-indicator-agent"><span className="voice-dot agent" /> Agent speaking</span>}
                </div>
            )}
            <form className="chat-input-row drawer-input-row" onSubmit={send}>
                {!inEscalation && (
                    <button
                        type="button"
                        className="text-btn"
                        onClick={reset}
                        disabled={sending || live || connecting}
                        title="Start new chat"
                    >
                        Reset
                    </button>
                )}
                {!inEscalation && (
                    <button
                        type="button"
                        className={'chat-mic' + (live ? ' recording' : '') + (connecting ? ' connecting' : '')}
                        onClick={toggleVoice}
                        disabled={sending && !live}
                        aria-pressed={live}
                        aria-label={live ? 'End voice session' : 'Start voice session'}
                        title={live ? 'End voice session' : 'Start voice session'}
                    >
                        {live ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="3" width="6" height="12" rx="3" />
                                <path d="M5 11a7 7 0 0 0 14 0" />
                                <line x1="12" y1="18" x2="12" y2="22" />
                                <line x1="8" y1="22" x2="16" y2="22" />
                            </svg>
                        )}
                    </button>
                )}
                <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder={placeholder}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    disabled={inputDisabled}
                    autoFocus
                />
                <button
                    type="submit"
                    className="chat-send"
                    disabled={!input.trim() || sending || live || connecting}
                >
                    {t('assistant_send')}
                </button>
            </form>
        </div>
    );
}
