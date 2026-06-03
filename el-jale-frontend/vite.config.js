import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          // Leaflet / mapas
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'vendor-leaflet';
          }
          // Pusher / Echo
          if (id.includes('pusher-js') || id.includes('laravel-echo')) {
            return 'vendor-echo';
          }
          // Toast
          if (id.includes('react-hot-toast')) {
            return 'vendor-ui';
          }
          // Admin — chunk separado (solo carga en /admin)
          if (id.includes('/components/AdminDashboard')) {
            return 'chunk-admin';
          }
          // Expert dashboard
          if (id.includes('/components/ExpertDashboard') || id.includes('/components/ExpertOnboarding') || id.includes('/components/CameraCapture')) {
            return 'chunk-expert';
          }
          // Client dashboard
          if (id.includes('/components/ClientDashboard')) {
            return 'chunk-client';
          }
        },
      },
    },
  },
})
