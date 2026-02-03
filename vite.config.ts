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
        registerType: "autoUpdate",
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
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 horas
                },
                cacheableResponse: {
                  statuses: [0, 200],
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
  };
});
