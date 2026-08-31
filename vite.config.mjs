import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        snapshot: resolve(import.meta.dirname, "tools/competitor-snapshot/index.html"),
        summerFridays: resolve(import.meta.dirname, "beauty-brands/summer-fridays/index.html"),
        summerFridaysSnapshot: resolve(import.meta.dirname, "reports/summer-fridays-competitor-snapshot/index.html"),
        monitoringGuide: resolve(import.meta.dirname, "guides/how-to-track-beauty-competitors/index.html"),
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
