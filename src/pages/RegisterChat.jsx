import { Link } from 'react-router-dom';
import CesMessenger from '../components/CesMessenger.jsx';

export default function RegisterChat() {
    return (
        <div className="rc-page">
            <div className="rc-shell">
                <header className="rc-head">
                    <div className="rc-head-brand">
                        <div>
                            <div className="rc-head-title">Driver intake</div>
                            <div className="rc-head-sub">Chat or speak with the intake assistant — it'll gather your info and pass it to dispatch.</div>
                        </div>
                    </div>
                    <Link to="/login" className="rc-head-back">← Back to login</Link>
                </header>

                <CesMessenger flow="register_driver" title="Driver registration" />
            </div>
        </div>
    );
}
