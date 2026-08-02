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
      registerType: 'prompt', // Mostra prompt de atualização
      // Não force precache de todos os 3D no install (deixa o update lento/travado)
      includeAssets: ['favicon.svg', 'manifest.json'],
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
        // App shell leve no precache — GLB/VRM vão para cache em runtime
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\.(?:glb|vrm)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'farmaai-3d-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      }
    })
  ],
})
