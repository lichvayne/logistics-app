import { useEffect, useRef } from 'react';
import { getAuth } from '../auth.js';

export default function CesMessenger({ flow, title }) {
    const hostRef = useRef(null);

    useEffect(() => {
        if (!hostRef.current) return;
        if (hostRef.current.querySelector('chat-messenger')) return;

        const auth = getAuth() || {};
        const principalId = auth.principalId || auth.username || '';
        const principalType = auth.principalType || '';
        const displayName = auth.displayName || '';

        hostRef.current.innerHTML = `
            <chat-messenger
              url-allowlist="*">
              <chat-messenger-container
                chat-title="${title}"
                chat-title-icon="https://gstatic.com/dialogflow-console/common/assets/ccai-favicons/conversational_agents.png"
                enable-file-upload
                enable-audio-input>
                <chat-reset-session-button
                  slot="titlebar-actions"
                  title-text="Start new chat"></chat-reset-session-button>
                <chat-toggle-dialog-button
                  slot="titlebar-actions"
                  title-text-expanded="Collapse"
                  title-text-collapsed="Expand"></chat-toggle-dialog-button>
                <chat-messenger-close-button
                  slot="titlebar-actions"
                  title-text="Close"></chat-messenger-close-button>
              </chat-messenger-container>
            </chat-messenger>
        `;

        const messenger = hostRef.current.querySelector('chat-messenger');
        if (!messenger) return;

        const identityMessage =
            `(principal_id: ${principalId}, principal_type: ${principalType}, display_name: ${displayName}, flow: ${flow}) __session_init__`;

        let sent = false;
        const sendIdentity = () => {
            if (sent) return;
            if (typeof messenger.sendRequest !== 'function') {
                console.warn('[CES] messenger.sendRequest is not a function — identity not injected');
                return;
            }
            try {
                messenger.sendRequest(identityMessage);
                sent = true;
                hostRef.current?.setAttribute('data-ces-init-sent', '1');
            } catch (e) {
                console.warn('[CES] sendRequest failed', e);
            }
        };

        // Try immediately in case the widget is already loaded
        sendIdentity();
        // And also on load event
        window.addEventListener('chat-messenger-loaded', sendIdentity, { once: true });

        return () => {
            window.removeEventListener('chat-messenger-loaded', sendIdentity);
        };
    }, [flow, title]);

    return <div ref={hostRef} className="ces-messenger-embed" />;
}
