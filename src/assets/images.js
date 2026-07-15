// Real photo sources for the demo. No cartoon / generated avatars.
// - Drivers: randomuser.me — stable 512px portraits of real people.
// - Trucks (tractor cabs): loremflickr.com — real Flickr photos, locked by seed.
// - Trailers: local /public/img/trailers/*.jpg — already curated, high-res.
// - Loads: loremflickr.com by equipment type — real cargo photos.

const DRIVER_POOL = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/45.jpg',
    'https://randomuser.me/api/portraits/women/68.jpg',
    'https://randomuser.me/api/portraits/men/12.jpg',
    'https://randomuser.me/api/portraits/women/22.jpg',
    'https://randomuser.me/api/portraits/men/76.jpg',
    'https://randomuser.me/api/portraits/women/33.jpg',
    'https://randomuser.me/api/portraits/men/85.jpg',
    'https://randomuser.me/api/portraits/women/17.jpg',
    'https://randomuser.me/api/portraits/men/54.jpg',
    'https://randomuser.me/api/portraits/women/90.jpg'
];

const TRUCK_POOL = [
    'https://loremflickr.com/900/600/semi-truck,cab,freightliner/all?lock=101',
    'https://loremflickr.com/900/600/semi-truck,cab,kenworth/all?lock=102',
    'https://loremflickr.com/900/600/semi-truck,cab,peterbilt/all?lock=103',
    'https://loremflickr.com/900/600/semi-truck,cab,volvo/all?lock=104',
    'https://loremflickr.com/900/600/semi-truck,tractor,cab/all?lock=105',
    'https://loremflickr.com/900/600/semi-truck,cab,mack/all?lock=106',
    'https://loremflickr.com/900/600/semi-truck,highway,cab/all?lock=107',
    'https://loremflickr.com/900/600/semi-truck,cab,red/all?lock=108'
];

const LOAD_POOLS = {
    Reefer: [
        'https://loremflickr.com/800/600/refrigerated,cargo,cold-storage/all?lock=201',
        'https://loremflickr.com/800/600/refrigerated,pallets,frozen-food/all?lock=202',
        'https://loremflickr.com/800/600/cold-storage,warehouse,pallets/all?lock=203',
        'https://loremflickr.com/800/600/produce,pallets,cargo/all?lock=204',
        'https://loremflickr.com/800/600/reefer,trailer,loading/all?lock=205'
    ],
    Flatbed: [
        'https://loremflickr.com/800/600/flatbed,lumber,cargo/all?lock=301',
        'https://loremflickr.com/800/600/flatbed,steel,construction/all?lock=302',
        'https://loremflickr.com/800/600/flatbed,pipes,industrial/all?lock=303',
        'https://loremflickr.com/800/600/flatbed,machinery,cargo/all?lock=304',
        'https://loremflickr.com/800/600/flatbed,timber,logs/all?lock=305'
    ],
    'Dry Van': [
        'https://loremflickr.com/800/600/warehouse,pallets,boxes/all?lock=401',
        'https://loremflickr.com/800/600/loading-dock,pallets,cargo/all?lock=402',
        'https://loremflickr.com/800/600/warehouse,cardboard,boxes/all?lock=403',
        'https://loremflickr.com/800/600/freight,pallets,forklift/all?lock=404',
        'https://loremflickr.com/800/600/warehouse,stacked-boxes,cargo/all?lock=405'
    ]
};
const LOAD_DEFAULT_POOL = LOAD_POOLS['Dry Van'];

const TRAILER_POOL = [
    '/img/trailers/u1.jpg',
    '/img/trailers/u2.jpg',
    '/img/trailers/u3.jpg',
    '/img/trailers/u4.jpg',
    '/img/trailers/u5.jpg',
    '/img/trailers/u7.jpg',
    '/img/trailers/u8.jpg',
    '/img/trailers/u9.jpg',
    '/img/trailers/u10.jpg',
    '/img/trailers/u11.jpg',
    '/img/trailers/u12.jpg',
    '/img/trailers/u13.jpg',
    '/img/trailers/u14.jpg'
];

function hash(str) {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function pick(pool, seed) {
    return pool[hash(seed) % pool.length];
}

export function driverAvatar(driverOrName) {
    if (driverOrName && typeof driverOrName === 'object') {
        if (driverOrName.photoUrl) return driverOrName.photoUrl;
        const name = driverOrName.driverName || driverOrName.displayName || 'unknown';
        return pick(DRIVER_POOL, name);
    }
    return pick(DRIVER_POOL, driverOrName || 'unknown');
}

export function trailerImage(trailerOrId) {
    if (trailerOrId && typeof trailerOrId === 'object') {
        if (trailerOrId.photoUrl) return trailerOrId.photoUrl;
        return pick(TRAILER_POOL, trailerOrId.trailerId || '');
    }
    return pick(TRAILER_POOL, trailerOrId || '');
}

export function truckImage(source) {
    if (source && typeof source === 'object') {
        const seed = source.driverName || source.trailerId || source.orderId || 'cab';
        return pick(TRUCK_POOL, seed);
    }
    return pick(TRUCK_POOL, source || 'cab');
}

export function loadImage(order) {
    const equip = order?.equipmentType;
    const pool = LOAD_POOLS[equip] || LOAD_DEFAULT_POOL;
    const seed = order?.orderId || order?.loadId || equip || 'load';
    return pick(pool, seed);
}

export const TRAILER_FALLBACK =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#F1F5F9"/>
  <g fill="#1E40AF" fill-opacity="0.85">
    <rect x="80" y="180" width="360" height="110" rx="6"/>
    <rect x="440" y="200" width="110" height="90" rx="6"/>
    <circle cx="180" cy="300" r="18" fill="#0F172A"/>
    <circle cx="260" cy="300" r="18" fill="#0F172A"/>
    <circle cx="490" cy="300" r="18" fill="#0F172A"/>
  </g>
  <text x="320" y="90" text-anchor="middle" fill="#64748B"
        font-family="system-ui,sans-serif" font-size="18" font-weight="500">
    Trailer
  </text>
</svg>`);

export const LOAD_FALLBACK =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="#F1F5F9"/>
  <g fill="#334155" fill-opacity="0.85">
    <rect x="130" y="200" width="160" height="140" rx="4"/>
    <rect x="300" y="170" width="200" height="170" rx="4"/>
    <rect x="180" y="340" width="330" height="30" fill="#94A3B8"/>
  </g>
  <text x="320" y="120" text-anchor="middle" fill="#64748B"
        font-family="system-ui,sans-serif" font-size="20" font-weight="500">
    Load
  </text>
</svg>`);

export const TRUCK_FALLBACK = TRAILER_FALLBACK;
