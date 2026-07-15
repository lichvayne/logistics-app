import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/ai-dispatcher-web/',
    server: {
        port: 5173,
        proxy: {
            '/v1': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                ws: true
            },
            '/auth': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    }
});
