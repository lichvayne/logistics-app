import { formatMoney } from '../format.js';

/**
 * Scan `text` for embedded JSON objects/arrays and split it into
 * an array of { type: 'text' | 'json', content: string | object }.
 */
export function splitByJson(text) {
    const parts = [];
    if (!text) return parts;
    let i = 0;
    let anchor = 0;

    while (i < text.length) {
        const c = text[i];
        if (c === '[' || c === '{') {
            const end = findMatchingClose(text, i);
            if (end > i) {
                const candidate = text.slice(i, end + 1);
                try {
                    const parsed = JSON.parse(candidate);
                    if (isRenderable(parsed)) {
                        if (i > anchor) parts.push({ type: 'text', content: text.slice(anchor, i) });
                        parts.push({ type: 'json', content: parsed });
                        i = end + 1;
                        anchor = i;
                        continue;
                    }
                } catch {}
            }
        }
        i++;
    }
    if (anchor < text.length) parts.push({ type: 'text', content: text.slice(anchor) });
    return parts;
}

function isRenderable(v) {
    if (Array.isArray(v)) return v.length > 0 && typeof v[0] === 'object' && v[0] !== null;
    return typeof v === 'object' && v !== null && Object.keys(v).length > 0;
}

function findMatchingClose(text, start) {
    const open = text[start];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
            if (esc) { esc = false; continue; }
            if (ch === '\\') { esc = true; continue; }
            if (ch === '"') inStr = false;
        } else {
            if (ch === '"') inStr = true;
            else if (ch === open) depth++;
            else if (ch === close) {
                depth--;
                if (depth === 0) return i;
            }
        }
    }
    return -1;
}

// ---------- Renderers ----------

const LOAD_KEYS = new Set(['load_id', 'origin', 'destination', 'payout_rate', 'deadhead_miles', 'equipment_type', 'estimated_drive_hours']);

function looksLikeLoad(obj) {
    if (!obj || typeof obj !== 'object') return false;
    let matches = 0;
    for (const k of Object.keys(obj)) if (LOAD_KEYS.has(k)) matches++;
    return matches >= 2;
}

function LoadCard({ item }) {
    return (
        <div className="sd-load-card">
            <div className="sd-load-route">
                <span>{item.origin || '—'}</span>
                <span className="sd-load-arrow">→</span>
                <span>{item.destination || '—'}</span>
            </div>
            <div className="sd-load-meta">
                {item.load_id && <span className="sd-load-id">{item.load_id}</span>}
                {item.equipment_type && <span className="sd-chip">{item.equipment_type}</span>}
                {item.deadhead_miles != null && <span className="sd-chip">{item.deadhead_miles} mi deadhead</span>}
                {item.estimated_drive_hours != null && <span className="sd-chip">{item.estimated_drive_hours}h drive</span>}
                {item.payout_rate != null && <span className="sd-payout">{formatMoney(item.payout_rate)}</span>}
            </div>
        </div>
    );
}

function KVCard({ item }) {
    const entries = Object.entries(item).filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object');
    return (
        <div className="sd-kv-card">
            <dl>
                {entries.map(([k, v]) => (
                    <div key={k}>
                        <dt>{k.replace(/_/g, ' ')}</dt>
                        <dd>{String(v)}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export function StructuredData({ data }) {
    const items = Array.isArray(data) ? data : [data];
    const asLoads = items.every(looksLikeLoad);
    return (
        <div className="sd-list">
            {items.map((item, i) =>
                asLoads
                    ? <LoadCard key={i} item={item} />
                    : <KVCard key={i} item={item} />
            )}
        </div>
    );
}
