import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza em background
      includeAssets: ['**/*.glb', '**/*.vrm', '**/*.png', '**/*.jpg', '**/*.svg'],
      manifest: {
        name: 'FarmaAi Metaverse',
        short_name: 'FarmaAi',
        description: 'Explore o parque no metaverso!',
        theme_color: '#15151e',
        background_color: '#15151e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        // PRECISA incluir glb e vrm no globPatterns para o Service Worker engolir
        globPatterns: ['**/*.{js,css,html,ico,png,svg,glb,vrm,jpg}'],
        // Aumentando o limite para 50MB, já que nossos VRMs tem ~20MB
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024 
      }
    })
  ],
})
