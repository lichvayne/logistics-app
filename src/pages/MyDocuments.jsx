import { useMyProfile } from '../api.js';
import { useT } from '../i18n.jsx';

function addYears(dateStr, years) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().slice(0, 10);
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusOf(expiresIso) {
    if (!expiresIso) return 'valid';
    const days = daysUntil(expiresIso);
    if (days < 0)  return 'expired';
    if (days < 90) return 'expiring';
    return 'valid';
}

function DocCard({ badge, title, subtitle, number, issued, expires, statusLabel, tone, kind, i }) {
    const days = daysUntil(expires);
    const daysText = days == null ? '—'
        : days < 0 ? `${-days} days ago`
        : days === 0 ? 'expires today'
        : `${days} days left`;

    const kindIcon = kind === 'cdl' ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <circle cx="8" cy="12" r="2.5"/>
            <path d="M14 10h5M14 13h5M14 16h3"/>
        </svg>
    ) : kind === 'medical' ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M3 12h18"/>
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>
        </svg>
    );

    return (
        <article
            className={'doc-card doc-card--' + tone + ' doc-card--' + kind}
            style={{ animationDelay: `${i * 80}ms` }}
        >
            <div className="doc-artwork">
                <span className="doc-artwork-glow" />
                <span className="doc-artwork-mesh" />
                <div className="doc-artwork-badge">
                    {kindIcon}
                    <span>{badge}</span>
                </div>
                <div className="doc-artwork-chip" aria-hidden="true">
                    <span /><span /><span /><span />
                </div>
                <div className="doc-artwork-number">{number || '—'}</div>
            </div>

            <div className="doc-body">
                <div className="doc-title-row">
                    <div className="doc-title-col">
                        <div className="doc-title">{title}</div>
                        <div className="doc-sub">{subtitle}</div>
                    </div>
                    <span className={'doc-status doc-status--' + tone}>
                        <span className="doc-status-dot" />
                        {statusLabel}
                    </span>
                </div>
                <dl className="doc-kv">
                    <div>
                        <dt>Number</dt>
                        <dd className="mono">{number || '—'}</dd>
                    </div>
                    <div>
                        <dt>Issued</dt>
                        <dd>{issued || '—'}</dd>
                    </div>
                    <div>
                        <dt>Expires</dt>
                        <dd>{expires || '—'}</dd>
                    </div>
                    <div>
                        <dt>Countdown</dt>
                        <dd className={'doc-countdown doc-countdown--' + tone}>{daysText}</dd>
                    </div>
                </dl>
            </div>
        </article>
    );
}

export default function MyDocuments() {
    const t = useT();
    const { data: profile, isLoading } = useMyProfile();
    if (isLoading || !profile) return <div className="loading">{t('loading')}</div>;

    const issued = profile.hiredAt || null;
    const docs = [
        {
            kind: 'cdl',
            badge: 'CDL',
            title: t('docs_cdl'),
            subtitle: t('docs_cdl_class'),
            number: profile.licenseNumber,
            issued,
            expires: addYears(issued, 5),
        },
        {
            kind: 'medical',
            badge: 'MED',
            title: t('docs_medical'),
            subtitle: t('docs_medical_issuer'),
            number: profile.personalNumber ? `MC-${profile.personalNumber.slice(-6)}` : null,
            issued,
            expires: addYears(issued, 2),
        },
        {
            kind: 'insurance',
            badge: 'INS',
            title: t('docs_insurance'),
            subtitle: t('docs_insurance_issuer'),
            number: profile.personalNumber ? `POL-${profile.personalNumber.slice(-8)}` : null,
            issued,
            expires: addYears(issued, 1),
        }
    ];

    const stats = docs.reduce((acc, d) => {
        const s = statusOf(d.expires);
        if (s === 'expired')  acc.expired++;
        if (s === 'expiring') acc.expiring++;
        if (s === 'valid')    acc.valid++;
        return acc;
    }, { valid: 0, expiring: 0, expired: 0 });

    return (
        <>
            <section className="doc-hero">
                <div className="doc-hero-bg" aria-hidden="true">
                    <span className="doc-hero-orb doc-hero-orb-a" />
                    <span className="doc-hero-orb doc-hero-orb-b" />
                </div>
                <div className="doc-hero-inner">
                    <div>
                        <div className="doc-hero-eyebrow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2h9l4 4v16H6z"/><path d="M15 2v5h4M9 12h6M9 16h6"/>
                            </svg>
                            <span>Compliance · documents</span>
                        </div>
                        <h1 className="doc-hero-title">{t('docs_title')}</h1>
                        <p className="doc-hero-sub">{t('docs_subtitle')}</p>
                    </div>
                    <div className="doc-hero-stats">
                        <div className="doc-hero-stat doc-hero-stat--valid"><div className="doc-hero-stat-num">{stats.valid}</div><div className="doc-hero-stat-label">Valid</div></div>
                        <div className={'doc-hero-stat doc-hero-stat--expiring' + (stats.expiring > 0 ? ' is-live' : '')}><div className="doc-hero-stat-num">{stats.expiring}</div><div className="doc-hero-stat-label">Expiring</div></div>
                        <div className={'doc-hero-stat doc-hero-stat--expired' + (stats.expired > 0 ? ' is-live' : '')}><div className="doc-hero-stat-num">{stats.expired}</div><div className="doc-hero-stat-label">Expired</div></div>
                    </div>
                </div>
            </section>

            <div className="doc-grid">
                {docs.map((d, i) => {
                    const s = statusOf(d.expires);
                    const label = s === 'expired' ? t('docs_status_expired')
                        : s === 'expiring' ? t('docs_status_expiring')
                        : t('docs_status_valid');
                    const tone = s === 'expired' ? 'expired' : s === 'expiring' ? 'expiring' : 'valid';
                    return <DocCard key={d.title} {...d} statusLabel={label} tone={tone} i={i} />;
                })}
            </div>
        </>
    );
}
