import { useEffect } from 'react';

/** Reusable right-side slide-over. `open` toggles it, children render inside. */
export default function DetailDrawer({ open, title, subtitle, onClose, children }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <>
            {open && <div className="drawer-backdrop" onClick={onClose} />}
            <aside className={'assistant-drawer detail-drawer' + (open ? ' open' : '')} aria-hidden={!open}>
                <header className="drawer-header">
                    <div>
                        <div className="drawer-title">{title}</div>
                        {subtitle && <div className="drawer-sub">{subtitle}</div>}
                    </div>
                    <button className="drawer-close" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </header>
                <div className="detail-body">
                    {children}
                </div>
            </aside>
        </>
    );
}
