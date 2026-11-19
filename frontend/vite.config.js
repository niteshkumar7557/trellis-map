import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward the API to the backend, so the browser only ever sees localhost:5173:
    // the refresh cookie works and no CORS is needed (design.md §10).
    proxy: { "/api": "http://localhost:4000" },
  },
});
