import { useEffect } from 'react';
import BackendChat from './BackendChat.jsx';
import { useT } from '../i18n.jsx';

export default function AssistantDrawer({ open, onClose }) {
    const t = useT();

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <>
            {open && <div className="drawer-backdrop" onClick={onClose} />}
            <aside className={'assistant-drawer' + (open ? ' open' : '')} aria-hidden={!open}>
                <header className="drawer-header">
                    <div>
                        <div className="drawer-title">{t('assistant_title')}</div>
                    </div>
                    <div className="drawer-actions">
                        <button className="drawer-close" onClick={onClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </header>
                <div className="assistant-drawer-body">
                    {open && <BackendChat />}
                </div>
            </aside>
        </>
    );
}
