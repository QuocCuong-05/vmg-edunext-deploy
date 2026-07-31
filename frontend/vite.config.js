import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL),
    __SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    __API_URL__: JSON.stringify(process.env.VITE_API_URL),
  },
  server: {
    port: 5173,
    allowedHosts: ['40e0a095a97866.lhr.life', '.lhr.life', 'entail-relay-dwelling.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
