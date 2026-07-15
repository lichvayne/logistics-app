import { Link } from 'react-router-dom';
import CesMessenger from '../components/CesMessenger.jsx';

export default function LoadRegisterChat() {
    return (
        <div className="rc-page">
            <div className="rc-shell">
                <header className="rc-head">
                    <div className="rc-head-brand">
                        <div>
                            <div className="rc-head-title">Post a load</div>
                            <div className="rc-head-sub">Chat or speak with the posting assistant — it'll capture the load and send it to a dispatcher for approval.</div>
                        </div>
                    </div>
                    <Link to="/login" className="rc-head-back">← Back to login</Link>
                </header>

                <CesMessenger flow="post_load" title="Post a load" />
            </div>
        </div>
    );
}
