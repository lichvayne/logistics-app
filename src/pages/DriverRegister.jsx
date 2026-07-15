import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerDriver } from '../api.js';

const YARDS = [
    { code: 'CHI', label: 'Chicago',        lat: 41.8781, lng:  -87.6298 },
    { code: 'DAL', label: 'Dallas',         lat: 32.7767, lng:  -96.7970 },
    { code: 'ATL', label: 'Atlanta',        lat: 33.7490, lng:  -84.3880 },
    { code: 'LAX', label: 'Los Angeles',    lat: 34.0522, lng: -118.2437 },
    { code: 'SEA', label: 'Seattle',        lat: 47.6062, lng: -122.3321 },
    { code: 'HOU', label: 'Houston',        lat: 29.7604, lng:  -95.3698 },
    { code: 'PHL', label: 'Philadelphia',   lat: 39.9526, lng:  -75.1652 },
    { code: 'DET', label: 'Detroit',        lat: 42.3314, lng:  -83.0458 },
    { code: 'MIA', label: 'Miami',          lat: 25.7617, lng:  -80.1918 },
    { code: 'STL', label: 'St. Louis',      lat: 38.6270, lng:  -90.1994 },
    { code: 'MSP', label: 'Minneapolis',    lat: 44.9778, lng:  -93.2650 },
    { code: 'CLT', label: 'Charlotte',      lat: 35.2271, lng:  -80.8431 },
    { code: 'PDX', label: 'Portland',       lat: 45.5152, lng: -122.6784 },
    { code: 'IND', label: 'Indianapolis',   lat: 39.7684, lng:  -86.1581 },
    { code: 'PIT', label: 'Pittsburgh',     lat: 40.4406, lng:  -79.9959 }
];

const SKILLS = ['dryvan', 'reefer', 'flatbed', 'hazmat', 'oversize', 'tanker'];

const EMPTY = {
    username: '', password: '', displayName: '',
    driverName: '', phoneNumber: '', licenseNumber: '', personalNumber: '',
    hiredAt: new Date().toISOString().slice(0, 10),
    homeYard: 'CHI',
    latitude: 41.8781, longitude: -87.6298,
    equipmentSkills: new Set(['dryvan']),
    photoUrl: ''
};

function fieldError(code) {
    if (code === 'username_taken')     return 'That username is already in use — pick another.';
    if (code === 'driver_name_taken')  return 'A driver with that name already exists.';
    return null;
}

