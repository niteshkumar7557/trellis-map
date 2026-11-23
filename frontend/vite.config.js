import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The backend's plain rule functions (next topic, stuck hint). The landing page runs the
// same code on its sample student, so what it shows can't drift from what the app does
// (design.md §16). They have no imports of their own, so they run in the browser as is.
const rules = fileURLToPath(new URL("../backend/src/progress", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@rules": rules },
  },
  server: {
    // Forward the API to the backend, so the browser only ever sees localhost:5173:
    // the refresh cookie works and no CORS is needed (design.md §10).
    proxy: { "/api": "http://localhost:4000" },
    // Vite only serves files inside frontend/ by default; @rules lives one level up.
    fs: { allow: [".."] },
  },
});
