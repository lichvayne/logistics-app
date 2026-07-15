import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useT } from '../i18n.jsx';

function BrandMark() {
    return (
        <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17V7a1 1 0 0 1 1-1h10v11"/>
                <path d="M14 10h4l3 4v3h-2"/>
                <circle cx="7.5" cy="17.5" r="2"/>
                <circle cx="17.5" cy="17.5" r="2"/>
            </svg>
        </span>
    );
}

export default function MarketingLayout({ children }) {
    const t = useT();
    const loc = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [loc.pathname]);

    const year = new Date().getFullYear();

    return (
        <div className="mk-shell">
            <header className={'mk-topbar' + (scrolled ? ' is-scrolled' : '')}>
                <div className="mk-topbar-inner">
                    <NavLink to="/" className="mk-brand" end>
                        <BrandMark />
                        <span className="mk-brand-name">{t('brand')}</span>
                    </NavLink>

                    <nav className={'mk-nav' + (menuOpen ? ' is-open' : '')}>
                        <NavLink to="/" end className={({ isActive }) => 'mk-nav-link' + (isActive ? ' active' : '')}>Home</NavLink>
                        <NavLink to="/about" className={({ isActive }) => 'mk-nav-link' + (isActive ? ' active' : '')}>About</NavLink>
                        <NavLink to="/career" className={({ isActive }) => 'mk-nav-link' + (isActive ? ' active' : '')}>Careers</NavLink>
                    </nav>

                    <div className="mk-top-right">
                        <Link to="/post-load" className="mk-top-link">Post a load</Link>
                        <Link to="/login" className="mk-top-cta">Sign in</Link>
                        <button
                            className="mk-menu-btn"
                            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen(v => !v)}
                            type="button"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {menuOpen
                                    ? <><path d="M6 6l12 12"/><path d="M18 6l-12 12"/></>
                                    : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>
                                }
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mk-main">{children}</main>

            <footer className="mk-footer">
                <div className="mk-footer-inner">
                    <div className="mk-footer-lead">
                        <div className="mk-footer-brand">
                            <BrandMark />
                            <span>{t('brand')}</span>
                        </div>
                        <p className="mk-footer-tag">
                            The dispatch operating system for modern trucking. Move freight, not paperwork —
                            from first pickup to final POD, all on one screen.
                        </p>
                        <div className="mk-footer-status">
                            <span className="mk-footer-status-dot" />
                            All systems operational
                            <a href="#status" className="mk-footer-status-link">status.dispatchos.io →</a>
                        </div>
                    </div>

                    <div className="mk-footer-cols mk-footer-cols--single">
                        <div className="mk-footer-col">
                            <h4>Company</h4>
                            <NavLink to="/about">About</NavLink>
                            <NavLink to="/career">Careers</NavLink>
                            <a href="#press">Press</a>
                            <a href="#contact">Contact</a>
                            <a href="mailto:hello@dispatchos.io">hello@dispatchos.io</a>
                        </div>
                    </div>
                </div>

                <div className="mk-footer-base">
                    <div className="mk-footer-base-left">
                        <span>© {year} DispatchOS, Inc.</span>
                        <span className="mk-footer-dot">·</span>
                        <a href="#privacy">Privacy</a>
                        <span className="mk-footer-dot">·</span>
                        <a href="#terms">Terms</a>
                        <span className="mk-footer-dot">·</span>
                        <a href="#dpa">DPA</a>
                    </div>
                    <div className="mk-footer-base-right">
                        <span className="mk-badge">SOC 2 Type II</span>
                        <span className="mk-badge">FMCSA registered</span>
                        <span className="mk-badge">HIPAA-ready</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
