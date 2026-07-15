import { useCallback, useRef, useState } from 'react';
import { useMyProfile, parseDocumentApi } from '../api.js';
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

const DOC_TYPES = [
    { key: 'CDL',       label: 'CDL',              blurb: 'Class, endorsements, expiration' },
    { key: 'MEDICAL',   label: 'Medical cert.',    blurb: 'DOT medical, examiner, expiry' },
    { key: 'INSURANCE', label: 'Insurance',        blurb: 'Policy #, carrier, limit, expiry' },
    { key: 'BOL',       label: 'BOL',              blurb: 'Shipper, consignee, weight, PCS' },
    { key: 'POD',       label: 'POD',              blurb: 'Signed-by, condition, exceptions' },
    { key: 'RATE_CON',  label: 'Rate confirmation', blurb: 'Broker, lane, rate, dates' },
];

function DocIntakePanel() {
    const [docType, setDocType] = useState('CDL');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [drag, setDrag] = useState(false);
    const inputRef = useRef(null);

    const pickFile = (f) => {
        if (!f) return;
        setFile(f);
        setResult(null);
        setError('');
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (f.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(f));
        } else {
            setPreviewUrl('');
        }
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDrag(false);
        pickFile(e.dataTransfer.files?.[0]);
    }, []);

    const run = async () => {
        if (!file || busy) return;
        setBusy(true);
        setError('');
        try {
            const r = await parseDocumentApi(file, docType);
            setResult(r);
        } catch (err) {
            setError(err.message || 'Failed to parse document');
        } finally {
            setBusy(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setError('');
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <section className="di-panel">
            <header className="di-head">
                <div>
                    <div className="di-eyebrow">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
                        </svg>
                        <span>AI intake · Gemini</span>
                    </div>
                    <h2 className="di-title">Upload a document — we&apos;ll fill the fields.</h2>
                    <p className="di-sub">
                        Snap or drop a CDL, medical certificate, BOL, POD, insurance card or rate confirmation.
                        The intake agent extracts fields, flags issues, and files it — no forms.
                    </p>
                </div>
            </header>

            <div className="di-body">
                <div className="di-left">
                    <div className="di-types">
                        {DOC_TYPES.map(dt => (
                            <button
                                key={dt.key}
                                type="button"
                                className={'di-type' + (docType === dt.key ? ' is-on' : '')}
                                onClick={() => setDocType(dt.key)}
                            >
                                <span className="di-type-label">{dt.label}</span>
                                <span className="di-type-blurb">{dt.blurb}</span>
                            </button>
                        ))}
                    </div>

                    <label
                        className={'di-drop' + (drag ? ' is-drag' : '') + (file ? ' has-file' : '')}
                        onDragOver={e => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={onDrop}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={e => pickFile(e.target.files?.[0])}
                            hidden
                        />
                        {previewUrl ? (
                            <img src={previewUrl} alt="preview" className="di-preview" />
                        ) : file ? (
                            <div className="di-file">
                                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2h9l4 4v16H6z"/><path d="M15 2v5h4"/>
                                </svg>
                                <span>{file.name}</span>
                            </div>
                        ) : (
                            <div className="di-drop-empty">
                                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 3v13M6 9l6-6 6 6"/><path d="M4 17v3h16v-3"/>
                                </svg>
                                <div className="di-drop-title">Drop a file or click to browse</div>
                                <div className="di-drop-sub">JPG, PNG, or PDF · up to 10 MB</div>
                            </div>
                        )}
                    </label>

                    <div className="di-actions">
                        <button
                            type="button"
                            className="di-submit"
                            disabled={!file || busy}
                            onClick={run}
                        >
                            {busy ? (
                                <><span className="di-spinner" /> Extracting…</>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
                                    </svg>
                                    Extract fields
                                </>
                            )}
                        </button>
                        {(file || result) && (
                            <button type="button" className="di-clear" onClick={reset}>Reset</button>
                        )}
                    </div>
                </div>

                <div className="di-right">
                    {error && <div className="di-error">{error}</div>}
                    {!result && !error && (
                        <div className="di-empty">
                            <div className="di-empty-badge">Awaiting upload</div>
                            <div className="di-empty-hint">
                                Extracted fields will land here in a form you can review before saving.
                            </div>
                        </div>
                    )}
                    {result && <ExtractedFields result={result} />}
                </div>
            </div>
        </section>
    );
}

function ExtractedFields({ result }) {
    const fields = result.fields || {};
    const warnings = result.warnings || [];
    const conf = Math.round((result.confidence || 0) * 100);
    const src = result.source || 'gemini';
    const entries = Object.entries(fields);

    return (
        <div className="di-result">
            <div className="di-result-head">
                <div>
                    <div className="di-result-type">{result.docType || 'DOC'}</div>
                    <div className="di-result-summary">{result.summary || 'Extracted fields'}</div>
                </div>
                <div className="di-result-meta">
                    <span>Confidence <b>{conf}%</b></span>
                    <span>Source <b className={src === 'mock' ? 'di-src-mock' : 'di-src-live'}>{src === 'mock' ? 'mock' : 'Gemini'}</b></span>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="di-empty-hint">No fields extracted.</div>
            ) : (
                <dl className="di-kv">
                    {entries.map(([k, v]) => (
                        <div key={k}>
                            <dt>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</dt>
                            <dd>
                                {Array.isArray(v)
                                    ? (v.length ? v.join(', ') : '—')
                                    : (v == null || v === '' ? '—' : String(v))}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}

            {warnings.length > 0 && (
                <ul className="di-warnings">
                    {warnings.map((w, i) => (
                        <li key={i}>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/>
                            </svg>
                            {w}
                        </li>
                    ))}
                </ul>
            )}

            <div className="di-result-actions">
                <button type="button" className="di-save">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Save to file
                </button>
                <button type="button" className="di-review">Edit before saving</button>
            </div>
        </div>
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

            <DocIntakePanel />
        </>
    );
}
