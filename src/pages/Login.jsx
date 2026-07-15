import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '../auth.js';
import { useT } from '../i18n.jsx';

const WHATSAPP_NUMBER = '+14155238886';
const WHATSAPP_E164   = '14155238886';

function waLink(text) {
    return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
}

function WhatsappPanel() {
    const [intent, setIntent] = useState('register'); // 'register' | 'load'
    const text = intent === 'register' ? 'REGISTER' : 'POST LOAD';
    const link = waLink(text);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(link)}`;

    return (
        <div className="login-wa-panel">
            <div className="login-wa-head">
                <span className="login-wa-icon" aria-hidden="true">
                    <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
                        <path d="M16 3C8.82 3 3 8.82 3 16c0 2.31.6 4.48 1.66 6.36L3 29l6.86-1.62A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.5c-1.94 0-3.83-.52-5.5-1.5l-.4-.24-4.06.96.98-3.95-.26-.4A10.44 10.44 0 0 1 5.5 16C5.5 10.2 10.2 5.5 16 5.5S26.5 10.2 26.5 16 21.8 26.5 16 26.5zm5.79-7.86c-.32-.16-1.87-.92-2.16-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.77-2.19-.18-.32-.02-.5.14-.66.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.32 1.34.52 1.8.66.76.24 1.44.21 1.99.13.61-.09 1.87-.76 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37z"/>
                    </svg>
                </span>
                <div>
                    <div className="login-wa-title">Prefer WhatsApp?</div>
                    <div className="login-wa-sub">Scan the code or message us — the bot walks you through it.</div>
                </div>
            </div>

            <div className="login-wa-body">
                <div className="login-wa-qr">
                    <img src={qrSrc} alt={`WhatsApp QR: ${text}`} width="120" height="120" />
                </div>
                <div className="login-wa-right">
                    <div className="login-wa-tabs" role="group">
                        <button
                            type="button"
                            className={'login-wa-tab' + (intent === 'register' ? ' is-on' : '')}
                            onClick={() => setIntent('register')}
                        >Register as driver</button>
                        <button
                            type="button"
                            className={'login-wa-tab' + (intent === 'load' ? ' is-on' : '')}
                            onClick={() => setIntent('load')}
                        >Post a load</button>
                    </div>
                    <div className="login-wa-number">
                        <span className="login-wa-number-label">WhatsApp</span>
                        <a href={link} target="_blank" rel="noreferrer" className="login-wa-number-value">
                            {WHATSAPP_NUMBER}
                        </a>
                    </div>
                    <div className="login-wa-hint">
                        Message <code>{text}</code> to start. Reply <code>CANCEL</code> anytime to stop.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Login() {
    const t = useT();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const nav = useNavigate();
    const loc = useLocation();
    const next = new URLSearchParams(loc.search).get('next') || '/';

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await login(username, password);
            nav(next, { replace: true });
        } catch (err) {
            setError(err.code === 'INVALID_CREDENTIALS' ? t('login_error_invalid') : err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="login-shell">
            <aside className="login-hero" style={{ backgroundImage: 'url(/img/login/hero.jpg)' }} aria-hidden="true">
                <div className="login-hero-caption">
                    <h2>{t('brand')}</h2>
                    <p>Move freight, not paperwork. Dispatchers, drivers, and brokers on one screen.</p>
                </div>
            </aside>
            <form className="login-card" onSubmit={submit}>
                <div className="login-card-main">
                    <div className="login-top">
                        <div className="login-brand">
                            <span className="brand-mark" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 17V7a1 1 0 0 1 1-1h10v11"/>
                                    <path d="M14 10h4l3 4v3h-2"/>
                                    <circle cx="7.5" cy="17.5" r="2"/>
                                    <circle cx="17.5" cy="17.5" r="2"/>
                                </svg>
                            </span>
                            <span>{t('brand')}</span>
                        </div>
                    </div>
                    <h1 className="login-title">{t('login_title')}</h1>
                    <p className="login-sub">{t('login_sub')}</p>

                    <label className="field">
                        <span>{t('login_username')}</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                            required
                        />
                    </label>

                    <label className="field">
                        <span>{t('login_password')}</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    {error && <div className="login-error">{error}</div>}

                    <button className="login-submit" type="submit" disabled={busy}>
                        {busy ? t('login_submitting') : t('login_submit')}
                    </button>
                </div>

                <aside className="login-card-side">
                    <Link to="/register" className="login-register-cta">
                        <span className="login-register-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="7" width="18" height="12" rx="3"/>
                                <circle cx="9" cy="13" r="1.2" fill="currentColor"/>
                                <circle cx="15" cy="13" r="1.2" fill="currentColor"/>
                                <path d="M12 3v4M9 19v2M15 19v2"/>
                            </svg>
                        </span>
                        <div>
                            <div className="login-register-title">New driver? Chat with our AI to register</div>
                            <div className="login-register-sub">A dispatcher will verify your docs and activate your account.</div>
                        </div>
                    </Link>

                    <Link to="/post-load" className="login-register-cta login-register-cta--alt">
                        <span className="login-register-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 17V7a1 1 0 0 1 1-1h10v11"/>
                                <path d="M14 10h4l3 4v3h-2"/>
                                <circle cx="7.5" cy="17.5" r="2"/>
                                <circle cx="17.5" cy="17.5" r="2"/>
                            </svg>
                        </span>
                        <div>
                            <div className="login-register-title">Have freight to move? Post a load</div>
                            <div className="login-register-sub">Chat your load details in — dispatch will post it to the board.</div>
                        </div>
                    </Link>

                    <WhatsappPanel />
                </aside>
            </form>
        </div>
    );
}
