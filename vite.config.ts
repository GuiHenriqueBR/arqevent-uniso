import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      VitePWA({
        disable: true, // Desabilitado: manifest servido via public/manifest.json; SW não é necessário
        registerType: "prompt",
        selfDestroying: true, // Remove service worker existente para evitar auto-reload
        includeAssets: ["favicon.ico", "icons/*.png"],
        manifest: {
          name: "ArqEvent UNISO",
          short_name: "ArqEvent",
          description:
            "Sistema de Gestão de Eventos Acadêmicos - Arquitetura e Urbanismo UNISO",
          theme_color: "#4f46e5",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/icons/icon-72x72.png",
              sizes: "72x72",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/icons/icon-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/icons/icon-128x128.png",
              sizes: "128x128",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/icons/icon-144x144.png",
              sizes: "144x144",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/icons/icon-152x152.png",
              sizes: "152x152",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/icons/icon-384x384.png",
              sizes: "384x384",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
          cleanupOutdatedCaches: true,
          skipWaiting: false,
          clientsClaim: false,
          navigateFallback: "index.html",
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            // Cache para Google Fonts CSS
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "google-fonts-stylesheets",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Cache para Google Fonts (arquivos de fonte)
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Cache para Supabase API - timeout reduzido para evitar loading infinito
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
                networkTimeoutSeconds: 5, // Reduzido de 30 para 5 segundos
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60, // Reduzido de 24h para 60 segundos
                },
                cacheableResponse: {
                  statuses: [200], // Removido status 0 para não cachear respostas opaque com erro
                },
              },
            },
          ],
        },
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    // Otimização de build: code splitting para carregamento mais rápido
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks para cache eficiente
            "vendor-react": ["react", "react-dom", "react-is"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-charts": ["recharts"],
            "vendor-pdf": ["jspdf"],
          },
        },
      },
      // Limite de chunk warning
      chunkSizeWarningLimit: 600,
    },
  };
});
