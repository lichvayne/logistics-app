import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';
import './styles.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchInterval: 30_000,
            refetchOnWindowFocus: false,
            staleTime: 20_000,
            retry: 1
        }
    }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <LangProvider>
                    <App />
                </LangProvider>
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>
);
