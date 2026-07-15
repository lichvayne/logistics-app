import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authFetch, getAuth, API_BASE } from './auth.js';
import { subscribe as wsSubscribe, onReconnect as wsOnReconnect } from './ws.js';

async function fetchJson(path) {
    const r = await authFetch(path, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r.json();
}

const q = (key, path) => ({ queryKey: [key], queryFn: () => fetchJson(path) });

export const useDrivers      = () => useQuery(q('drivers',      '/v1/dashboard/drivers'));
export const useTrailers     = () => useQuery(q('trailers',     '/v1/dashboard/trailers'));
export const useLoads        = () => useQuery(q('loads',        '/v1/dashboard/loads'));
export const useOrders       = () => useQuery(q('orders',       '/v1/dashboard/orders'));
export const useEscalations  = () => useQuery(q('escalations',  '/v1/dashboard/escalations'));

export const useMyProfile    = () => useQuery(q('me-profile',    '/v1/driver/me/profile'));
export const useMyDeliveries = () => useQuery(q('me-deliveries', '/v1/driver/me/deliveries'));
export const useMySummary    = () => useQuery(q('me-summary',    '/v1/driver/me/summary'));

export const useMyActivity = () => useQuery({
    queryKey: ['me-activity'],
    queryFn: () => fetchJson('/v1/driver/me/activity'),
    refetchInterval: 20000
});

export const useLiveEscalations = () => useQuery({
    queryKey: ['live-escalations'],
    queryFn: () => fetchJson('/v1/escalations'),
    refetchInterval: 4000
});

async function fetchJsonOrNull(path) {
    const r = await authFetch(path, { headers: { Accept: 'application/json' } });
    if (r.status === 204) return null;
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r.json();
}

export const useMyEscalation = () => {
    const isDriver = getAuth()?.principalType === 'DRIVER';
    return useQuery({
        queryKey: ['my-escalation'],
        queryFn: () => fetchJsonOrNull('/v1/driver/me/escalation'),
        refetchInterval: 4000,
        enabled: isDriver
    });
};

function useChatChannel({ channel, queryKey, url, enabled = true }) {
    const qc = useQueryClient();
    const query = useQuery({
        queryKey,
        queryFn: () => fetchJson(url),
        enabled
    });

    useEffect(() => {
        if (!enabled || !channel) return;
        const unsub = wsSubscribe(channel, (msg) => {
            if (msg.event !== 'message') return;
            qc.setQueryData(queryKey, (prev) => {
                const list = prev || [];
                if (list.some(x => x.id === msg.data.id)) return list;
                return [...list, msg.data];
            });
        });
        const unsubReconnect = wsOnReconnect(() => {
            qc.invalidateQueries({ queryKey });
        });
        return () => { unsub(); unsubReconnect(); };
    }, [channel, enabled, qc, JSON.stringify(queryKey)]);

    return query;
}

export const useEscalationMessages = (id) => useChatChannel({
    channel: id ? `escalation:${id}` : null,
    queryKey: ['escalation-messages', id],
    url: `/v1/escalations/${id}/messages`,
    enabled: !!id
});

export const useDriverDetail  = (name) => useQuery({
    queryKey: ['driver-detail', name],
    queryFn: () => fetchJson(`/v1/dashboard/drivers/${encodeURIComponent(name)}`),
    enabled: !!name
});

export const useTrailerDetail = (id) => useQuery({
    queryKey: ['trailer-detail', id],
    queryFn: () => fetchJson(`/v1/dashboard/trailers/${encodeURIComponent(id)}`),
    enabled: !!id
});

export const useLoadDetail    = (id) => useQuery({
    queryKey: ['load-detail', id],
    queryFn: () => fetchJson(`/v1/dashboard/loads/${encodeURIComponent(id)}`),
    enabled: !!id
});

export const useBrokerOrders = () => useQuery({
    queryKey: ['broker-orders'],
    queryFn: () => fetchJson('/v1/broker/orders'),
    refetchInterval: 5000
});

export const useSmsThread = (driverName) => useChatChannel({
    channel: driverName ? `sms:${driverName}` : null,
    queryKey: ['sms-thread', driverName],
    url: `/v1/sms/thread/${encodeURIComponent(driverName || '')}`,
    enabled: !!driverName
});

// ---- Duty status ----
export const useDutyStatus = (driverName) => useQuery({
    queryKey: ['duty-status', driverName],
    queryFn: () => fetchJson(`/v1/driver/${encodeURIComponent(driverName)}/duty-status`),
    enabled: !!driverName
});

export async function changeDutyStatus(driverName, status) {
    const r = await authFetch(`/v1/driver/${encodeURIComponent(driverName)}/duty-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || j?.message || `HTTP ${r.status}`);
    return j;
}

// ---- Arrive / Depart ----
export async function reportArrival(orderId, stopType) {
    const r = await authFetch(`/v1/tms/orders/${encodeURIComponent(orderId)}/arrive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopType })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function reportDeparture(orderId, stopType) {
    const r = await authFetch(`/v1/tms/orders/${encodeURIComponent(orderId)}/depart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopType })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

// ---- POD ----
export async function submitPod(orderId, { photoBase64, signatureName, notes }) {
    const r = await authFetch(`/v1/tms/orders/${encodeURIComponent(orderId)}/pod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64, signatureName, notes })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

// ---- Audit log ----
export const useAuditLog = (page = 0, size = 50) => useQuery({
    queryKey: ['audit-log', page, size],
    queryFn: () => fetchJson(`/v1/audit?page=${page}&size=${size}`)
});

// ---- Dispatcher ops (reassign, notify ETA, priority queue, check-calls) ----
export const usePrioritizedOrders = () => useQuery({
    queryKey: ['orders-prioritized'],
    queryFn: () => fetchJson('/v1/tms/orders/prioritized'),
    refetchInterval: 10000
});

export const useOrderNotifications = (orderId) => useQuery({
    queryKey: ['order-notifications', orderId],
    queryFn: () => fetchJson(`/v1/tms/orders/${encodeURIComponent(orderId)}/notifications`),
    enabled: !!orderId
});

export const useCheckCalls = () => useQuery({
    queryKey: ['check-calls'],
    queryFn: () => fetchJson('/v1/tms/orders/check-calls'),
    refetchInterval: 15000
});

export async function reassignOrder(orderId, driverName) {
    const r = await authFetch(`/v1/tms/orders/${encodeURIComponent(orderId)}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverName })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function notifyEta(orderId, { recipient, etaAt, note, channel }) {
    const r = await authFetch(`/v1/tms/orders/${encodeURIComponent(orderId)}/notify-eta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, etaAt, note, channel: channel || 'STUB' })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function prioritizeOrder(orderId, score) {
    const r = await authFetch(`/v1/tms/orders/${encodeURIComponent(orderId)}/prioritize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score != null ? { score } : {})
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function createTrackingLink(orderId, expiryHours = 720) {
    const r = await authFetch(`/v1/tms/orders/${encodeURIComponent(orderId)}/tracking-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryHours })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function fetchPublicTracking(token) {
    // no auth
    const r = await fetch(`${API_BASE}/v1/public/track/${encodeURIComponent(token)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function registerDriver(payload) {
    const r = await authFetch('/v1/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
        const err = new Error(j?.error || `HTTP ${r.status}`);
        err.code = j?.error;
        err.status = r.status;
        throw err;
    }
    return j;
}

export const usePendingRegistrations = () => useQuery({
    queryKey: ['pending-registrations'],
    queryFn: () => fetchJson('/v1/register/pending'),
    refetchInterval: 15000
});

export async function approvePendingRegistration(id, notes) {
    const r = await authFetch(`/v1/register/pending/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function rejectPendingRegistration(id, notes) {
    const r = await authFetch(`/v1/register/pending/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export const usePendingLoads = () => useQuery({
    queryKey: ['pending-loads'],
    queryFn: () => fetchJson('/v1/register/load'),
    refetchInterval: 15000
});

export async function approvePendingLoad(id, notes) {
    const r = await authFetch(`/v1/register/load/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function rejectPendingLoad(id, notes) {
    const r = await authFetch(`/v1/register/load/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

// ---- AI intake (Gemini-backed) ----
export async function parseDocumentApi(file, docType) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('docType', docType);
    const r = await authFetch('/v1/ai/parse-document', { method: 'POST', body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function parseTenderApi(text) {
    const r = await authFetch('/v1/ai/parse-tender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

export async function loadBriefApi(query) {
    const r = await authFetch('/v1/ai/load-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

/** CES conversational chat. Returns { sessionId, response, upstreamStatus, upstreamError, raw }. */
export async function cesChatApi(message, sessionId) {
    const r = await authFetch('/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId: sessionId || '' })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
}

