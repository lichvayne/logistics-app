import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { canAccess, clearAuth } from '../auth.js';
import { useLang } from '../i18n.jsx';
import AssistantDrawer from './AssistantDrawer.jsx';
import DriverAssistant, { DriverAssistantFab } from './DriverAssistant.jsx';

export default function Layout({ children, auth }) {
    const nav = useNavigate();
    const { t } = useLang();
    const principalType = auth?.principalType;
    const [chatOpen, setChatOpen] = useState(false);
    const [driverAsstOpen, setDriverAsstOpen] = useState(false);
    const isDriver = principalType === 'DRIVER';

    const links = [
        { to: '/',             key: 'nav_overview' },
        { to: '/me',           key: 'driver_tab_profile',   end: true },
        { to: '/me/trips',     key: 'driver_tab_trips' },
        { to: '/me/truck',     key: 'driver_tab_truck' },
        { to: '/me/documents', key: 'driver_tab_documents' },
        { to: '/broker',      label: 'Broker' },
        { to: '/drivers',     key: 'nav_drivers' },
        { to: '/registrations', label: 'Registrations' },
        { to: '/pending-loads', label: 'Pending loads' },
        { to: '/trailers',    key: 'nav_trailers' },
        { to: '/loads',       key: 'nav_loads' },
        { to: '/orders',      key: 'nav_orders' },
        { to: '/escalations', key: 'nav_escalations' },
        { to: '/audit',       label: 'Audit' }
    ];
    const visible = links.filter(l => canAccess(principalType, l.to));

    const logout = () => {
        clearAuth();
        nav('/login', { replace: true });
    };

    const canChat = canAccess(principalType, '/assistant');

    return (
        <>
            <header className="topbar">
                <div className="topbar-inner">
                    <NavLink to="/" className="brand" end>
                        <span className="brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 17V7a1 1 0 0 1 1-1h10v11"/>
                                <path d="M14 10h4l3 4v3h-2"/>
                                <circle cx="7.5" cy="17.5" r="2"/>
                                <circle cx="17.5" cy="17.5" r="2"/>
                            </svg>
                        </span>
                        <span className="brand-name">{t('brand')}</span>
                    </NavLink>
                    <nav className="nav">
                        {visible.map(l => (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                end={l.end || l.to === '/'}
                                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                            >
                                {l.label || t(l.key)}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="topbar-right">
                        {auth && (
                            <div className="user-chip" title={`Principal: ${auth.principalType}`}>
                                <span className="user-role">{auth.principalType}</span>
                                <span className="user-name">{auth.displayName || auth.username}</span>
                                <button className="logout-btn" onClick={logout} title={t('sign_out')}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <main className="content">{children}</main>
            <footer className="app-footer">
                <div className="app-footer-inner">
                    <div className="app-footer-lead">
                        <div className="app-footer-brand">
                            <span className="app-footer-mark" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 17V7a1 1 0 0 1 1-1h10v11"/>
                                    <path d="M14 10h4l3 4v3h-2"/>
                                    <circle cx="7.5" cy="17.5" r="2"/>
                                    <circle cx="17.5" cy="17.5" r="2"/>
                                </svg>
                            </span>
                            <span className="app-footer-name">{t('brand')}</span>
                        </div>
                        <p className="app-footer-tag">
                            AI-native dispatching for modern fleets — real-time visibility from yard to delivery.
                        </p>
                    </div>
                    <div className="app-footer-cols">
                        <div className="app-footer-col">
                            <h4>Product</h4>
                            <NavLink to="/">Overview</NavLink>
                            <NavLink to="/drivers">Drivers</NavLink>
                            <NavLink to="/trailers">Trailers</NavLink>
                            <NavLink to="/loads">Loads</NavLink>
                        </div>
                        <div className="app-footer-col">
                            <h4>Operations</h4>
                            <NavLink to="/orders">Orders</NavLink>
                            <NavLink to="/escalations">Escalations</NavLink>
                            <NavLink to="/audit">Audit</NavLink>
                        </div>
                        <div className="app-footer-col">
                            <h4>Status</h4>
                            <span className="app-footer-status">
                                <span className="app-footer-status-dot" />
                                All systems operational
                            </span>
                            <span className="app-footer-meta">API v1 · Region US-East</span>
                            <span className="app-footer-meta">Data refresh · 30s</span>
                        </div>
                    </div>
                </div>
                <div className="app-footer-base">
                    <span>© {new Date().getFullYear()} {t('brand')}. All rights reserved.</span>
                    <span className="app-footer-base-meta">
                        Built with care · <span className="app-footer-heart" aria-hidden="true">♥</span>
                    </span>
                </div>
            </footer>
            {isDriver && !driverAsstOpen && (
                <DriverAssistantFab onClick={() => setDriverAsstOpen(true)} />
            )}
            {isDriver && (
                <DriverAssistant open={driverAsstOpen} onClose={() => setDriverAsstOpen(false)} />
            )}
            {!isDriver && canChat && !chatOpen && (
                <button
                    className="chat-fab"
                    onClick={() => setChatOpen(true)}
                    title={t('assistant_title')}
                    aria-label={t('assistant_title')}
                    type="button"
                >
                    <span className="chat-fab-halo" aria-hidden="true" />
                    <span className="chat-fab-ring" aria-hidden="true" />
                    <span className="chat-fab-core">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v3"/>
                            <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none"/>
                            <rect x="4" y="7" width="16" height="12" rx="3"/>
                            <circle cx="9" cy="13" r="1.4" fill="currentColor" stroke="none"/>
                            <circle cx="15" cy="13" r="1.4" fill="currentColor" stroke="none"/>
                            <path d="M9.5 16.5h5"/>
                            <path d="M2 12v3"/>
                            <path d="M22 12v3"/>
                        </svg>
                    </span>
                    <span className="chat-fab-pulse" aria-hidden="true" />
                </button>
            )}
            {!isDriver && canChat && <AssistantDrawer open={chatOpen} onClose={() => setChatOpen(false)} />}
        </>
    );
}
