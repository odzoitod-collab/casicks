import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: [
          'localhost',
          '127.0.0.1',
          '.serveousercontent.com',
          '.ngrok.io',
          '.loca.lt',
          '.vercel.app'  // Добавляем поддержку Vercel
        ]
      },
      plugins: [react()],
      define: {
        'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL),
        'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY),
        'process.env.REACT_APP_TELEGRAM_BOT_USERNAME': JSON.stringify(env.REACT_APP_TELEGRAM_BOT_USERNAME)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js'],
              telegram: ['@twa-dev/sdk']
            }
          }
        }
      }
    };
});
