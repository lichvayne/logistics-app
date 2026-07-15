import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyProfile, useMyDeliveries, useMySummary } from '../api.js';
import { driverAvatar } from '../assets/images.js';
import { formatMoney, formatRelTime, hosLevel, initials, locationDescription } from '../format.js';
import DutyStatusWidget from '../components/DutyStatusWidget.jsx';
import HosClock from '../components/HosClock.jsx';
import TripHero from '../components/TripHero.jsx';
import WeekSnapshot from '../components/WeekSnapshot.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import AnnouncementsCard from '../components/AnnouncementsCard.jsx';
import { useT } from '../i18n.jsx';

const STATUS_META = {
    'Delivered':  { tone: 'done', label: 'Delivered' },
    'In-Transit': { tone: 'move', label: 'In transit' },
    'Scheduled':  { tone: 'plan', label: 'Scheduled' },
};

function greeting(hour) {
    if (hour < 5)  return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function useNow() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);
    return now;
}

function Avatar({ profile }) {
    const [broken, setBroken] = useState(false);
    if (broken) {
        return <div className="mp-avatar mp-avatar--fallback">{initials(profile.driverName)}</div>;
    }
    return (
        <img
            className="mp-avatar"
            src={driverAvatar(profile, 96)}
            alt={profile.driverName}
            onError={() => setBroken(true)}
        />
    );
}

export default function MyProfile() {
    const t = useT();
    const { data: profile, isLoading: pl } = useMyProfile();
    const { data: deliveries, isLoading: dl } = useMyDeliveries();
    const { data: summary, isLoading: sl } = useMySummary();
    const now = useNow();

    if (pl || dl || sl) return <div className="loading">{t('loading')}</div>;
    if (!profile) return <div className="loading">{t('loading')}</div>;

    const active = (deliveries || []).find(d => d.status === 'In-Transit')
        || (deliveries || []).find(d => d.status === 'Scheduled');
    const recent = (deliveries || []).slice(0, 5);
    const hos = hosLevel(profile.hosRemaining);
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <section className="mp-hero">
                <div className="mp-hero-bg" aria-hidden="true">
                    <span className="mp-hero-orb mp-hero-orb-a" />
                    <span className="mp-hero-orb mp-hero-orb-b" />
                    <span className="mp-hero-grid" />
                </div>
                <div className="mp-hero-inner">
                    <div className="mp-hero-lead">
                        <div className={'mp-avatar-wrap mp-avatar-wrap--' + hos}>
                            <Avatar profile={profile} />
                            <span className={'mp-avatar-dot mp-avatar-dot--' + hos} />
                        </div>
                        <div className="mp-hero-text">
                            <div className="mp-hero-eyebrow">
                                <span className="mp-hero-live" />
                                <span>{greeting(now.getHours())}</span>
                            </div>
                            <h1 className="mp-hero-title">
                                {profile.displayName || profile.driverName}<span className="mp-hero-accent">.</span>
                            </h1>
                            <p className="mp-hero-sub">
                                {dateStr} · <b>{profile.homeYard || 'unassigned yard'}</b>
                                {profile.latitude != null && (
                                    <>  · currently near <b>{locationDescription(profile.latitude, profile.longitude)}</b></>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="mp-hero-side">
                        <div className="mp-hero-clock">{timeStr}</div>
                        <div className="mp-hero-clock-label">local time</div>
                    </div>
                </div>
            </section>

            <div className="home-row home-row-hero">
                <div className="home-hos">
                    <HosClock hoursRemaining={profile.hosRemaining || 0} />
                    <DutyStatusWidget driverName={profile.driverName} />
                </div>
                <TripHero active={active} />
            </div>

            <div className="home-row home-row-3">
                <WeekSnapshot deliveries={deliveries} />
                <AnnouncementsCard />
            </div>

            <div className="home-row home-row-2">
                <ActivityFeed />

                <section className="mp-about">
                    <header className="mp-about-head">
                        <h2>About me</h2>
                        <span className="mp-about-role">{t('preset_driver')}</span>
                    </header>
                    <dl className="mp-about-list">
                        <div>
                            <dt>Phone</dt>
                            <dd>{profile.phoneNumber || <em className="mp-faint">—</em>}</dd>
                        </div>
                        <div>
                            <dt>License</dt>
                            <dd className="mono">{profile.licenseNumber || <em className="mp-faint">—</em>}</dd>
                        </div>
                        <div>
                            <dt>Home yard</dt>
                            <dd>{profile.homeYard || <em className="mp-faint">—</em>}</dd>
                        </div>
                        <div>
                            <dt>Location</dt>
                            <dd>{locationDescription(profile.latitude, profile.longitude)}</dd>
                        </div>
                    </dl>
                    <div className="mp-about-links">
                        <Link to="/me/documents" className="mp-link">
                            Documents
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                        </Link>
                        <Link to="/me/truck" className="mp-link">
                            My truck
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                        </Link>
                        <Link to="/me/trips" className="mp-link">
                            All trips
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                        </Link>
                    </div>
                </section>
            </div>

            <section className="mp-history">
                <header className="mp-history-head">
                    <h2 className="mp-history-title">Recent deliveries</h2>
                    <Link to="/me/trips" className="mp-history-link">
                        See all
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                    </Link>
                </header>
                {recent.length === 0 ? (
                    <div className="mp-empty">No deliveries yet — your first trip will appear here.</div>
                ) : (
                    <div className="mp-history-list">
                        {recent.map((d, i) => {
                            const meta = STATUS_META[d.status] || { tone: 'plan', label: d.status || '—' };
                            return (
                                <div key={d.orderId} className={'mp-history-item mp-history-item--' + meta.tone} style={{ animationDelay: `${i * 40}ms` }}>
                                    <div className="mp-history-lead">
                                        <span className="mp-history-id mono">{d.orderId}</span>
                                        <span className="mp-history-route">
                                            <b>{d.origin}</b>
                                            <span className="mp-history-arrow">→</span>
                                            <b>{d.destination}</b>
                                        </span>
                                    </div>
                                    <div className="mp-history-tail">
                                        <span className="mp-history-eq">{d.equipmentType}</span>
                                        <span className="mp-history-rate">{formatMoney(d.rate)}</span>
                                        <span className={'mp-history-status mp-history-status--' + meta.tone}>{meta.label}</span>
                                        <span className="mp-history-time">{formatRelTime(d.deliveredAt || d.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="mp-earnings">
                <div className="mp-earnings-item">
                    <div className="mp-earnings-num">{formatMoney(summary?.earningsLast7d)}</div>
                    <div className="mp-earnings-label">{t('me_last_7d', summary?.deliveriesLast7d)}</div>
                </div>
                <div className="mp-earnings-divide" />
                <div className="mp-earnings-item">
                    <div className="mp-earnings-num">{formatMoney(summary?.earningsLast30d)}</div>
                    <div className="mp-earnings-label">{t('me_last_30d', summary?.deliveriesLast30d)}</div>
                </div>
                <div className="mp-earnings-divide" />
                <div className="mp-earnings-item mp-earnings-item--total">
                    <div className="mp-earnings-num">{formatMoney(summary?.earningsAllTime)}</div>
                    <div className="mp-earnings-label">{t('me_all_time', summary?.deliveriesTotal)}</div>
                </div>
            </section>
        </>
    );
}
