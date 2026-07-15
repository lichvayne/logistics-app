const KEY = 'aidispatcher.auth';

// Empty = same-origin (dev via Vite proxy). In production builds, set VITE_API_BASE
// to the Cloud Run URL, e.g. https://ai-dispatcher-xxxx.a.run.app
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const listeners = new Set();

export function getAuth() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setAuth(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    listeners.forEach(fn => fn(data));
}

export function clearAuth() {
    const cur = getAuth();
    localStorage.removeItem(KEY);
    listeners.forEach(fn => fn(null));
    // Revoke server-side (fire-and-forget)
    if (cur?.token) {
        fetch(API_BASE + '/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${cur.token}` }
        }).catch(() => {});
    }
}

export function subscribeAuth(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export async function authFetch(path, opts = {}) {
    const auth = getAuth();
    const headers = { ...(opts.headers || {}) };
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
    const res = await fetch(API_BASE + path, { ...opts, headers });
    // 401 = token invalid/missing → boot to login.
    // 403 = authenticated but not allowed for this route → surface it, don't nuke the session.
    if (res.status === 401) {
        clearAuth();
        const loginPath = import.meta.env.BASE_URL + 'login';
        if (!location.pathname.startsWith(loginPath)) {
            location.replace(loginPath);
        }
    }
    return res;
}

export async function login(username, password) {
    const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
        const code = res.status === 401 ? 'INVALID_CREDENTIALS' : `HTTP_${res.status}`;
        const err = new Error(code);
        err.code = code;
        throw err;
    }
    const data = await res.json();
    setAuth(data);
    return data;
}

export const ROLE_PERMS = {
    ADMIN:      ['/','/drivers','/drivers/new','/registrations','/pending-loads','/trailers','/loads','/orders','/escalations','/assistant','/me','/me/trips','/me/truck','/me/documents','/broker','/audit'],
    DISPATCHER: ['/','/drivers','/drivers/new','/registrations','/pending-loads','/trailers','/loads','/orders','/escalations','/assistant'],
    DRIVER:     ['/me','/me/trips','/me/truck','/me/documents','/assistant'],
    BROKER:     ['/broker','/assistant','/post-load']
};

export function canAccess(principalType, path) {
    if (!principalType) return false;
    return (ROLE_PERMS[principalType] || []).includes(path);
}
