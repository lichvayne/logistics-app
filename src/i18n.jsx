import { createContext, useContext, useEffect } from 'react';

const dict = {
    // brand
    brand: 'Logistics APP',

    // nav
    nav_overview: 'Overview',
    nav_me: 'My profile',
    nav_drivers: 'Drivers',
    nav_trailers: 'Trailers',
    nav_loads: 'Loads',
    nav_orders: 'Orders',
    nav_escalations: 'Escalations',
    nav_assistant: 'Assistant',

    // common
    loading: 'Loading…',
    sign_out: 'Sign out',
    all_yards: 'All yards',
    new_chat: 'New chat',

    // login
    login_title: 'Sign in',
    login_sub: 'Use one of the demo accounts, or paste your own.',
    login_username: 'Username',
    login_password: 'Password',
    login_submit: 'Sign in',
    login_submitting: 'Signing in…',
    login_error_invalid: 'Invalid username or password',
    preset_driver: 'Driver',

    // page headers
    drivers_title: 'Drivers',
    drivers_subtitle: (n) => `${n} drivers on duty · sorted by hours remaining`,
    drivers_critical: (n) => `${n} critical`,
    drivers_col_name: 'Name',
    drivers_col_location: 'Location',
    drivers_col_hos: 'Hours remaining',
    drivers_col_status: 'Status',
    status_available: 'Available',
    status_watch: 'Watch',
    status_critical: 'Critical',

    trailers_title: 'Trailers',
    trailers_subtitle: (n, y) => `${n} trailers across ${y} yards`,
    battery: 'Battery',

    assistant_title: 'Assistant',
    assistant_subtitle: 'Chat with the Logistics agents',
    assistant_placeholder: 'Ask about drivers, loads, yards…',
    assistant_placeholder_listening: 'Listening…',
    assistant_speak: 'Speak responses',
    assistant_empty_title: 'What can I help with?',
    assistant_empty_sub: 'Try one of these, or type your own.',
    assistant_send: 'Send',
    assistant_you: 'You',
    assistant_error: 'Upstream error',
    assistant_open_maps: 'Open in Google Maps →',

    // my profile
    me_greeting: (name) => `Hi, ${name}`,
    me_subtitle: 'Your profile, current run, and delivery history',
    me_personal_number: 'Personal number',
    me_license: 'License',
    me_phone: 'Phone',
    me_hired: 'Hired',
    me_location: 'Location',
    me_hos: 'HOS remaining',
    me_current: 'Current delivery',
    me_no_active: 'No active delivery. Enjoy the break.',
    me_earnings: 'Earnings',
    me_last_7d: (n) => `Last 7 days · ${n} deliveries`,
    me_last_30d: (n) => `Last 30 days · ${n} deliveries`,
    me_all_time: (n) => `All time · ${n} deliveries`,
    me_history: 'Delivery history',
    me_count: (n) => `${n} orders`,
    me_col_order: 'Order',
    me_col_route: 'Route',
    me_col_equipment: 'Equipment',
    me_col_trailer: 'Trailer',
    me_col_rate: 'Rate',
    me_col_status: 'Status',
    me_col_when: 'When',
    delivery_delivered: 'Delivered',
    delivery_in_transit: 'In-Transit',
    delivery_scheduled: 'Scheduled',

    // driver sub-nav
    driver_tab_profile: 'Profile',
    driver_tab_trips: 'Trips',
    driver_tab_truck: 'My truck',
    driver_tab_documents: 'Documents',

    // trips page
    trips_title: 'Trips',
    trips_subtitle: (n) => `${n} deliveries · lifetime`,
    trips_filter_all: 'All',
    trips_empty: 'No trips match this filter.',

    // truck page
    truck_title: 'My truck',
    truck_subtitle: 'Current equipment on your last active run',
    truck_none_title: 'No trailer assigned right now',
    truck_none_sub: 'Once dispatch pairs you with equipment it will show up here.',
    truck_battery: 'Tracker battery',
    truck_location: 'Yard location',
    truck_landmark: 'Landmark',
    truck_last_service: 'Last inspection',
    truck_next_service: 'Next inspection due',
    truck_open_maps: 'Open in Google Maps →',

    // documents page
    docs_title: 'Documents',
    docs_subtitle: 'Your license, medical certificate, and insurance on file',
    docs_status_valid: 'Valid',
    docs_status_expiring: 'Expiring soon',
    docs_status_expired: 'Expired',
    docs_expires: (d) => `Expires ${d}`,
    docs_number: 'Number',
    docs_issued: 'Issued',
    docs_cdl: 'Commercial Driver License',
    docs_cdl_class: 'Class A · endorsements H, N, T',
    docs_medical: 'DOT Medical Certificate',
    docs_medical_issuer: 'Federal Motor Carrier Safety Administration',
    docs_insurance: 'Cargo & Liability Insurance',
    docs_insurance_issuer: 'Underwritten by TBC Insurance Group',
    docs_download: 'Download PDF'
};

const t = (key, ...args) => {
    const val = dict[key];
    if (val == null) return key;
    return typeof val === 'function' ? val(...args) : val;
};

const LangContext = createContext({ lang: 'en', t });

export function LangProvider({ children }) {
    useEffect(() => {
        document.documentElement.lang = 'en';
    }, []);

    return (
        <LangContext.Provider value={{ lang: 'en', t }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}

export function useT() {
    return useContext(LangContext).t;
}