export default function DriverRegister() {
    const nav = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const update = (patch) => setForm(f => ({ ...f, ...patch }));

    const pickYard = (code) => {
        const y = YARDS.find(x => x.code === code);
        if (!y) return;
        update({ homeYard: code, latitude: y.lat, longitude: y.lng });
    };

    const toggleSkill = (skill) => {
        const next = new Set(form.equipmentSkills);
        if (next.has(skill)) next.delete(skill); else next.add(skill);
        update({ equipmentSkills: next });
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const payload = {
                username: form.username.trim(),
                password: form.password,
                displayName: form.displayName.trim(),
                driverName: form.driverName.trim(),
                phoneNumber: form.phoneNumber.trim() || null,
                licenseNumber: form.licenseNumber.trim() || null,
                personalNumber: form.personalNumber.trim() || null,
                hiredAt: form.hiredAt || null,
                homeYard: form.homeYard,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
                equipmentSkills: [...form.equipmentSkills].join(','),
                photoUrl: form.photoUrl.trim() || null
            };
            await registerDriver(payload);
            nav('/drivers', { replace: true, state: { justRegistered: payload.driverName } });
        } catch (err) {
            setError(fieldError(err.code) || err.message || 'Something went wrong');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="reg-page">
            <div className="reg-head">
                <div>
                    <div className="reg-eyebrow">Fleet management</div>
                    <h1 className="reg-title">Register a new driver</h1>
                    <p className="reg-sub">Creates the driver record plus a login account they can sign in with immediately.</p>
                </div>
                <Link to="/drivers" className="reg-back">← Back to drivers</Link>
            </div>

            <form className="reg-form" onSubmit={submit}>
                <section className="reg-card">
                    <header className="reg-card-head">
                        <span className="reg-card-num">1</span>
                        <div>
                            <h2>Account</h2>
                            <p>Login credentials the driver will use in the app.</p>
                        </div>
                    </header>
                    <div className="reg-grid">
                        <label className="reg-field">
                            <span>Username <em>*</em></span>
                            <input type="text" required minLength={3} maxLength={40}
                                   value={form.username} autoComplete="off"
                                   onChange={e => update({ username: e.target.value })} />
                        </label>
                        <label className="reg-field">
                            <span>Password <em>*</em></span>
                            <input type="password" required minLength={6}
                                   value={form.password} autoComplete="new-password"
                                   onChange={e => update({ password: e.target.value })} />
                        </label>
                        <label className="reg-field reg-field--wide">
                            <span>Display name <em>*</em></span>
                            <input type="text" required value={form.displayName}
                                   placeholder="e.g. Chidi Okonkwo"
                                   onChange={e => update({ displayName: e.target.value })} />
                        </label>
                    </div>
                </section>

                <section className="reg-card">
                    <header className="reg-card-head">
                        <span className="reg-card-num">2</span>
                        <div>
                            <h2>Identity</h2>
                            <p>What we call the driver in dispatch + regulatory IDs.</p>
                        </div>
                    </header>
                    <div className="reg-grid">
                        <label className="reg-field">
                            <span>Driver name <em>*</em></span>
                            <input type="text" required value={form.driverName}
                                   placeholder="First name shown on the board"
                                   onChange={e => update({ driverName: e.target.value })} />
                        </label>
                        <label className="reg-field">
                            <span>Phone</span>
                            <input type="tel" value={form.phoneNumber}
                                   placeholder="+1 (555) 000-0000"
                                   onChange={e => update({ phoneNumber: e.target.value })} />
                        </label>
                        <label className="reg-field">
                            <span>CDL number</span>
                            <input type="text" value={form.licenseNumber}
                                   placeholder="TX-CDL-1234567"
                                   onChange={e => update({ licenseNumber: e.target.value })} />
                        </label>
                        <label className="reg-field">
                            <span>Employee ID</span>
                            <input type="text" value={form.personalNumber}
                                   placeholder="EMP-100000"
                                   onChange={e => update({ personalNumber: e.target.value })} />
                        </label>
                    </div>
                </section>

                <section className="reg-card">
                    <header className="reg-card-head">
                        <span className="reg-card-num">3</span>
                        <div>
                            <h2>Assignment</h2>
                            <p>Home yard + equipment the driver is qualified to run.</p>
                        </div>
                    </header>
                    <div className="reg-grid">
                        <label className="reg-field">
                            <span>Hire date</span>
                            <input type="date" value={form.hiredAt}
                                   onChange={e => update({ hiredAt: e.target.value })} />
                        </label>
                        <label className="reg-field">
                            <span>Home yard</span>
                            <select value={form.homeYard} onChange={e => pickYard(e.target.value)}>
                                {YARDS.map(y => (
                                    <option key={y.code} value={y.code}>{y.code} — {y.label}</option>
                                ))}
                            </select>
                        </label>
                        <label className="reg-field">
                            <span>Latitude</span>
                            <input type="number" step="0.0001" value={form.latitude}
                                   onChange={e => update({ latitude: e.target.value })} />
                        </label>
                        <label className="reg-field">
                            <span>Longitude</span>
                            <input type="number" step="0.0001" value={form.longitude}
                                   onChange={e => update({ longitude: e.target.value })} />
                        </label>
                        <div className="reg-field reg-field--wide">
                            <span>Equipment skills</span>
                            <div className="reg-skills">
                                {SKILLS.map(s => (
                                    <label key={s} className={'reg-skill' + (form.equipmentSkills.has(s) ? ' is-on' : '')}>
                                        <input type="checkbox" checked={form.equipmentSkills.has(s)}
                                               onChange={() => toggleSkill(s)} />
                                        <span>{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <label className="reg-field reg-field--wide">
                            <span>Photo URL <small>(optional)</small></span>
                            <input type="url" value={form.photoUrl}
                                   placeholder="https://…"
                                   onChange={e => update({ photoUrl: e.target.value })} />
                        </label>
                    </div>
                </section>

                {error && <div className="reg-error">{error}</div>}

                <div className="reg-actions">
                    <Link to="/drivers" className="reg-btn reg-btn--ghost">Cancel</Link>
                    <button type="submit" className="reg-btn reg-btn--primary" disabled={busy}>
                        {busy ? 'Creating…' : 'Create driver'}
                    </button>
                </div>
            </form>
        </div>
    );
}
