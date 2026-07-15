export function formatMoney(n) {
    if (n == null) return '—';
    return '$' + Math.round(n).toLocaleString('en-US');
}

export function formatCoord(lat, lng) {
    if (lat == null || lng == null) return '—';
    const latStr = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
    return `${latStr}  ${lngStr}`;
}

export function formatRelTime(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 0) return 'now';
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
}

export function hosLevel(h) {
    if (h == null) return 'ok';
    if (h < 2) return 'critical';
    if (h < 4) return 'warn';
    return 'ok';
}

export function batteryLevel(b) {
    if (b == null) return 'ok';
    if (b < 30) return 'critical';
    if (b < 60) return 'warn';
    return 'ok';
}

export function statusPill(s) {
    const k = (s || '').toLowerCase();
    if (k === 'in-yard') return 'ok';
    if (k === 'loaded')  return 'warn';
    return 'info';
}

export function initials(name) {
    if (!name) return '??';
    return name.slice(0, 2).toUpperCase();
}

export function yardCode(spot) {
    if (!spot) return '—';
    return spot.split('-')[0];
}

// Known cities for reverse-geocoding driver / trailer coordinates without
// hitting a network service. Extend as new markets come online.
const CITIES = [
    // United States
    { name: 'Chicago',       region: 'IL', lat: 41.8781, lng:  -87.6298 },
    { name: 'Dallas',        region: 'TX', lat: 32.7767, lng:  -96.7970 },
    { name: 'Houston',       region: 'TX', lat: 29.7604, lng:  -95.3698 },
    { name: 'Los Angeles',   region: 'CA', lat: 34.0522, lng: -118.2437 },
    { name: 'Atlanta',       region: 'GA', lat: 33.7490, lng:  -84.3880 },
    { name: 'Indianapolis',  region: 'IN', lat: 39.7684, lng:  -86.1581 },
    { name: 'Seattle',       region: 'WA', lat: 47.6062, lng: -122.3321 },
    { name: 'Portland',      region: 'OR', lat: 45.5152, lng: -122.6784 },
    { name: 'Pittsburgh',    region: 'PA', lat: 40.4406, lng:  -79.9959 },
    { name: 'Philadelphia',  region: 'PA', lat: 39.9526, lng:  -75.1652 },
    { name: 'Detroit',       region: 'MI', lat: 42.3314, lng:  -83.0458 },
    { name: 'Charlotte',     region: 'NC', lat: 35.2271, lng:  -80.8431 },
    { name: 'Miami',         region: 'FL', lat: 25.7617, lng:  -80.1918 },
    { name: 'Minneapolis',   region: 'MN', lat: 44.9778, lng:  -93.2650 },
    { name: 'St. Louis',     region: 'MO', lat: 38.6270, lng:  -90.1994 },
    { name: 'New York',      region: 'NY', lat: 40.7128, lng:  -74.0060 },
    { name: 'Denver',        region: 'CO', lat: 39.7392, lng: -104.9903 },
    { name: 'Phoenix',       region: 'AZ', lat: 33.4484, lng: -112.0740 },
    // Georgia
    { name: 'Tbilisi',       region: 'GE', lat: 41.7151, lng:   44.8271 },
    { name: 'Batumi',        region: 'GE', lat: 41.6470, lng:   41.6350 },
    { name: 'Kutaisi',       region: 'GE', lat: 42.2685, lng:   42.7195 },
    { name: 'Rustavi',       region: 'GE', lat: 41.5495, lng:   45.0005 },
];

function haversineKm(lat1, lng1, lat2, lng2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export function nearestCity(lat, lng) {
    if (lat == null || lng == null) return null;
    let best = null;
    let bestKm = Infinity;
    for (const c of CITIES) {
        const km = haversineKm(lat, lng, c.lat, c.lng);
        if (km < bestKm) { best = c; bestKm = km; }
    }
    if (!best) return null;
    return { ...best, distanceKm: bestKm };
}

export function locationDescription(lat, lng) {
    const c = nearestCity(lat, lng);
    if (!c) return '—';
    const name = c.region ? `${c.name}, ${c.region}` : c.name;
    if (c.distanceKm < 15)  return name;
    if (c.distanceKm < 60)  return `Near ${name}`;
    if (c.distanceKm < 200) return `${Math.round(c.distanceKm)} km from ${name}`;
    return name;
}
