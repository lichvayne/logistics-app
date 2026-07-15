import { getAuth, subscribeAuth, API_BASE } from './auth.js';

let socket = null;
let socketState = 'closed';
const channelListeners = new Map();
const reconnectListeners = new Set();
const pendingFrames = [];
let backoffMs = 1000;
let currentToken = null;
let reconnectTimer = null;

function wsUrl() {
    const base = new URL(API_BASE);
    const scheme = base.protocol === 'https:' ? 'wss' : 'ws';
    const token = encodeURIComponent(currentToken || '');
    return `${scheme}://${base.host}/v1/ws/chat?token=${token}`;
}

function sendOrQueue(frame) {
    const str = JSON.stringify(frame);
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(str);
    } else {
        pendingFrames.push(str);
    }
}

function flushPending() {
    while (pendingFrames.length && socket?.readyState === WebSocket.OPEN) {
        socket.send(pendingFrames.shift());
    }
}

function resubscribeAll() {
    for (const channel of channelListeners.keys()) {
        sendOrQueue({ op: 'subscribe', channel });
    }
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        openSocket();
    }, backoffMs);
    backoffMs = Math.min(backoffMs * 2, 5000);
}

function openSocket() {
    if (socketState === 'open' || socketState === 'opening') return;
    const auth = getAuth();
    if (!auth?.token) return;
    currentToken = auth.token;
    socketState = 'opening';

    let s;
    try { s = new WebSocket(wsUrl()); }
    catch { socketState = 'closed'; scheduleReconnect(); return; }
    socket = s;

    s.addEventListener('open', () => {
        socketState = 'open';
        backoffMs = 1000;
        resubscribeAll();
        flushPending();
        reconnectListeners.forEach(fn => { try { fn(); } catch {} });
    });

    s.addEventListener('message', (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        const subs = channelListeners.get(msg.channel);
        if (!subs) return;
        subs.forEach(fn => { try { fn(msg); } catch {} });
    });

    s.addEventListener('close', () => {
        socketState = 'closed';
        socket = null;
        if (channelListeners.size > 0 && getAuth()?.token) scheduleReconnect();
    });

    s.addEventListener('error', () => {
        try { s.close(); } catch {}
    });
}

function closeSocket() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (socket) {
        try { socket.close(); } catch {}
        socket = null;
    }
    socketState = 'closed';
    pendingFrames.length = 0;
}

subscribeAuth((auth) => {
    const newToken = auth?.token || null;
    if (newToken !== currentToken) {
        closeSocket();
        currentToken = newToken;
        if (newToken && channelListeners.size > 0) openSocket();
    }
});

export function subscribe(channel, callback) {
    let subs = channelListeners.get(channel);
    if (!subs) {
        subs = new Set();
        channelListeners.set(channel, subs);
    }
    subs.add(callback);

    if (socketState === 'open') {
        sendOrQueue({ op: 'subscribe', channel });
    } else {
        openSocket();
    }

    return () => {
        const set = channelListeners.get(channel);
        if (!set) return;
        set.delete(callback);
        if (set.size === 0) {
            channelListeners.delete(channel);
            sendOrQueue({ op: 'unsubscribe', channel });
        }
    };
}

export function onReconnect(callback) {
    reconnectListeners.add(callback);
    return () => reconnectListeners.delete(callback);
}
