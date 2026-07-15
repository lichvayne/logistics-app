import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Overview from './pages/Overview.jsx';
import Drivers from './pages/Drivers.jsx';
import DriverRegister from './pages/DriverRegister.jsx';
import RegisterChat from './pages/RegisterChat.jsx';
import PendingRegistrations from './pages/PendingRegistrations.jsx';
import LoadRegisterChat from './pages/LoadRegisterChat.jsx';
import PendingLoads from './pages/PendingLoads.jsx';
import Trailers from './pages/Trailers.jsx';
import Loads from './pages/Loads.jsx';
import Orders from './pages/Orders.jsx';
import Escalations from './pages/Escalations.jsx';
import Login from './pages/Login.jsx';
import MyProfile from './pages/MyProfile.jsx';
import MyTrips from './pages/MyTrips.jsx';
import MyTruck from './pages/MyTruck.jsx';
import MyDocuments from './pages/MyDocuments.jsx';
import BrokerPortal from './pages/BrokerPortal.jsx';
import AuditLog from './pages/AuditLog.jsx';
import PublicTrack from './pages/PublicTrack.jsx';
import { getAuth, subscribeAuth, canAccess } from './auth.js';

function useAuth() {
    const [auth, setAuth] = useState(() => getAuth());
    useEffect(() => subscribeAuth(setAuth), []);
    return auth;
}

function Guard({ auth, path, children }) {
    const loc = useLocation();
    if (!auth) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
    if (!canAccess(auth.principalType, path)) {
        const home = auth.principalType === 'DRIVER' ? '/me' : '/';
        return <Navigate to={home} replace />;
    }
    return children;
}

export default function App() {
    const auth = useAuth();

    return (
        <Routes>
            <Route path="/login" element={
                auth ? <Navigate to="/" replace /> : <Login />
            } />
            <Route path="/track/:token" element={<PublicTrack />} />
            <Route path="/register"     element={<RegisterChat />} />
            <Route path="/post-load"    element={<LoadRegisterChat />} />
            <Route path="*" element={
                <Layout auth={auth}>
                    <Routes>
                        <Route path="/"            element={
                            auth?.principalType === 'DRIVER'
                                ? <Navigate to="/me" replace />
                                : auth?.principalType === 'BROKER'
                                    ? <Navigate to="/broker" replace />
                                    : <Guard auth={auth} path="/"><Overview /></Guard>
                        } />
                        <Route path="/me"           element={<Guard auth={auth} path="/me"><MyProfile /></Guard>} />
                        <Route path="/me/trips"     element={<Guard auth={auth} path="/me/trips"><MyTrips /></Guard>} />
                        <Route path="/me/truck"     element={<Guard auth={auth} path="/me/truck"><MyTruck /></Guard>} />
                        <Route path="/me/documents" element={<Guard auth={auth} path="/me/documents"><MyDocuments /></Guard>} />
                        <Route path="/broker"      element={<Guard auth={auth} path="/broker"><BrokerPortal /></Guard>} />
                        <Route path="/drivers"     element={<Guard auth={auth} path="/drivers"><Drivers /></Guard>} />
                        <Route path="/drivers/new"    element={<Guard auth={auth} path="/drivers/new"><DriverRegister /></Guard>} />
                        <Route path="/registrations"  element={<Guard auth={auth} path="/registrations"><PendingRegistrations /></Guard>} />
                        <Route path="/pending-loads"  element={<Guard auth={auth} path="/pending-loads"><PendingLoads /></Guard>} />
                        <Route path="/trailers"    element={<Guard auth={auth} path="/trailers"><Trailers /></Guard>} />
                        <Route path="/loads"       element={<Guard auth={auth} path="/loads"><Loads /></Guard>} />
                        <Route path="/orders"      element={<Guard auth={auth} path="/orders"><Orders /></Guard>} />
                        <Route path="/escalations" element={<Guard auth={auth} path="/escalations"><Escalations /></Guard>} />
                        <Route path="/audit"       element={<Guard auth={auth} path="/audit"><AuditLog /></Guard>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            } />
        </Routes>
    );
}
